const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  specialty: { 
    type: String, 
    required: true 
  },
  bio: { 
    type: String 
  },
  experience: { 
    type: Number, 
    default: 0 
  },
  dailyRate: { 
    type: Number, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  zone: { 
    type: String 
  },
  availability: { 
    type: Boolean, 
    default: true 
  },
  skills: [{ 
    type: String 
  }],
  portfolio: [{ 
    type: String 
  }],
  
  // ========== SYSTÈME DE NOTES ==========
  ratings: { 
    type: Number, 
    default: 0 
  },
  numReviews: { 
    type: Number, 
    default: 0 
  },
  completedJobs: { 
    type: Number, 
    default: 0 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  
  // ========== NOUVEAUX CHAMPS POUR LE SCORE ET LA MONÉTISATION ==========
  totalLikes: {
    type: Number,
    default: 0
  },
  workerScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isTopWorker: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isSponsored: {
    type: Boolean,
    default: false
  },
  sponsorLevel: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold'],
    default: 'none'
  },
  sponsorExpiryDate: {
    type: Date,
    default: null
  },
  lastScoreUpdate: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Index pour le classement
workerSchema.index({ workerScore: -1 });
workerSchema.index({ isSponsored: -1, workerScore: -1 });
workerSchema.index({ isTopWorker: -1 });

// Méthode pour calculer le score
workerSchema.methods.calculateScore = async function() {
  try {
    const Realisation = require('./Realisation');
    const realisations = await Realisation.find({ workerId: this._id });
    
    // Total des likes
    this.totalLikes = realisations.reduce((sum, r) => sum + (r.likeCount || 0), 0);
    
    // Calcul du score (40% likes, 30% rating, 30% missions)
    const maxLikes = 1000;
    const likesScore = Math.min((this.totalLikes / maxLikes) * 100, 100);
    const ratingScore = (this.ratings / 5) * 100;
    const jobsScore = Math.min((this.completedJobs / 100) * 100, 100);
    
    this.workerScore = (likesScore * 0.4) + (ratingScore * 0.3) + (jobsScore * 0.3);
    
    // Déterminer les badges
    this.isTopWorker = this.workerScore >= 70;
    this.isRecommended = this.workerScore >= 40 && this.workerScore < 70;
    
    // Vérifier expiration sponsoring
    if (this.sponsorExpiryDate && this.sponsorExpiryDate < new Date()) {
      this.isSponsored = false;
      this.sponsorLevel = 'none';
      this.sponsorExpiryDate = null;
    }
    
    this.lastScoreUpdate = new Date();
    await this.save();
    
    return this.workerScore;
  } catch (error) {
    console.error('Erreur calcul score:', error);
    return this.workerScore;
  }
};

module.exports = mongoose.model('Worker', workerSchema);