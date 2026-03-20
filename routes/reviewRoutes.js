const express = require('express')
const router  = express.Router()
const { addReview, getProductReviews, getWorkerReviews, deleteReview } = require('../controllers/reviewController')
const { protect } = require('../middleware/authMiddleware')

router.post('/',            protect, addReview)
router.get('/product/:id',  getProductReviews)
router.get('/worker/:id',   getWorkerReviews)
router.delete('/:id',       protect, deleteReview)

module.exports = router