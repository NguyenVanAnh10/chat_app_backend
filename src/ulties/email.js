import nodemailer from 'nodemailer';

import configs from 'configs';

let transporter = null;

const initTransporterEmail = () => {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    pool: true,
    port: 465,
    secure: true,
    auth: {
      user: configs.USER_GMAIL,
      pass: configs.PASS_GMAIL,
    },
  });

  transporter.verify(error => {
    if (error) {
      console.log(error);
    } else {
      console.log('Server is ready to take our messages');
    }
  });
};

export const sendTokenConfirmationEmail = async (to, token) => {
  const mailOptions = {
    from: 'luis.nguyen1110@gmail.com',
    to,
    subject: 'Confirmation Email',
    html: `<div><h1>hello</h1><strong>Please click below link to confirm email</strong><a href="https://chat-video.netlify.app/login?registry_token=${token}">confirm</a></div>`,
  };

  await transporter.sendMail(mailOptions);
};

export default initTransporterEmail;
