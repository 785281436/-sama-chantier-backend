const express = require('express')
const router  = express.Router()
const { sendMessage, getMessages, getConversations, getUnreadCount } = require('../controllers/messageController')
const { protect } = require('../middleware/authMiddleware')

router.post('/',                protect, sendMessage)
router.get('/conversations',    protect, getConversations)
router.get('/unread',           protect, getUnreadCount)
router.get('/:userId',          protect, getMessages)

module.exports = router