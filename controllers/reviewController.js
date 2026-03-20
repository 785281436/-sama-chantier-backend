const Review  = require('../models/Review')
const Product = require('../models/Product')
const Worker  = require('../models/Worker')

const updateRatings = async (targetType, id) => {
  const field   = targetType === 'product' ? { product: id } : { worker: id }
  const reviews = await Review.find({ targetType, ...field })
  const avg     = reviews.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0
  if (targetType === 'product') await Product.findByIdAndUpdate(id, { ratings: avg, numReviews: reviews.length })
  else await Worker.findByIdAndUpdate(id, { ratings: avg, numReviews: reviews.length })
}

const addReview = async (req, res) => {
  try {
    const { targetType, productId, workerId, rating, comment } = req.body
    const reviewData = { user: req.user._id, targetType, rating, comment }
    if (targetType === 'product') reviewData.product = productId
    else reviewData.worker = workerId
    const review = await Review.create(reviewData)
    await updateRatings(targetType, targetType === 'product' ? productId : workerId)
    res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id, targetType: 'product' })
      .populate('user', 'name avatar').sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.id, targetType: 'worker' })
      .populate('user', 'name avatar').sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Avis introuvable' })
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Accès refusé' })
    await review.deleteOne()
    await updateRatings(review.targetType, review.product || review.worker)
    res.json({ message: 'Avis supprimé' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { addReview, getProductReviews, getWorkerReviews, deleteReview }