const Worker = require('../models/Worker')

const getWorkers = async (req, res) => {
  try {
    const { specialty, city, available, page = 1, limit = 12 } = req.query
    const filter = {}
    if (specialty) filter.specialty = specialty
    if (city) filter.city = { $regex: city, $options: 'i' }
    if (available !== undefined) filter.availability = available === 'true'
    const total   = await Worker.countDocuments(filter)
    const workers = await Worker.find(filter)
      .populate('user', 'name avatar phone')
      .sort({ isVerified: -1, ratings: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    res.json({ workers, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('user', 'name avatar phone email city')
    if (!worker) return res.status(404).json({ message: 'Ouvrier introuvable' })
    res.json(worker)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createWorkerProfile = async (req, res) => {
  try {
    const exists = await Worker.findOne({ user: req.user._id })
    if (exists) return res.status(400).json({ message: 'Vous avez déjà un profil ouvrier' })
    const worker = await Worker.create({ ...req.body, user: req.user._id })
    res.status(201).json(worker)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
    if (!worker) return res.status(404).json({ message: 'Profil introuvable' })
    if (worker.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Accès refusé' })
    const updated = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true })
    if (!worker) return res.status(404).json({ message: 'Ouvrier introuvable' })
    res.json({ message: 'Ouvrier vérifié', worker })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getWorkers, getWorkerById, createWorkerProfile, updateWorkerProfile, verifyWorker }