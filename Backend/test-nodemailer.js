require("dotenv").config();
const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: process.env.EMAIL_SENDER,
    subject: "Test Email",
    text: "Testing nodemailer!"
  });

  console.log("Email terkirim!");
}

test();
