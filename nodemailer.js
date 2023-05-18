const nodemailer = require("nodemailer");
require("dotenv").config();
const { OUTLOOKUSER, OUTLOOKPASS, RECIPIENT } = process.env;

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: OUTLOOKUSER,
    pass: OUTLOOKPASS,
  },
});

function createAndSendEmail(title, message) {
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

module.exports = { createAndSendEmail };
