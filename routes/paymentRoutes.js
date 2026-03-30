const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { initCinetPay, getCinetPayNotify, postCinetPayNotify } = require('../controllers/cinetpayController')

router.post('/cinetpay/init', protect, initCinetPay)
router.get('/cinetpay/notify', getCinetPayNotify)
router.post('/cinetpay/notify', express.urlencoded({ extended: true }), postCinetPayNotify)

module.exports = router
