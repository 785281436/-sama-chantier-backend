const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['product', 'worker'], required: true },
  product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  worker:     { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, required: true },
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)