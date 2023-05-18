const nodemailer = require("nodemailer");
require("dotenv").config();
const { OUTLOOKUSER, OUTLOOKPASS, RECIPIENT } = process.env;

function createAndSendEmail(title, message) {
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: OUTLOOKUSER,
      pass: OUTLOOKPASS,
    },
  });

  const options = {
    from: OUTLOOKUSER,
    to: RECIPIENT,
    subject: title,
    text: message,
  };

  transporter.sendMail(options, (err, info) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(info.response);
  });
}

function serializeCookies(cookies) {
  if (cookies) {
    const serialized = Array.isArray(cookies)
      ? cookies.map((cookie) => cookie.split(";")[0]).join("; ")
      : cookies.split(";")[0];
    return serialized.trim(); // Remove leading/trailing whitespace
  }
  return "";
}

module.exports = { serializeCookies, createAndSendEmail };
