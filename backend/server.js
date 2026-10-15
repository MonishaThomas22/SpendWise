
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from your React + Vite frontend.
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ]
}));

app.use(express.json());

// Brevo SMTP configuration.
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  }
});

// Check whether the backend is running.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SpendWise backend is running!'
  });
});

// Test the Brevo SMTP connection.
app.get('/api/email-status', async (req, res) => {
  try {
    await transporter.verify();

    console.log('Brevo SMTP connection verified.');

    res.json({
      success: true,
      message: 'Email service is ready.'
    });
  } catch (error) {
    // Log the detailed error in the backend terminal.
    console.error('SMTP verification failed:', error);

    // Return the specific error so we can troubleshoot.
    res.status(500).json({
      success: false,
      message: 'Email setup failed.',
      details: error.message
    });
  }
});

// Send a budget alert email to a parent.
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      parentName,
      parentEmail,
      studentName,
      category,
      spent,
      budget
    } = req.body;

    if (
      !parentEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail) ||
      !category ||
      !Number.isFinite(Number(spent)) ||
      !Number.isFinite(Number(budget)) ||
      Number(spent) < 0 ||
      Number(budget) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid parent email and budget details.'
      });
    }

    // Limit text fields to reasonable lengths.
    const safeParentName = String(parentName || 'Parent').slice(0, 100);
    const safeStudentName = String(studentName || 'Your student').slice(0, 100);
    const safeCategory = String(category).slice(0, 100);

    const spentAmount = Number(spent);
    const budgetAmount = Number(budget);

    // Send the email using Brevo SMTP.
    const info = await transporter.sendMail({
      from: {
        name: 'SpendWise Budget Alerts',
        address: process.env.BREVO_SENDER_EMAIL ||
          process.env.BREVO_SMTP_USER
      },
      to: parentEmail,
      subject: `SpendWise Budget Alert: ${safeCategory}`,
      text: `Hello ${safeParentName},

This is a budget notification from SpendWise.

Student: ${safeStudentName}
Category: ${safeCategory}
Budget: Rs. ${budgetAmount.toFixed(2)}
Amount spent: Rs. ${spentAmount.toFixed(2)}

${spentAmount > budgetAmount
  ? 'The spending limit has been exceeded.'
  : 'The spending limit has been reached.'}

Please discuss the budget with your student.

This is an automated message from SpendWise.`,
      html: `
        <h2>SpendWise Budget Alert</h2>
        <p>Hello ${safeParentName.replace(/[&<>"']/g, '')},</p>
        <p>This is a budget notification for
          <strong>${safeStudentName.replace(/[&<>"']/g, '')}</strong>.
        </p>
        <p><strong>Category:</strong>
          ${safeCategory.replace(/[&<>"']/g, '')}
        </p>
        <p><strong>Budget:</strong> ₹${budgetAmount.toFixed(2)}</p>
        <p><strong>Amount spent:</strong> ₹${spentAmount.toFixed(2)}</p>
        <p>${spentAmount > budgetAmount
          ? 'The spending limit has been exceeded.'
          : 'The spending limit has been reached.'}</p>
        <p>Please discuss the budget with your student.</p>
        <p><small>Automated message from SpendWise.</small></p>
      `
    });

    console.log('Budget email accepted by SMTP:', info.messageId);

    res.json({
      success: true,
      message: 'Email accepted by the email service.',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending failed:', error);

    res.status(500).json({
      success: false,
      message: 'Email could not be sent.',
      details: error.message
    });
  }
});

// SMS will be configured after email is working.
app.post('/api/send-sms', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'SMS is not configured yet.'
  });
});

// Start the server.
app.listen(PORT, () => {
  console.log(`SpendWise backend running at http://localhost:${PORT}`);
});
