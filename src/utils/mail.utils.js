import Mailgen from 'mailgen'
import { Resend } from 'resend'


const resend = new Resend(process.env.RESEND_API_KEY);
const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'App assistant',
            link: 'https://mailgen.js/'
        }
    });

    const emailHtml = mailGenerator.generate(options.mailgenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);


    const mail = {
        from: options.from || 'App Assistant <onboarding@resend.dev>', // Will change later when I'll get a domain
        to: options.to,
        subject: options.subject,
        text: emailText, // plain text
        html: emailHtml  // HTML body
    }

    try {
        const { data, error } = await resend.emails.send(mail);

        if (error) {
            console.error('Email sending failed:', error);
            return { success: false, error };
        }
        console.log('Email sent successfully:', data);
        return { success: true, data };

    } catch (error) {
        console.error(
            "Email service failed. Make sure you have provided your RESEND_API_KEY in the .env file",
        );
        console.error("Error: ", error);
        return { success: false, error };
    }

}


const emailVerificationMailGen = (fullname, verificationUrl) => {
    return {
        body: {
            name: fullname,
            intro: 'Welcome to Brickly! We\'re very excited to have you on app.',
            action: {
                instructions: 'To get your email verified , please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Verify Your Email',
                    link: verificationUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
};

const forgotPasswordReqMailGen = (fullname, forgotPasswordUrl) => {
    return {
        body: {
            name: fullname,
            intro: 'You are receiving this email because we received a password reset request for your account.',
            action: {
                instructions: 'To reset the password, please click here:',
                button: {
                    color: '#22BC66',
                    text: 'Reset Password',
                    link: forgotPasswordUrl
                }
            },
            outro: 'If you did not request a password reset, no further action is required.'
        }
    }
};

export {
    sendMail,
    emailVerificationMailGen,
    forgotPasswordReqMailGen
}