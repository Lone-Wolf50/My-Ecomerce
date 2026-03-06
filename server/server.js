import express       from "express";
import nodemailer     from "nodemailer";
import cors          from "cors";
import axios         from "axios";
import crypto        from "crypto";
import escapeHtml    from "escape-html";
import helmet        from "helmet";
import rateLimit     from "express-rate-limit";

import { config } from "dotenv";
config();
// ── Validate required env vars on startup ──────────────────────
const REQUIRED_ENV = ["PAYSTACK_SECRET_KEY", "GMAIL_USER", "GMAIL_PASS", "ADMIN_SECRET_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var: ${key}`);
    // NOTE: process.exit() removed — it would kill the Vercel serverless runtime on cold start
  }
}

const PAYSTACK_SECRET_KEY  = process.env.PAYSTACK_SECRET_KEY;
const ADMIN_SECRET_TOKEN   = process.env.ADMIN_SECRET_TOKEN;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IS_DEV = process.env.NODE_ENV !== "production";

const log = {
  info:  (msg)      => IS_DEV && console.log(`[INFO] ${msg}`),
  warn:  (msg)      => IS_DEV && console.warn(`[WARN] ${msg}`),
  error: (msg, err) => {
    if (IS_DEV) console.error(`[ERROR] ${msg}`, err?.message || "");
    else        console.error(`[ERROR] ${msg}`);
  },
};

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// Needed for express-rate-limit to work correctly behind Vercel's proxy
app.set("trust proxy", 1);

// ── CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  ...(IS_DEV ? ["http://localhost:3000", "http://localhost:5173"] : []),
  "https://my-ecomerce-gygn.vercel.app",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && IS_DEV) return callback(null, true);
    if (origin && allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS policy violation"));
  },
  methods: ["GET", "POST"],
  credentials: true,
}));

// Handle CORS preflight for all routes
app.options(/.*/, cors());

// ── Rate limiters ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many attempts. Please wait before retrying." },
});

// Strict limiter for email-sending endpoints — prevents abuse
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, error: "Email limit reached. Please try again later." },
});
// NOTE: For production with multiple processes/dynos, replace MemoryStore with
// a Redis store: npm install rate-limit-redis ioredis
// then: store: new RedisStore({ client: redisClient })

// ── Admin auth middleware ───────────────────────────────────────
// Admin email endpoints require a secret token in the x-admin-token header.
// Set ADMIN_SECRET_TOKEN in your .env — never expose it to the frontend.
function requireAdminToken(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized." });
  // Constant-time comparison prevents timing attacks
  try {
    const provided = Buffer.from(String(token));
    const expected = Buffer.from(ADMIN_SECRET_TOKEN);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }
  } catch {
    return res.status(401).json({ success: false, error: "Unauthorized." });
  }
  next();
}

// ── Idempotency store (in-memory; swap for Redis in production) ─
// Prevents the same orderId being emailed more than once per event type.
const emailSentLog = new Map(); // key: "type:orderId" → timestamp
const EMAIL_DEDUP_TTL = 60 * 60 * 1000; // 1 hour

function isAlreadySent(type, orderId) {
  const key = `${type}:${orderId}`;
  const ts  = emailSentLog.get(key);
  if (ts && Date.now() - ts < EMAIL_DEDUP_TTL) return true;
  emailSentLog.set(key, Date.now());
  return false;
}
// Clean expired dedup entries every hour
setInterval(() => {
  const cutoff = Date.now() - EMAIL_DEDUP_TTL;
  for (const [key, ts] of emailSentLog) {
    if (ts < cutoff) emailSentLog.delete(key);
  }
}, 60 * 60 * 1000);

// ── Input validators ────────────────────────────────────────────
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^\d{10}$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OTP_RE   = /^\d{6}$/;
const REF_RE   = /^[A-Za-z0-9_\-]{6,64}$/;

