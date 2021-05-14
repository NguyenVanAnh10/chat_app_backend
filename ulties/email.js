import nodemailer from "nodemailer";

import configs from "../configs/index.js";

let transporter = null;

const initTransporterEmail = () => {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    pool: true,
    port: 465,
    secure: true,
    auth: {
      user: configs.USER_GMAIL,
      pass: configs.PASS_GMAIL,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });
};

export const sendTokenConfirmationEmail = (to, token) => {
  const mailOptions = {
    from: "luis.nguyen1110@gmail.com",
    to,
    subject: "Confirmation Email",
    html: `<div><h1>hello</h1><strong>Please click below link to confirm email</strong><a href="https://chat-video.netlify.app/register?token=${token}">confirm</a></div>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message %s sent: %s", info.messageId, info.response);
  });
};

export default initTransporterEmail;
