const mongoose = require('mongoose');

const realisationSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  boostLevel: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold'],
    default: 'none'
  },
  boostExpiryDate: {
    type: Date,
    default: null
  },
  boostPaymentId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

realisationSchema.index({ workerId: 1, createdAt: -1 });
realisationSchema.index({ boostLevel: 1, boostExpiryDate: 1 });
realisationSchema.index({ likeCount: -1 });

module.exports = mongoose.model('Realisation', realisationSchema);