const isValidEmail = (v) => typeof v === "string" && EMAIL_RE.test(v.trim());
const isValidPhone = (v) => typeof v === "string" && PHONE_RE.test(v.trim());
const isValidUuid  = (v) => typeof v === "string" && UUID_RE.test(v.trim());
const isValidOtp   = (v) => typeof v === "string" && OTP_RE.test(v.trim());
const isValidRef   = (v) => typeof v === "string" && REF_RE.test(v.trim());
const safeStr      = (v, max = 200) => typeof v === "string" ? escapeHtml(v.trim()).slice(0, max) : "";

// ── Supabase price lookup (server-side — never trust client prices) ─
async function fetchProductPrices(productIds) {
  // Uses service role key so RLS doesn't block reads
  const url = `${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(",")})&select=id,price`;
  const res = await fetch(url, {
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch product prices from DB");
  return res.json(); // [{ id, price }, ...]
}

// ── OTP store ───────────────────────────────────────────────────
const otpStore    = new Map();
const OTP_TTL_MS  = 2 * 60 * 1000;
const OTP_MAX_TRY = 5;

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
function storeOtp(email, otp) {
  otpStore.set(email.toLowerCase(), {
    hash:      hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts:  0,
  });
}
function verifyAndConsumeOtp(email, otp) {
  const key    = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record)                        return { ok: false, reason: "No OTP found for this email." };
  if (Date.now() > record.expiresAt)  { otpStore.delete(key); return { ok: false, reason: "OTP has expired." }; }
  if (record.attempts >= OTP_MAX_TRY) { otpStore.delete(key); return { ok: false, reason: "Too many failed attempts." }; }

  record.attempts++;
  const match = crypto.timingSafeEqual(
    Buffer.from(record.hash),
    Buffer.from(hashOtp(otp))
  );
  if (!match) return { ok: false, reason: "Invalid OTP." };

  otpStore.delete(key);
  return { ok: true };
}

// Cleanup expired OTPs every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [email, rec] of otpStore) {
    if (now > rec.expiresAt) otpStore.delete(email);
  }
}, 5 * 60 * 1000);

// ── Nodemailer ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

// ══════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── 1. Paystack Webhook ────────────────────────────────────────
// NOTE: This only verifies the signature and acknowledges Paystack.
// Emails are sent deliberately by the admin via status-change endpoints,
// NOT here — removing this as an email trigger prevents duplicate sends.
app.post("/paystack-webhook", express.raw({ type: "application/json", limit: "64kb" }), async (req, res) => {
  const sig  = req.headers["x-paystack-signature"];
  const body = req.body;

  if (!sig) return res.status(401).send("Missing signature");

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig))) {
    log.warn("Webhook signature mismatch — possible forged request");
    return res.status(401).send("Signature mismatch");
  }

  let event;
  try { event = JSON.parse(body); }
  catch { return res.status(400).send("Bad JSON"); }

  // Acknowledge receipt — email is handled by admin status updates only
  if (event.event === "charge.success") {
    log.info("Webhook charge.success acknowledged (no email sent — admin controls status emails)");
  }

  res.sendStatus(200);
});

