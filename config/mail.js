const nodemailer = require('nodemailer')

let smtpTransporter
let etherealTransporter
let etherealLogged

const useDevEthereal = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return false
  if (process.env.MAIL_DEV === '0') return false
  if (process.env.NODE_ENV === 'production') return false
  return true
}

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    if (!smtpTransporter) {
      smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      })
    }
    return smtpTransporter
  }

  if (!useDevEthereal()) return null

  if (!etherealTransporter) {
    const testAccount = await nodemailer.createTestAccount()
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    if (!etherealLogged) {
      console.log('📧 E-mails en mode développement (Ethereal) : prévisualisation dans la console à chaque envoi.')
      etherealLogged = true
    }
  }
  return etherealTransporter
}

const sendMail = async ({ to, subject, text, html }) => {
  const t = await getTransporter()
  if (!t || !to) return false
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || '"Sama Chantier" <dev@ethereal.email>'
  const info = await t.sendMail({ from, to, subject, text, html })
  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('📧 Prévisualisation e-mail :', preview)
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
