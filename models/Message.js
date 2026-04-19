const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true, trim: true },
  read:     { type: Boolean, default: false },
  conversation: { type: String, required: true },
  // conversation = ID1_ID2 (trié alphabétiquement)
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)