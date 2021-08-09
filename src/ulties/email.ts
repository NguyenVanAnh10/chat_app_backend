import nodemailer, { Transporter } from 'nodemailer';

import env from 'configs';

let transporter = null as Transporter;

const initTransporterEmail = (): void => {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    pool: true,
    port: 465,
    secure: true,
    auth: {
      user: env.USER_GMAIL,
      pass: env.PASS_GMAIL,
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

export const sendTokenConfirmationEmail = async (to: string, token: string): Promise<void> => {
  const logoURL = `${env.MEDIA_HOST}/alo-rice/app/logo.png`;
  const mailOptions = {
    to,
    subject: '[AloRice] Welcome! Please confirm your email address.',
    html: `<div style="max-width: 500px;
    border: 1px solid #cecbc9;
    border-radius: 3px;
    padding: 40px;">
    <!--
    <img style="width: 90px;
    object-fit: cover;
    max-height: 90px;
    margin: 0 auto;
    display: block;
    border-radius: 3px;" alt="logo" src=${logoURL}/>
    -->
    <h1 style="    
    line-height: 1.25;
    font-size: 19px;
    font-weight: 400!important;
    color: #586069;
    word-break: normal;
    text-align: left;
    margin: 30px 0 30px;
    padding: 0;">Welcome to AloRice, <strong style="color: #24292e;">${to.replace(
      /@\w+.\w+/,
      ''
    )}</strong>! <br/> To complete your AloRice 
    sign up, we just need to confirm your email address:
     <strong><a href="mailto:${to}" target="_blank">${to}</a></strong>.</h1>
     <a style="
      display: block;
      text-decoration: none;
      background: #198596;
      width: 200px;
      text-align: center;
      color: white;
      border-radius: 5px;
      padding: 5px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-top: 20px;
  " href="${env.CLIENT_HOST}/login?registry_token=${token}">Confirm email address</a>
     </div>`,
  };

  await transporter.sendMail(mailOptions);
};

export default initTransporterEmail;
