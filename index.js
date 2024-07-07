const express = require("express");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
const prisma = new PrismaClient();

app.use(express.json());

// Endpoint to save referral data
app.post("/api/referrals", async (req, res) => {
  const { referrerName, referrerEmail, refereeName, refereeEmail, courseName } =
    req.body;

  // Validate input data
  if (
    !referrerName ||
    !referrerEmail ||
    !refereeName ||
    !refereeEmail ||
    !courseName
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newReferral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
        courseName,
      },
    });

    // Send referral email
    sendReferralEmail(referrerEmail, refereeEmail, courseName);

    res.status(201).json(newReferral);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save referral data" });
  }
});

// Endpoint to fetch all referral data
app.get("/api/referrals", async (req, res) => {
  try {
    const referrals = await prisma.referral.findMany();
    res.status(200).json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch referral data" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Function to send referral email
function sendReferralEmail(referrerEmail, refereeEmail, courseName) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: refereeEmail,
    subject: "You have been referred to a course!",
    text: `Hi, \n\nYou have been referred by ${referrerEmail} to join the course: ${courseName}. \n\nBest Regards, \nReferral Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
