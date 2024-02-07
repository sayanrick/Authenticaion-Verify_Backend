const { createMailTransporter } = require("./createMailTransporter");

const sendVerificationMail = (user) => {
    const transporter = createMailTransporter();

    const mailOptions = {
        from: "Chat App <sayanrickdas@outlook.com>",
        to: user.email,
        subject: "Verify your email", // Fix the subject typo here
        html: `<p>Hello 👏 ${user.name}, verify your email by clicking this link...</p>
        <a href='${process.env.CLIENT_URL}/verify-email?emailToken=${user.emailToken}'>Verify Your Email</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Verification Email Sent");
        }
    });
};

module.exports = { sendVerificationMail };
