const Product = require('../models/Product')

const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query
    const filter = { isAvailable: true }

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }

    if (category) filter.category = category

    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    const total    = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .populate('supplier', 'name phone')
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name phone city')
    if (!product) return res.status(404).json({ message: 'Produit introuvable' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true, isAvailable: true })
      .limit(8)
      .sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, supplier: req.user._id })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ message: 'Produit introuvable' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Produit introuvable' })
    res.json({ message: 'Produit supprimé' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getProducts, getProductById, getFeaturedProducts, createProduct, updateProduct, deleteProduct }