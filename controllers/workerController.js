const Worker = require('../models/Worker');
const Realisation = require('../models/Realisation');
const SponsoringPayment = require('../models/SponsoringPayment');

// ========== FONCTIONS EXISTANTES ==========

const getWorkers = async (req, res) => {
  try {
    const { specialty, city, available, keyword, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (specialty) filter.specialty = specialty;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (available !== undefined && available !== '') {
      filter.availability = available === 'true';
    }

    let workers = await Worker.find(filter)
      .populate('user', 'name avatar phone email')
      .sort({ isSponsored: -1, workerScore: -1, isVerified: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (keyword) {
      workers = workers.filter(w =>
        w.user?.name?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    const total = keyword ? workers.length : await Worker.countDocuments(filter);

    res.json({
      workers,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('user', 'name avatar phone email city');
    if (!worker) return res.status(404).json({ message: 'Ouvrier introuvable' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createWorkerProfile = async (req, res) => {
  try {
    const exists = await Worker.findOne({ user: req.user._id });
    if (exists) return res.status(400).json({ message: 'Vous avez déjà un profil ouvrier' });
    const worker = await Worker.create({ ...req.body, user: req.user._id });
    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Profil introuvable' });
    if (worker.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Accès refusé' });
    const updated = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!worker) return res.status(404).json({ message: 'Ouvrier introuvable' });
    res.json({ message: 'Ouvrier vérifié', worker });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== NOUVELLES FONCTIONS ==========

// Récupérer les top workers
const getTopWorkers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topWorkers = await Worker.find()
      .sort({ isSponsored: -1, workerScore: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name avatar phone city');
    
    res.json(topWorkers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les workers sponsorisés
const getSponsoredWorkers = async (req, res) => {
  try {
    const now = new Date();
    const sponsored = await Worker.find({
      isSponsored: true,
      sponsorExpiryDate: { $gt: now }
    })
      .sort({ sponsorLevel: -1, workerScore: -1 })
      .populate('user', 'name avatar phone city');
    
    res.json(sponsored);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sponsoriser un worker
const sponsorWorker = async (req, res) => {
  try {
    const { level, duration, paymentReference } = req.body;
    const worker = await Worker.findById(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker non trouvé' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (worker.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Tarifs (FCFA)
    const prices = {
      bronze: { 7: 5000, 30: 15000 },
      silver: { 7: 15000, 30: 45000 },
      gold: { 7: 50000, 30: 150000 }
    };
    
    const amount = prices[level][duration];
    if (!amount) {
      return res.status(400).json({ message: 'Tarif invalide' });
    }
    
    // Créer le paiement
    const payment = await SponsoringPayment.create({
      workerId: worker._id,
      userId: req.user._id,
      type: 'worker_sponsor',
      itemId: worker._id,
      level,
      duration,
      amount,
      paymentReference,
      expiryDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      status: 'pending'
    });
    
    res.json({ 
      message: 'Initialisation du paiement', 
      paymentId: payment._id,
      amount,
      paymentReference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirmer le sponsoring après paiement
const confirmSponsor = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;
    const payment = await SponsoringPayment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    payment.status = 'completed';
    payment.paymentReference = transactionId;
    await payment.save();
    
    const worker = await Worker.findById(payment.workerId);
    worker.isSponsored = true;
    worker.sponsorLevel = payment.level;
    worker.sponsorExpiryDate = payment.expiryDate;
    await worker.save();
    
    res.json({ message: 'Worker sponsorisé avec succès', worker });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculer tous les scores
const recalculateAllScores = async (req, res) => {
  try {
    // Vérifier admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    
    const workers = await Worker.find();
    let updated = 0;
    
    for (const worker of workers) {
      await worker.calculateScore();
      updated++;
    }
    
    res.json({ message: `Scores recalculés pour ${updated} workers` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getWorkers, 
  getWorkerById, 
  createWorkerProfile, 
  updateWorkerProfile, 
  verifyWorker,
  getTopWorkers,
  getSponsoredWorkers,
  sponsorWorker,
  confirmSponsor,
  recalculateAllScores
};