const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ['carreaux','ciment','peinture','fer','bois','plomberie','electricite','outillage','autre'] },
  images:      [{ type: String }],
  stock:       { type: Number, required: true, min: 0, default: 0 },
  unit:        { type: String, default: 'pièce' },
  brand:       { type: String },
  supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratings:     { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
}, { timestamps: true })

productSchema.index({ name: 'text', description: 'text' })

module.exports = mongoose.model('Product', productSchema)