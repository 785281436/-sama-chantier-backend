const mongoose = require('mongoose')

const quoteSchema = new mongoose.Schema({
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker:  { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  proposedAmount: { type: Number, min: 0 },
  workerMessage:  { type: String },
  status: { type: String, enum: ['demande', 'devis_envoye', 'accepte', 'refuse', 'annule'], default: 'demande' },
}, { timestamps: true })

module.exports = mongoose.model('Quote', quoteSchema)
