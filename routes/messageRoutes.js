const express = require('express')
const router = express.Router()
const { listContacts, getThread, sendMessage } = require('../controllers/messageController')
const { protect } = require('../middleware/authMiddleware')

router.get('/contacts', protect, listContacts)
router.get('/thread/:userId', protect, getThread)
router.post('/', protect, sendMessage)

module.exports = router
