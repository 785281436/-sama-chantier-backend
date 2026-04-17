const Realisation = require('../models/Realisation');
const Worker = require('../models/Worker');
const SponsoringPayment = require('../models/SponsoringPayment');

// Créer une réalisation
const createRealisation = async (req, res) => {
  try {
    const { title, description, image, imagePublicId } = req.body;
    
    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(403).json({ message: 'Seuls les ouvriers peuvent ajouter des réalisations' });
    }
    
    const realisation = await Realisation.create({
      workerId: worker._id,
      title,
      description,
      image,
      imagePublicId,
      likes: [],
      likeCount: 0
    });
    
    res.status(201).json(realisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les réalisations d'un worker
const getWorkerRealisations = async (req, res) => {
  try {
    const { workerId } = req.params;
    const realisations = await Realisation.find({ workerId })
      .sort({ boostLevel: -1, createdAt: -1 });
    
    // Vérifier si les boosts sont encore valides
    const now = new Date();
    for (const real of realisations) {
      if (real.boostExpiryDate && real.boostExpiryDate < now) {
        real.boostLevel = 'none';
        real.isPremium = false;
        await real.save();
      }
    }
    
    res.json(realisations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Liker une réalisation
const likeRealisation = async (req, res) => {
  try {
    const realisation = await Realisation.findById(req.params.id);
    if (!realisation) {
      return res.status(404).json({ message: 'Réalisation non trouvée' });
    }
    
    if (realisation.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous avez déjà liké cette réalisation' });
    }
    
    realisation.likes.push(req.user._id);
    realisation.likeCount = realisation.likes.length;
    await realisation.save();
    
    const worker = await Worker.findById(realisation.workerId);
    await worker.calculateScore();
    
    res.json({ message: 'Like ajouté', likeCount: realisation.likeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unlike
const unlikeRealisation = async (req, res) => {
  try {
    const realisation = await Realisation.findById(req.params.id);
    if (!realisation) {
      return res.status(404).json({ message: 'Réalisation non trouvée' });
    }
    
    realisation.likes = realisation.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );
    realisation.likeCount = realisation.likes.length;
    await realisation.save();
    
    const worker = await Worker.findById(realisation.workerId);
    await worker.calculateScore();
    
    res.json({ message: 'Like retiré', likeCount: realisation.likeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Booster une réalisation
const boostRealisation = async (req, res) => {
  try {
    const { level, duration, paymentReference } = req.body;
    const realisation = await Realisation.findById(req.params.id);
    
    if (!realisation) {
      return res.status(404).json({ message: 'Réalisation non trouvée' });
    }
    
    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker || realisation.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const prices = {
      bronze: { 7: 5000, 30: 15000 },
      silver: { 7: 15000, 30: 45000 },
      gold: { 7: 50000, 30: 150000 }
    };
    
    const amount = prices[level][duration];
    if (!amount) {
      return res.status(400).json({ message: 'Tarif invalide' });
    }
    
    const payment = await SponsoringPayment.create({
      workerId: worker._id,
      userId: req.user._id,
      type: 'realisation_boost',
      itemId: realisation._id,
      level,
      duration,
      amount,
      paymentReference,
      expiryDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      status: 'pending'
    });
    
    res.json({ 
      message: 'Initialisation du boost', 
      paymentId: payment._id,
      amount,
      paymentReference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirmer le boost
const confirmBoost = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;
    const payment = await SponsoringPayment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    payment.status = 'completed';
    payment.paymentReference = transactionId;
    await payment.save();
    
    const realisation = await Realisation.findById(payment.itemId);
    realisation.isPremium = true;
    realisation.boostLevel = payment.level;
    realisation.boostExpiryDate = payment.expiryDate;
    realisation.boostPaymentId = payment._id;
    await realisation.save();
    
    res.json({ message: 'Réalisation boostée avec succès', realisation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les top réalisations
const getTopRealisations = async (req, res) => {
  try {
    const realisations = await Realisation.find()
      .sort({ boostLevel: -1, likeCount: -1, createdAt: -1 })
      .limit(20)
      .populate('workerId', 'specialty user');
    
    res.json(realisations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les réalisations
const getAllRealisations = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const realisations = await Realisation.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('workerId', 'specialty user');
    
    const total = await Realisation.countDocuments();
    
    res.json({
      realisations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une réalisation
const updateRealisation = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const realisation = await Realisation.findById(req.params.id);
    
    if (!realisation) {
      return res.status(404).json({ message: 'Réalisation non trouvée' });
    }
    
    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker || realisation.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    realisation.title = title || realisation.title;
    realisation.description = description || realisation.description;
    realisation.image = image || realisation.image;
    realisation.updatedAt = Date.now();
    await realisation.save();
    
    res.json(realisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une réalisation
const deleteRealisation = async (req, res) => {
  try {
    const realisation = await Realisation.findById(req.params.id);
    
    if (!realisation) {
      return res.status(404).json({ message: 'Réalisation non trouvée' });
    }
    
    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker || realisation.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    await realisation.deleteOne();
    await worker.calculateScore();
    
    res.json({ message: 'Réalisation supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRealisation,
  getWorkerRealisations,
  getAllRealisations,
  updateRealisation,
  deleteRealisation,
  likeRealisation,
  unlikeRealisation,
  boostRealisation,
  confirmBoost,
  getTopRealisations
};