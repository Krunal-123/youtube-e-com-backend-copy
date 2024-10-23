const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

const signupMail = (email,firstName,lastName) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Welcome to Our Platform!',
    html: `
  <h2>Dear ${firstName} ${lastName},</h2>
  <img scr="https://media.discordapp.net/attachments/1116972017883815996/1283360451689844768/WhatsApp_Image_2024-09-10_at_12.59.07_50c89b17.jpg?ex=66e2b60f&is=66e1648f&hm=f1123c7604906933c9cce518f1bc73edd22a427b3aea8e91444a313a0f2f42c3&=&format=webp&width=782&height=521" style="height:200px width:100%">
  <p>
  Welcome to Your our own E Com Website! We’re thrilled to have you join our community. Whether you’re here to [mention key feature or benefit of the site], explore our resources, or connect with like-minded individuals, we’re here to support you every step of the way.
</p>
  <p>
  To help you get started, we’ve put together a quick guide that covers the essentials. If you have any questions or need assistance, our support team is just an email away at youtube.com.
</p>
  <ul>
    <li>Explore and enjoy our features.</li>
    <li>Stay tuned for updates and new releases.</li>
    <li>Feel free to reach out to us with any questions or feedback.</li>
  </ul>
  <p>Thank you for signing up! If you have any questions, don't hesitate to contact us.</p>
  <p>Best regards,<br/>The YouTube E Com Team</p>
`,

  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending welcome email:', error);
    } else {
      console.log('Welcome email sent: ' + info.response);
    }
  });
};

module.exports = signupMail;
