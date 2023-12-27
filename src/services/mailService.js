import nodemailer from 'nodemailer'

export async function sendEmailService({
    to, subject, message, attachments = [] } = {}) {

    //   ====== Config Transporter
    const transporter = nodemailer.createTransport({
        host: 'localhost', // stmp.gmail.com
        port: 587, // 587 , 465
        secure: false, // false , true
        service: 'gmail', // optional
        auth: {
            // credentials
            user: process.env.CONFIGURED_EMAIL,
            pass: process.env.CONFIGURED_EMAIL_APP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    const emailInfo = await transporter.sendMail({
        from: `"ArchReality 🏤" <${process.env.CONFIGURED_EMAIL}>`,
        // cc:['',''],
        // bcc:['',''],
        to: to ? to : '',
        subject: subject ? subject : 'Hello',
        // text: text ? text : '',
        html: message ? message : '',
        attachments,
    })

    if (emailInfo.accepted.length) {
        return true
    }
    else {
        return false
    }
}