// ── 2. Pre-flight order validation ────────────────────────────
app.post("/validate-order", async (req, res) => {
  const { user_id, customer_name, customer_email, phone_number, delivery_method, cart } = req.body;

  const errors = [];

  if (!isValidUuid(user_id))          errors.push("Invalid user identity.");
  if (!safeStr(customer_name, 100))   errors.push("Customer name is required.");
  if (!isValidEmail(customer_email))  errors.push("Invalid email address.");
  if (!isValidPhone(phone_number))    errors.push("Phone must be exactly 10 digits.");
  if (!["pickup", "delivery"].includes(delivery_method)) errors.push("Invalid delivery method.");
  if (!Array.isArray(cart) || cart.length === 0) errors.push("Cart is empty.");

  // ── [FIX: CART-SIZE-BOMB] Cap cart size ──
  const MAX_CART_ITEMS = 50;
  if (Array.isArray(cart) && cart.length > MAX_CART_ITEMS) {
    errors.push(`Cart cannot exceed ${MAX_CART_ITEMS} items.`);
  }

  if (Array.isArray(cart) && cart.length <= MAX_CART_ITEMS) {
    for (const item of cart) {
      if (!isValidUuid(String(item.id)) && typeof item.id !== "number") errors.push("Invalid product in cart.");
      if (typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 100) errors.push("Invalid quantity.");
      // NOTE: We no longer validate client-supplied price here — we fetch from DB below
    }
  }

  if (errors.length > 0) {
    log.warn("Order validation failed");
    return res.status(422).json({ success: false, errors });
  }

  // ── [FIX: VALIDATE-PRICE] Fetch authoritative prices from DB ──
  let dbProducts;
  try {
    const productIds = cart.map(i => String(i.id));
    dbProducts = await fetchProductPrices(productIds);
  } catch (err) {
    log.error("DB price lookup failed", err);
    return res.status(500).json({ success: false, error: "Could not verify product prices. Try again." });
  }

  const priceMap = Object.fromEntries(dbProducts.map(p => [String(p.id), p.price]));

  // Reject if any product ID not found in DB
  for (const item of cart) {
    if (priceMap[String(item.id)] === undefined) {
      return res.status(422).json({ success: false, error: "One or more products no longer exist." });
    }
  }

  // Compute subtotal from DB prices only — client prices are ignored
  const subtotal    = cart.reduce((sum, item) => sum + (priceMap[String(item.id)] * item.quantity), 0);
  const FLAT_FEE    = 0.50;
  const PCT_RATE    = 0.015;
  const FEE_CAP     = 2.00;
  const uncappedFee = (subtotal + FLAT_FEE) * PCT_RATE / (1 - PCT_RATE) + FLAT_FEE;
  const actualFee   = Math.min(uncappedFee, FEE_CAP);
  const chargeGHS   = parseFloat((subtotal + actualFee).toFixed(2));
  const chargeKobo  = Math.ceil(chargeGHS * 100);

  log.info("Order pre-validated successfully");
  res.json({
    success: true,
    message: "Order pre-validated. Proceed to payment.",
    subtotal: parseFloat(subtotal.toFixed(2)),
    fee:      parseFloat(actualFee.toFixed(2)),
    total:    chargeGHS,
    amount_pesewas: chargeKobo,
  });
});

// ── 3. Initialize Paystack payment ────────────────────────────
app.post("/initialize-payment", async (req, res) => {
  const { email, amount, metadata } = req.body;

  if (!isValidEmail(email))                      return res.status(422).json({ success: false, error: "Invalid email." });
  if (typeof amount !== "number" || amount <= 0) return res.status(422).json({ success: false, error: "Invalid amount." });

  // ── [FIX: METADATA-UNVALIDATED] Whitelist only known safe metadata fields ──
  const safeMetadata = {};
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    if (isValidUuid(String(metadata.orderId   || ""))) safeMetadata.orderId   = metadata.orderId;
    if (isValidUuid(String(metadata.userId    || ""))) safeMetadata.userId    = metadata.userId;
    if (typeof metadata.deliveryMethod === "string" &&
        ["pickup","delivery"].includes(metadata.deliveryMethod))    safeMetadata.deliveryMethod = metadata.deliveryMethod;
    if (typeof metadata.customerName === "string") safeMetadata.customerName = safeStr(metadata.customerName, 100);
  }

  // ── [FIX: ENV-NO-FALLBACK] Safe callback_url ──
  const callbackBase = process.env.ALLOWED_ORIGIN_1 || "https://my-ecomerce-gygn.vercel.app";
  const callbackUrl  = `${callbackBase}/order-confirmed`;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(amount), // amount already in pesewas/kobo from /validate-order
        metadata: safeMetadata,
        callback_url: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    log.info("Paystack payment initialized");
    res.json(response.data);
  } catch (error) {
    log.error("Paystack init failed", error);
    res.status(500).json({ success: false, error: "Payment initialization failed. Please try again." });
  }
});

