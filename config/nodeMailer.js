const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:process.env.NODEMAILER_USER ,
      pass: process.env.NODEMAILER_PASS,
    },
});

// Verify the connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

async function sendEmail({ fromEmail, toEmail, subject, htmlContent }) {
    try {
      // Setup email data
      let mailOptions = {
        from: fromEmail, // Sender address
        to: toEmail, // List of recipients
        subject: subject, // Subject line
        html: htmlContent, // HTML body
      };
  
        // Send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
    
  
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

module.exports = sendEmail;
