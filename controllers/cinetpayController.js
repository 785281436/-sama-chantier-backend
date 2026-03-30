const Order = require('../models/Order')
const User = require('../models/User')
const { sendMail } = require('../config/mail')

const CINETPAY_URL = 'https://api-checkout.cinetpay.com/v2/payment'
const CINETPAY_CHECK = 'https://api-checkout.cinetpay.com/v2/payment/check'

const roundXOF = (n) => {
  const x = Math.round(Number(n) || 0)
  if (x <= 0) return 5
  return Math.max(5, Math.round(x / 5) * 5)
}

const fetchJson = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SamaChantier/1.0',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

const initCinetPay = async (req, res) => {
  try {
    const apikey = process.env.CINETPAY_API_KEY
    const site_id = process.env.CINETPAY_SITE_ID
    const publicUrl = process.env.API_PUBLIC_URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    if (!apikey || !site_id || !publicUrl) {
      return res.status(503).json({
        message: 'Paiement CinetPay non configuré (CINETPAY_API_KEY, CINETPAY_SITE_ID, API_PUBLIC_URL dans .env)',
      })
    }

    const order = await Order.findById(req.body.orderId).populate('user', 'name email phone')
    if (!order) return res.status(404).json({ message: 'Commande introuvable' })
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    if (order.paymentMethod !== 'cinetpay') {
      return res.status(400).json({ message: 'Cette commande n\'utilise pas CinetPay' })
    }
    if (order.isPaid) return res.status(400).json({ message: 'Commande déjà payée' })

    const transaction_id = String(order._id)
    const amount = roundXOF(order.total)
    const u = order.user
    const nameParts = (u.name || 'Client').trim().split(/\s+/)
    const customer_name = nameParts.slice(0, -1).join(' ') || nameParts[0] || 'Client'
    const customer_surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0]

    const payload = {
      apikey,
      site_id,
      transaction_id,
      amount,
      currency: 'XOF',
      description: `Sama Chantier commande ${transaction_id.slice(-8)}`,
      notify_url: `${publicUrl.replace(/\/$/, '')}/api/payments/cinetpay/notify`,
      return_url: `${clientUrl.replace(/\/$/, '')}/paiement/retour?order=${order._id}`,
      channels: 'ALL',
      lang: 'fr',
      metadata: String(order._id),
      customer_id: String(order.user._id),
      customer_name,
      customer_surname,
      customer_email: u.email || 'client@example.com',
      customer_phone_number: (order.shippingAddress?.phone || u.phone || '770000000').replace(/\s/g, ''),
      customer_address: order.shippingAddress?.address || 'Dakar',
      customer_city: order.shippingAddress?.city || 'Dakar',
      customer_country: 'SN',
      customer_state: 'SN',
      customer_zip_code: '00000',
    }

    const { data } = await fetchJson(CINETPAY_URL, payload)
    if (data.code !== '201' || !data.data?.payment_url) {
      return res.status(502).json({
        message: data.message || data.description || 'Erreur CinetPay',
        detail: data,
      })
    }

    res.json({ paymentUrl: data.data.payment_url, transaction_id })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getCinetPayNotify = async (req, res) => {
  res.status(200).send('OK')
}

const postCinetPayNotify = async (req, res) => {
  try {
    const apikey = process.env.CINETPAY_API_KEY
    const site_id = process.env.CINETPAY_SITE_ID
    if (!apikey || !site_id) return res.status(200).send('OK')

    const cpm_trans_id = req.body.cpm_trans_id || req.body.transaction_id
    const orderId = req.body.cpm_custom || cpm_trans_id
    if (!cpm_trans_id) return res.status(200).send('OK')

    const { data } = await fetchJson(CINETPAY_CHECK, {
      apikey,
      site_id,
      transaction_id: cpm_trans_id,
    })

    const status = data.data?.status
    const order = await Order.findById(orderId || cpm_trans_id)
    if (!order) return res.status(200).send('OK')

    if (status === 'ACCEPTED' && String(data.code) === '00') {
      if (!order.isPaid) {
        order.isPaid = true
        order.paymentResult = {
          id: data.data?.operator_id,
          status: 'ACCEPTED',
          reference: cpm_trans_id,
          paidAt: new Date(),
        }
        if (order.status === 'en_attente') order.status = 'confirme'
        await order.save()
        const user = await User.findById(order.user).select('email name')
        if (user?.email) {
          try {
            await sendMail({
              to: user.email,
              subject: 'Sama Chantier — Paiement reçu',
              text: `Bonjour ${user.name},\n\nNous avons bien reçu votre paiement CinetPay pour la commande #${String(order._id).slice(-8)}.\n\nMerci !`,
              html: `<p>Bonjour ${user.name},</p><p>Nous avons bien reçu votre paiement CinetPay pour la commande <strong>#${String(order._id).slice(-8)}</strong>.</p>`,
            })
          } catch (_) { /* ignore */ }
        }
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('CinetPay notify:', error)
    res.status(200).send('OK')
  }
}

module.exports = { initCinetPay, getCinetPayNotify, postCinetPayNotify }
