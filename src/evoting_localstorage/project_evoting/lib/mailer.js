const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

const initTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal for non-production
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('Ethereal email test account created');
    } catch (err) {
      logger.error('Failed to create Ethereal account, falling back to basic config', err);
    }
  }
};

// Initialize the transporter
initTransporter();

const sendVoterInvite = async (toEmail, voterName, electionName, voteUrl) => {
  if (!transporter) await initTransporter();

  const mailOptions = {
    from: `"E-Voting Platform" <${process.env.SMTP_USER || 'noreply@evoting.com'}>`,
    to: toEmail,
    subject: `You are invited to vote: ${electionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Hello ${voterName},</h2>
        <p>You have been invited to participate in the upcoming election: <strong>${electionName}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${voteUrl}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Cast Your Vote</a>
        </div>
        <p style="color: #666; font-size: 14px;">Please note: This link is single-use and will expire once the voting period closes or after you have successfully cast your vote.</p>
        <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this URL into your browser: <br/> ${voteUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  
  return info;
};

const sendOtpEmail = async (toEmail, orgName, otp) => {
  if (!transporter) await initTransporter();
  const info = await transporter.sendMail({
    from: '"OpenVoting" <noreply@openvoting.in>',
    to: toEmail,
    subject: 'Your OpenVoting verification code',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#007bff;">OpenVoting</h2>
        <p>Hi ${orgName},</p>
        <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;
                    padding:24px;background:#f8f9fa;border-radius:8px;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#6c757d;font-size:13px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
  if (process.env.NODE_ENV !== 'production') {
    logger.info('OTP email preview: ' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendVoterInvite, sendOtpEmail };