// ── 4. Verify Paystack payment ─────────────────────────────────
app.get("/verify-payment/:reference", async (req, res) => {
  const { reference } = req.params;

  if (!isValidRef(reference)) {
    return res.status(422).json({ success: false, error: "Invalid reference format." });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        timeout: 10000,
      }
    );

    if (response.data.data.status === "success") {
      log.info("Payment verified successfully");
      res.json({ success: true, data: response.data.data });
    } else {
      log.warn("Payment verification returned non-success status");
      res.json({ success: false, message: "Transaction not successful." });
    }
  } catch (error) {
    log.error("Paystack verification failed", error);
    res.status(500).json({ success: false, error: "Verification failed. Please contact support." });
  }
});

// ── 5. Order confirmed email (sent once on successful payment) ─
// Called by the frontend after payment verification — one-time only.
app.post("/send-order-confirmed-email", requireAdminToken, emailLimiter, async (req, res) => {
  const { email, customerName, orderId, totalAmount } = req.body;

  if (!isValidEmail(email))
    return res.status(422).json({ success: false, error: "Invalid email." });
  if (!isValidRef(String(orderId || "")))
    return res.status(422).json({ success: false, error: "Invalid order ID." });
  if (typeof totalAmount !== "number" || totalAmount < 0)
    return res.status(422).json({ success: false, error: "Invalid amount." });

  // ── [FIX: EMAIL-IDEMPOTENCY] Deduplicate sends per orderId ──
  if (isAlreadySent("confirmed", orderId)) {
    log.warn("Duplicate send-order-confirmed-email blocked — already sent");
    return res.json({ success: true, deduplicated: true });
  }

  const safeName = escapeHtml(safeStr(customerName || "Valued Client", 100));
  const safeId   = escapeHtml(String(orderId)).slice(0, 64);
  const safeAmt  = Number(totalAmount).toFixed(2);
  const shortId  = safeId.slice(0, 8).toUpperCase();
  const siteUrl  = process.env.SITE_URL || "https://my-ecomerce-gygn.vercel.app";

  try {
    await transporter.sendMail({
      from: `"Janina Luxury Bags" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed #${shortId} ✦`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:auto;background:#FDFBF7;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0A0A0A,#1a1a1a);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:8px;text-transform:uppercase;letter-spacing:5px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags</p>
            <h1 style="margin:0;font-size:26px;font-style:italic;color:#fff;font-weight:normal;">Order Confirmed</h1>
          </div>
          <div style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:14px;color:#222;">Dear <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.8;color:#555;">
              Your order has been received and is being prepared. We will notify you when it ships.
            </p>
            <div style="background:#fff;border:1px solid rgba(201,162,39,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Order Reference</p>
              <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#111;">#${safeId}</p>
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Amount Paid</p>
              <p style="margin:0;font-weight:bold;color:#C9A227;font-size:20px;">GH₵ ${safeAmt}</p>
            </div>
            <div style="text-align:center;">
              <a href="${siteUrl}/orders" style="display:inline-block;background:#C9A227;color:#000;text-decoration:none;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;padding:13px 28px;border-radius:100px;font-family:Helvetica,sans-serif;">View My Orders</a>
            </div>
          </div>
          <div style="background:#0A0A0A;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags · Accra, Ghana</p>
          </div>
        </div>`,
    });
    log.info("Order confirmed email dispatched");
    res.json({ success: true });
  } catch (err) {
    log.error("Order confirmed email failed", err);
    res.status(500).json({ success: false, error: "Could not send confirmation email." });
  }
});

// ── 6. Shipped notification email (admin triggers) ────────────
app.post("/send-shipped-email", requireAdminToken, emailLimiter, async (req, res) => {
  const { email, customerName, orderId } = req.body;

  if (!isValidEmail(email))
    return res.status(422).json({ success: false, error: "Invalid email." });
  if (!isValidRef(String(orderId || "")))
    return res.status(422).json({ success: false, error: "Invalid order ID." });

  // ── [FIX: EMAIL-IDEMPOTENCY] ──
  if (isAlreadySent("shipped", orderId)) {
    log.warn("Duplicate send-shipped-email blocked — already sent");
    return res.json({ success: true, deduplicated: true });
  }

  const safeName = escapeHtml(safeStr(customerName || "Valued Client", 100));
  const safeId   = escapeHtml(String(orderId)).slice(0, 64);
  const shortId  = safeId.slice(0, 8).toUpperCase();
  const siteUrl  = process.env.SITE_URL || "https://my-ecomerce-gygn.vercel.app";

  try {
    await transporter.sendMail({
      from: `"Janina Luxury Bags" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your Order #${shortId} Has Shipped 🚚`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:auto;background:#FDFBF7;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:8px;text-transform:uppercase;letter-spacing:5px;color:rgba(255,255,255,0.6);font-family:Helvetica,sans-serif;">Janina Luxury Bags</p>
            <h1 style="margin:0;font-size:26px;font-style:italic;color:#fff;font-weight:normal;">Your Order Is On Its Way</h1>
          </div>
          <div style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:14px;color:#222;">Dear <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.8;color:#555;">
              Your order has been carefully packaged and dispatched. It is now in transit.
            </p>
            <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Order Reference</p>
              <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#111;">#${safeId}</p>
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Status</p>
              <p style="margin:0;font-weight:bold;font-size:13px;color:#7c3aed;">📦 Shipped &amp; In Transit</p>
            </div>
            <div style="background:#f9f5ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
                Once delivered, you'll have <strong>5 days</strong> to request a free return from your
                <a href="${siteUrl}/orders" style="color:#C9A227;font-weight:bold;">Orders page</a>.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${siteUrl}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;padding:13px 28px;border-radius:100px;font-family:Helvetica,sans-serif;">Track My Order</a>
            </div>
          </div>
          <div style="background:#0A0A0A;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags · Accra, Ghana · Authentic &amp; Certified</p>
          </div>
        </div>`,
    });
    log.info("Shipped notification email dispatched");
    res.json({ success: true });
  } catch (err) {
    log.error("Shipped email failed", err);
    res.status(500).json({ success: false, error: "Could not send shipping notification." });
  }
});

// ── 7. Delivered thank-you email (admin triggers — only email sent on delivery) ─
app.post("/send-delivered-email", requireAdminToken, emailLimiter, async (req, res) => {
  const { email, customerName, orderId, totalAmount, items = [] } = req.body;

  if (!isValidEmail(email))
    return res.status(422).json({ success: false, error: "Invalid email." });
  if (!isValidRef(String(orderId || "")))
    return res.status(422).json({ success: false, error: "Invalid order ID." });

  // ── [FIX: EMAIL-IDEMPOTENCY] ──
  if (isAlreadySent("delivered", orderId)) {
    log.warn("Duplicate send-delivered-email blocked — already sent");
    return res.json({ success: true, deduplicated: true });
  }

  const safeName  = escapeHtml(safeStr(customerName || "Valued Collector", 100));
  const firstName = safeName.split(" ")[0] || safeName;
  const safeId    = escapeHtml(String(orderId)).slice(0, 64);
  const shortId   = safeId.slice(0, 8).toUpperCase();
  const safeAmt   = Number(totalAmount || 0).toFixed(2);
  const siteUrl   = process.env.SITE_URL || "https://my-ecomerce-gygn.vercel.app";

  const itemRows = Array.isArray(items) && items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.05);font-size:12px;color:#444;">${escapeHtml(String(item.name || ""))}</td>
          <td style="padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.05);text-align:right;font-size:12px;font-weight:bold;color:#111;">GH₵${Number(item.price * (item.quantity || 1)).toLocaleString()}</td>
        </tr>`).join("")
    : "";

  try {
    await transporter.sendMail({
      from: `"Janina Luxury Bags" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${firstName}, your order has arrived ✦`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EDE7;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE7;padding:36px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#FDFBF7;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.10);">
  <tr><td style="background:linear-gradient(150deg,#8B6914,#C9A227 45%,#E8C547 70%,#8B6914);padding:44px 40px 38px;text-align:center;">
    <p style="margin:0 0 10px;font-size:8px;text-transform:uppercase;letter-spacing:6px;color:rgba(0,0,0,0.4);font-family:Helvetica,sans-serif;">Janina Luxury Bags</p>
    <h1 style="margin:0;font-size:32px;font-style:italic;color:#1a1000;font-weight:normal;line-height:1.2;">Yours, ${firstName}.</h1>
    <p style="margin:12px 0 0;font-size:9px;letter-spacing:4px;color:rgba(0,0,0,0.4);font-family:Helvetica,sans-serif;text-transform:uppercase;">Order Delivered · #${shortId}</p>
  </td></tr>
  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#222;">Dear <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 28px;font-size:14px;line-height:1.9;color:#555;">
      Your Janina piece has arrived. We hope it brings you as much joy as it brought us crafting it for you.
      Wear it with pride — it was made for someone who knows quality.
    </p>
    <div style="background:#fff;border:1px solid rgba(201,162,39,0.2);border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0A0A0A;padding:12px 20px;">
        <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:4px;color:#C9A227;font-family:Helvetica,sans-serif;">Receipt · #${safeId}</p>
      </div>
      
    </div>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#15803d;font-family:Helvetica,sans-serif;">3-Day Return Window Open</p>
      <p style="margin:0;font-size:12px;color:#166534;line-height:1.7;">
        Not fully in love? Request a free return from your
        <a href="${siteUrl}/orders" style="color:#C9A227;font-weight:bold;text-decoration:none;">Orders page</a>
        within 5 days. No questions asked.
      </p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#333;">With gratitude,</p>
    <p style="margin:0 0 28px;font-size:18px;font-style:italic;color:#111;font-weight:bold;">The Janina Team</p>
    <div style="text-align:center;">
      <a href="${siteUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C9A227,#e6c84e);color:#000;text-decoration:none;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;padding:14px 32px;border-radius:100px;font-family:Helvetica,sans-serif;">View My Orders</a>
    </div>
  </td></tr>
  <tr><td style="background:#0A0A0A;padding:22px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:4px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags</p>
    <p style="margin:0;font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:1px;font-family:Helvetica,sans-serif;">Accra, Ghana · Authentic &amp; Certified</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    });
    log.info("Delivered thank-you email dispatched");
    res.json({ success: true });
  } catch (err) {
    log.error("Delivered email failed", err);
    res.status(500).json({ success: false, error: "Could not send delivery notification." });
  }
});

// ── 8. Send OTP ────────────────────────────────────────────────
app.post("/send-otp", authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return res.status(422).json({ success: false, error: "Invalid email address." });
  }

  const normalised = email.trim().toLowerCase();
  const otp = generateOTP();
  storeOtp(normalised, otp);

  try {
    await transporter.sendMail({
      from: `"Security Team" <${process.env.GMAIL_USER}>`,
      to: normalised,
      subject: "Your Verification Code",
      text: `Your one-time code is: ${otp}\n\nThis code expires in 2 minutes and can only be used once. Do not share it.`,
    });
    log.info("OTP email dispatched");
    res.json({ success: true, message: "If that email is registered, a code has been sent." });
  } catch (err) {
    log.error("OTP send failed", err);
    otpStore.delete(normalised);
    res.status(500).json({ success: false, error: "Could not send verification code." });
  }
});

