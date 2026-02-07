import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://my-ecomerce-gygn.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// --- NEW: ORDER COMPLETION EMAIL ENDPOINT ---
app.post("/send-status-update", async (req, res) => {
  const { email, customerName, orderId, totalAmount } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Recipient email missing" });
  }

  try {
    await transporter.sendMail({
      from: `"The Vault Archive" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Order Sealed & Dispatched: #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family: serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; color: #000; background-color: #FDFBF7;">
          <h2 style="font-style: italic; color: #D4AF37; text-align: center;">Order Confirmed</h2>
          <hr style="border: 0; border-top: 1px solid #000; opacity: 0.1;" />
          <p>Greetings <strong>${customerName || 'Valued Client'}</strong>,</p>
          <p>Your request has been processed and your assets are officially sealed for dispatch.</p>
          
          <div style="background: #fff; padding: 20px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 12px; text-transform: uppercase; color: #888;">Order ID</p>
            <p style="margin: 0; font-weight: bold;">#${orderId}</p>
            
            <p style="margin: 15px 0 5px 0; font-size: 12px; text-transform: uppercase; color: #888;">Total Secured Value</p>
            <p style="margin: 0; font-weight: bold; color: #D4AF37; font-size: 20px;">GH₵ ${totalAmount?.toLocaleString()}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">Our curators are ensuring your masterpiece arrives in pristine condition. You will receive a notification upon delivery.</p>
          
          <footer style="margin-top: 40px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #aaa;">
            Archive Security Team | The Vault
          </footer>
        </div>
      `
    });

    console.log(`📧 Dispatch confirmation sent to: ${email}`);
    res.json({ success: true, message: "Completion email sent" });
  } catch (err) {
    console.error("❌ Email Dispatch Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- EXISTING OTP LOGIC (Unchanged) ---
const otpStore = {};
function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email is required" });

  const otp = generateOTP();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: `Security Team <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verification Protocol: Your OTP Code",
      text: `Your OTP is ${otp}. This code expires in 5 minutes.`
    });
    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email];
    res.json({ success: true, message: "Verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Secure Server active on http://localhost:${PORT}`);
});