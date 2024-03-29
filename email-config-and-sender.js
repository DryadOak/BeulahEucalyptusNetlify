const nodemailer = require('nodemailer');
require('dotenv').config();

// Accessing environment variables
const smtpService = process.env.SMTP_SERVICE;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const recipientEmail = process.env.RECIPIENT_EMAIL;

// Email configuration
const forms = {
    contact: {
        recipientEmail: recipientEmail,
        subject: (name) => `${name}: Beulah Contact Form Submission`,
        body: ({ name, email, tel, company, message }) =>
            `Name: ${name}\nEmail: ${email}\nTel: ${tel}\nCompany: ${company}\nMessage: ${message}`,
        clientSuccessMsg:
            "Form submitted successfully. Thank you for getting in touch, we will get back to you shortly. If your request is urgent, please call us.",
        clientErrorMsg: "Error sending email",
    },
    review: {
        recipientEmail: recipientEmail,
        subject: (name) => `${name}: Beulah Review Form Submission`,
        body: ({ name, message }) => `Name: ${name}\nMessage: ${message}`,
        clientSuccessMsg:
            "Thank you for leaving a review, your feedback is greatly appreciated.",
        clientErrorMsg:
            "Error sending review, please contact us if the issue persists.",
    },
};

const sendFormToEmail = async (req, res, formType) => {
    const { name } = req.body;
    const formConfig = forms[formType];

    if (!formConfig) {
        return res.status(400).json({ message: "Invalid form type" });
    }

    const { recipientEmail, subject, body, clientSuccessMsg, clientErrorMsg } =
        formConfig;

    const transporter = nodemailer.createTransport({
        host: smtpService,
        secure: true,
        port: 465,
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
    });

    const mailOptions = {
        from: smtpUser,
        to: recipientEmail,
        subject: subject(name),
        text: body(req.body),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return res.status(200).json({
            message: clientSuccessMsg,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: clientErrorMsg });
    }
};

module.exports = { sendFormToEmail };

