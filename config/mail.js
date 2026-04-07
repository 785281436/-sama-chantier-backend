const nodemailer = require('nodemailer')

let transporter

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
      },
    })
  }
  return transporter
}

const sendMail = async ({ to, subject, text, html }) => {
  const t = getTransporter()
  if (!t || !to) return false
  const from = process.env.MAIL_FROM || process.env.SMTP_USER
  await t.sendMail({ from, to, subject, text, html })
  return true
}

const sendOrderConfirmationEmail = async (order, userEmail) => {
  if (!userEmail) return
  const lines = order.items.map(i => `- ${i.name} × ${i.quantity} : ${(i.price * i.quantity).toLocaleString('fr-FR')} FCFA`).join('\n')
  const subject = `Sama Chantier — Commande confirmée (#${String(order._id).slice(-8).toUpperCase()})`
  const text = `Bonjour,\n\nVotre commande a bien été enregistrée.\n\n${lines}\n\nTotal : ${order.total.toLocaleString('fr-FR')} FCFA\nMoyen de paiement : ${order.paymentMethod}\n\nMerci de votre confiance.\n— Sama Chantier`
  const html = `<p>Bonjour,</p><p>Votre commande a bien été enregistrée.</p><pre style="font-family:sans-serif">${lines}\n\n<strong>Total : ${order.total.toLocaleString('fr-FR')} FCFA</strong>\nMoyen de paiement : ${order.paymentMethod}</pre><p>Merci de votre confiance.<br/>— Sama Chantier</p>`
  try {
    await sendMail({ to: userEmail, subject, text, html })
  } catch (e) {
    console.error('Email commande:', e.message)
  }
}

module.exports = { sendMail, sendOrderConfirmationEmail }
