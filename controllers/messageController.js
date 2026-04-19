const Message = require('../models/Message')

// Créer un ID de conversation unique entre 2 users
const getConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join('_')
}

// Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body
    const conversation = getConversationId(req.user._id, receiverId)

    const message = await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      content,
      conversation,
    })

    await message.populate('sender', 'name avatar')
    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Récupérer les messages entre 2 users
const getMessages = async (req, res) => {
  try {
    const conversation = getConversationId(req.user._id, req.params.userId)
    const messages = await Message.find({ conversation })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })

    // Marquer comme lus
    await Message.updateMany(
      { conversation, receiver: req.user._id, read: false },
      { read: true }
    )

    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Récupérer toutes les conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString()

    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 })

    // Grouper par conversation
    const conversations = {}
    messages.forEach(msg => {
      const convId = msg.conversation
      if (!conversations[convId]) {
        conversations[convId] = {
          id: convId,
          lastMessage: msg,
          otherUser: msg.sender._id.toString() === userId ? msg.receiver : msg.sender,
          unread: 0
        }
      }
      if (!msg.read && msg.receiver._id.toString() === userId) {
        conversations[convId].unread++
      }
    })

    res.json(Object.values(conversations))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Compter messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { sendMessage, getMessages, getConversations, getUnreadCount }