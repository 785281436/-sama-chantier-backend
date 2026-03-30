const Worker = require('../models/Worker')
const User = require('../models/User')

const getWorkers = async (req, res) => {
  try {
    const { specialty, city, available, keyword, page = 1, limit = 50 } = req.query

    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50))

    const filter = {}

    if (specialty) filter.specialty = specialty
    if (city) filter.city = { $regex: city, $options: 'i' }
    if (available !== undefined && available !== '') {
      filter.availability = available === 'true'
    }

    if (keyword && String(keyword).trim()) {
      const rx = new RegExp(String(keyword).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const users = await User.find({ name: rx }).select('_id')
      filter.user = { $in: users.map(u => u._id) }
    }

    const total = await Worker.countDocuments(filter)

    const workers = await Worker.find(filter)
      .populate('user', 'name avatar phone')
      .sort({ isVerified: -1, ratings: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    res.json({
      workers,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMyWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.user._id }).populate('user', 'name avatar phone email city')
    if (!worker) return res.status(404).json({ message: 'Aucun profil ouvrier' })
    res.json(worker)
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
    const { user: _u, isVerified: _v, ...data } = req.body
    const worker = await Worker.create({ ...data, user: req.user._id })
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
    const body = { ...req.body }
    delete body.user
    if (req.user.role !== 'admin') delete body.isVerified
    const updated = await Worker.findByIdAndUpdate(req.params.id, body, { new: true })
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

module.exports = { getWorkers, getMyWorker, getWorkerById, createWorkerProfile, updateWorkerProfile, verifyWorker }