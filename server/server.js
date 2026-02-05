import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix for .env being outside the server folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const app = express();
app.use(express.json());

// ✅ Updated CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://my-ecommerce-production.up.railway.app"
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

// DEBUG LOGS
console.log("--- System Check ---");
console.log("Looking for .env at:", path.join(__dirname, "../.env"));
console.log("GMAIL_USER:", process.env.GMAIL_USER ? "✅ LOADED" : "❌ MISSING");
console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "✅ LOADED" : "❌ MISSING");
console.log("--------------------");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL for port 465
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error.message);
    console.log("Tip: Ensure you are using a Gmail 'App Password', not your regular password.");
  } else {
    console.log("✅ Mail Server is ready to send OTPs");
  }
});

function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

const otpStore = {};

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const otp = generateOTP();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: `Security Team <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verification Protocol: Your OTP Code",
      text: `Your OTP is ${otp}. This code expires in 5 minutes.`
    });

    console.log(`📤 OTP [${otp}] transmitted to: ${email}`);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  console.log(`Attempting verification for ${email} with code ${otp}`);

  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email];
    console.log(`✅ Verification successful for ${email}`);
    res.json({ success: true, message: "Email verified successfully!" });
  } else {
    console.warn(`⚠️ Invalid OTP attempt for ${email}`);
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Secure Server active on http://localhost:${PORT} `);
});