// ── 9. Verify OTP ──────────────────────────────────────────────
app.post("/verify-otp", authLimiter, (req, res) => {
  const { email, otp } = req.body;

  if (!isValidEmail(email) || !isValidOtp(otp)) {
    return res.status(422).json({ success: false, message: "Invalid input." });
  }

  const result = verifyAndConsumeOtp(email.trim().toLowerCase(), otp.trim());

  if (!result.ok) {
    log.warn("OTP verification failed");
    return res.status(400).json({ success: false, message: result.reason });
  }

  log.info("OTP verified successfully");
  res.json({ success: true, message: "Verified." });
});

// ── 10. send-status-update (alias called by CheckoutPage after payment) ──────
// CheckoutPage fires this fire-and-forget after a successful order.
// It forwards to the same logic as send-order-confirmed-email but does NOT
// require the admin token — it's called by the authenticated client right
// after their own payment, and is protected by:
//   - Input validation
//   - emailLimiter (20 per hour per IP)
//   - isAlreadySent() dedup (keyed on orderId — one email per order)
app.post("/send-status-update", emailLimiter, async (req, res) => {
  const { email, customerName, orderId, totalAmount } = req.body;

  if (!isValidEmail(email))
    return res.status(422).json({ success: false, error: "Invalid email." });

  // orderId here may be a Paystack reference (TRX-...) or a UUID
  const rawId = String(orderId || "").slice(0, 64);
  if (!rawId)
    return res.status(422).json({ success: false, error: "Missing order ID." });

  // Dedup — only one confirmation email per orderId
  if (isAlreadySent("status-update", rawId)) {
    log.warn("Duplicate send-status-update blocked — already sent");
    return res.json({ success: true, deduplicated: true });
  }

  const safeName = escapeHtml(safeStr(customerName || "Valued Client", 100));
  const safeId   = escapeHtml(rawId);
  const shortId  = safeId.slice(0, 8).toUpperCase();
  const safeAmt  = Number(totalAmount || 0).toFixed(2);
  const siteUrl  = process.env.SITE_URL || "https://my-ecomerce-gygn.vercel.app";

  try {
    await transporter.sendMail({
      from: `"Janina Luxury Bags" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed #${shortId} ✦`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:auto;background:#FDFBF7;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0A0A0A,#1a1a1a);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:8px;text-transform:uppercase;letter-spacing:5px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags</p>
            <h1 style="margin:0;font-size:26px;font-style:italic;color:#fff;font-weight:normal;">Order Confirmed</h1>
          </div>
          <div style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:14px;color:#222;">Dear <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#555;">
              Your order has been received and is being prepared with care.
              We will notify you when it ships.
            </p>
            <div style="background:#fff;border:1px solid rgba(201,162,39,0.25);border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Order ID</p>
              <p style="margin:0 0 14px;font-weight:bold;font-size:18px;color:#111;letter-spacing:2px;font-family:monospace;">#${shortId}</p>
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Amount Paid</p>
              <p style="margin:0 0 14px;font-weight:bold;color:#C9A227;font-size:20px;">GH&#8373; ${safeAmt}</p>
              <div style="background:#FDFBF7;border:1px solid rgba(201,162,39,0.15);border-radius:8px;padding:12px 14px;">
                <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Track Your Order</p>
                <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
                  Go to <strong>Support &rarr; Track Order</strong> and enter
                  <strong style="color:#C9A227;font-family:monospace;">#${shortId}</strong>
                  to check your status at any time.
                </p>
              </div>
            </div>
            <div style="text-align:center;">
              <a href="${siteUrl}/orders" style="display:inline-block;background:#C9A227;color:#000;text-decoration:none;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;padding:13px 28px;border-radius:100px;font-family:Helvetica,sans-serif;">View My Orders</a>
            </div>
          </div>
          <div style="background:#0A0A0A;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags · Accra, Ghana · Authentic &amp; Certified</p>
          </div>
        </div>`,
    });
    log.info("Order status-update email dispatched");
    res.json({ success: true });
  } catch (err) {
    log.error("Status-update email failed", err);
    res.status(500).json({ success: false, error: "Could not send confirmation email." });
  }
});

// ── 11. Notify admin of new live chat session ──────────────────
// Called by the client when they open Live Support.
// NOT admin-token-protected (client calls it), secured by:
//   - Input validation
//   - emailLimiter (20 per hour per IP)
//   - isAlreadySent() dedup keyed on sessionId (one email per session)
app.post("/notify-admin-live-chat", emailLimiter, async (req, res) => {
  const { userName, userEmail, sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100)
    return res.status(422).json({ success: false, error: "Invalid session." });
  if (!isValidEmail(userEmail))
    return res.status(422).json({ success: false, error: "Invalid email." });

  const safeName    = safeStr(userName || "A client", 100);
  const safeEmail   = safeStr(userEmail, 200);
  const safeSession = safeStr(sessionId, 100);
  const siteUrl     = process.env.SITE_URL || "https://my-ecomerce-gygn.vercel.app";

  // One notification per session only
  if (isAlreadySent("live_chat_notify", safeSession)) {
    log.warn("Duplicate live chat notify blocked — already sent");
    return res.json({ success: true, deduplicated: true });
  }

  // 1. Create live_chat_sessions record so admin inbox shows it
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/live_chat_sessions`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":         SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify({
        session_id: safeSession,
        user_email: safeEmail,
        user_name:  safeName,
        status:     "active",
        created_at: new Date().toISOString(),
      }),
    });
    log.info("Live chat session record created in Supabase");
  } catch (err) {
    log.warn("Could not create live chat session record", err);
    // Non-fatal — still send the email below
  }

  // 2. Email the admin
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

  try {
    await transporter.sendMail({
      from:    `"Janina Support" <${process.env.GMAIL_USER}>`,
      to:      adminEmail,
      subject: `🔔 Live Chat Request — ${escapeHtml(safeName)}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;background:#FDFBF7;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;">
          <div style="background:#0A0A0A;padding:28px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:8px;text-transform:uppercase;letter-spacing:5px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Admin Alert</p>
            <h1 style="margin:0;font-size:22px;font-style:italic;color:#fff;font-weight:normal;">Live Chat Request</h1>
          </div>
          <div style="padding:28px 36px;">
            <p style="margin:0 0 18px;font-size:14px;color:#222;">A client is waiting for live support:</p>
            <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:18px;margin-bottom:22px;">
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Client</p>
              <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#111;">${escapeHtml(safeName)}</p>
              <p style="margin:0 0 4px;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#aaa;font-family:Helvetica,sans-serif;">Email</p>
              <p style="margin:0;font-size:13px;color:#555;">${escapeHtml(safeEmail)}</p>
            </div>
            <div style="text-align:center;">
              <a href="${siteUrl}/admin-dashboard" style="display:inline-block;background:#C9A227;color:#000;text-decoration:none;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;padding:13px 28px;border-radius:100px;font-family:Helvetica,sans-serif;">Open Admin Dashboard</a>
            </div>
            <p style="margin:18px 0 0;font-size:11px;color:#888;text-align:center;">Go to <strong>Inbox &rarr; Live Chat</strong> to respond.</p>
          </div>
          <div style="background:#0A0A0A;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:3px;color:#C9A227;font-family:Helvetica,sans-serif;">Janina Luxury Bags · Admin Alert</p>
          </div>
        </div>`,
    });
    log.info("Admin live chat notification email sent");
    res.json({ success: true });
  } catch (err) {
    log.error("Admin live chat email failed", err);
    // Return success anyway — the session record was already created in Supabase
    // so the admin will still see it in their inbox even without the email
    res.json({ success: false, error: "Email delivery failed but session is registered." });
  }
});

// ── 404 ────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: "Not found." }));

// ── Global error handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  log.error("Unhandled exception", err);
  res.status(500).json({ success: false, error: "An unexpected error occurred." });
});

// ── Vercel serverless export ───────────────────────────────────
// Vercel calls this exported handler for every request instead of app.listen()
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

export default app;