const mongoose = require('mongoose')

const workerSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true, enum: ['macon','carreleur','plombier','electricien','peintre','menuisier','soudeur','autre'] },
  bio:           { type: String },
  experience:    { type: Number, default: 0 },
  hourlyRate:    { type: Number },
  dailyRate:     { type: Number },
  city:          { type: String, default: 'Dakar' },
  zone:          { type: String },
  availability:  { type: Boolean, default: true },
  skills:        [{ type: String }],
  portfolio:     [{ 
    url: String, 
    caption: String,
    date: { type: Date, default: Date.now }
  }],
  ratings:       { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  isVerified:    { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Worker', workerSchema)