const Message = require('../models/Message')
const User = require('../models/User')

const listContacts = async (req, res) => {
  try {
    const uid = req.user._id
    const sent = await Message.find({ sender: uid }).distinct('recipient')
    const received = await Message.find({ recipient: uid }).distinct('sender')
    const ids = [...new Set([...sent.map(String), ...received.map(String)])]
    const users = await User.find({ _id: { $in: ids } }).select('name email avatar role')
    const unread = await Message.aggregate([
      { $match: { recipient: uid, read: false } },
      { $group: { _id: '$sender', n: { $sum: 1 } } },
    ])
    const unreadMap = Object.fromEntries(unread.map(u => [String(u._id), u.n]))
    res.json(users.map(u => ({ ...u.toObject(), unread: unreadMap[String(u._id)] || 0 })))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getThread = async (req, res) => {
  try {
    const other = req.params.userId
    const uid = req.user._id
    const messages = await Message.find({
      $or: [
        { sender: uid, recipient: other },
        { sender: other, recipient: uid },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .limit(200)

    await Message.updateMany({ sender: other, recipient: uid, read: false }, { read: true })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { to, content } = req.body
    if (!to || !content?.trim()) return res.status(400).json({ message: 'Destinataire et message requis' })
    if (to === req.user._id.toString()) return res.status(400).json({ message: 'Destinataire invalide' })
    const exists = await User.findById(to)
    if (!exists) return res.status(404).json({ message: 'Utilisateur introuvable' })
    const msg = await Message.create({
      sender: req.user._id,
      recipient: to,
      content: content.trim(),
    })
    const populated = await Message.findById(msg._id)
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listContacts, getThread, sendMessage }
