const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false  // ← AJOUTE CETTE LIGNE
  }
})

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    })
    console.log(`📧 Email envoyé à ${to}`)
    console.log(`🔗 Voir l'email: ${nodemailer.getTestMessageUrl(info)}`)
    return true
  } catch (error) {
    console.error('❌ Erreur email:', error.message)
    return false
  }
}

module.exports = { sendMail }