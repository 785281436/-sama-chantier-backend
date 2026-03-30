const express = require('express')
const router = express.Router()
const { createQuote, getMyQuotes, updateQuote } = require('../controllers/quoteController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, createQuote)
router.get('/mine', protect, getMyQuotes)
router.put('/:id', protect, updateQuote)

module.exports = router
