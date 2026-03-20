const express = require('express')
const router  = express.Router()
const { getProducts, getProductById, getFeaturedProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController')
const { protect, admin } = require('../middleware/authMiddleware')

router.get('/featured', getFeaturedProducts)
router.get('/',         getProducts)
router.get('/:id',      getProductById)
router.post('/',        protect, admin, createProduct)
router.put('/:id',      protect, admin, updateProduct)
router.delete('/:id',   protect, admin, deleteProduct)

module.exports = router