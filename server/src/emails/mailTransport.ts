import * as mailgun from 'mailgun-js';

// Leaving all the nodemailer stuff in here. If you want to bulk send email
// for testing purposes it might be the way to go.

// import nodemailer from 'nodemailer';

// const nodemailerTransport = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USERNAME,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

const mailgunTransport = mailgun({
  apiKey: process.env.MAILGUN_API_KEY ?? '',
  domain: process.env.MAILGUN_DOMAIN ?? '',
});

export default () => ({
  sendMail(data: mailgun.messages.SendData): Promise<mailgun.messages.SendResponse> {
    // if (process.env.NODE_ENV !== 'development') {
    //   return nodemailerTransport.sendMail(data);
    // }
    return mailgunTransport.messages().send(data);
  },
});
