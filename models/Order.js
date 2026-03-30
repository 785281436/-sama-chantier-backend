const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:     String,
    quantity: { type: Number, required: true, min: 1 },
    price:    { type: Number, required: true },
    image:    String,
  }],
  shippingAddress: {
    address: { type: String, required: true },
    city:    { type: String, required: true },
    phone:   { type: String, required: true },
  },
  paymentMethod: { type: String, enum: ['wave','orange_money','free_money','cash','card','cinetpay'], required: true },
  paymentResult: { id: String, status: String, reference: String, paidAt: Date },
  subtotal:    { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total:       { type: Number, required: true },
  status:      { type: String, enum: ['en_attente','confirme','en_livraison','livre','annule'], default: 'en_attente' },
  isPaid:      { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  notes:       String,
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)