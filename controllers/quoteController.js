const Quote = require('../models/Quote')
const Worker = require('../models/Worker')

const createQuote = async (req, res) => {
  try {
    const { workerId, title, description } = req.body
    if (!workerId || !title || !description) {
      return res.status(400).json({ message: 'workerId, title et description requis' })
    }
    const worker = await Worker.findById(workerId)
    if (!worker) return res.status(404).json({ message: 'Ouvrier introuvable' })
    if (worker.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer un devis à vous-même' })
    }
    const quote = await Quote.create({
      client: req.user._id,
      worker: workerId,
      title,
      description,
    })
    const populated = await Quote.findById(quote._id)
      .populate({ path: 'worker', select: 'specialty city dailyRate user', populate: { path: 'user', select: 'name avatar phone' } })
      .populate('client', 'name email phone')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMyQuotes = async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.user._id })
    let quotes
    if (worker) {
      const asWorker = await Quote.find({ worker: worker._id })
        .sort({ createdAt: -1 })
        .populate('client', 'name email phone')
      const asClient = await Quote.find({ client: req.user._id })
        .sort({ createdAt: -1 })
        .populate('worker', 'specialty city')
        .populate({ path: 'worker', populate: { path: 'user', select: 'name phone' } })
      return res.json({ asClient, asWorker })
    }
    quotes = await Quote.find({ client: req.user._id })
      .sort({ createdAt: -1 })
      .populate('worker', 'specialty city')
      .populate({ path: 'worker', populate: { path: 'user', select: 'name phone' } })
    res.json({ asClient: quotes, asWorker: [] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('worker')
    if (!quote) return res.status(404).json({ message: 'Devis introuvable' })

    const workerDoc = await Worker.findOne({ user: req.user._id })
    const isClient = quote.client.toString() === req.user._id.toString()
    const isWorkerOwner = workerDoc && quote.worker._id.toString() === workerDoc._id.toString()

    if (!isClient && !isWorkerOwner) return res.status(403).json({ message: 'Accès refusé' })

    if (isWorkerOwner) {
      const { proposedAmount, workerMessage, status } = req.body
      if (proposedAmount != null) quote.proposedAmount = Number(proposedAmount)
      if (workerMessage != null) quote.workerMessage = workerMessage
      if (status === 'devis_envoye' || status === 'refuse') quote.status = status
    }

    if (isClient) {
      const { status } = req.body
      if (status === 'accepte' && quote.status === 'devis_envoye') quote.status = 'accepte'
      if (status === 'refuse' && quote.status === 'devis_envoye') quote.status = 'refuse'
      if (status === 'annule' && ['demande', 'devis_envoye'].includes(quote.status)) quote.status = 'annule'
    }

    await quote.save()
    const updated = await Quote.findById(quote._id)
      .populate('client', 'name email phone')
      .populate('worker', 'specialty city')
      .populate({ path: 'worker', populate: { path: 'user', select: 'name phone' } })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createQuote, getMyQuotes, updateQuote }
