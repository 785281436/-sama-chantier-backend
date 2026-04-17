const Order   = require('../models/Order')
const Product = require('../models/Product')

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body
    if (!items?.length) return res.status(400).json({ message: 'Aucun article' })
    let subtotal = 0
    const enrichedItems = []
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product) return res.status(404).json({ message: 'Produit introuvable' })
      if (product.stock < item.quantity) return res.status(400).json({ message: `Stock insuffisant : ${product.name}` })
      subtotal += product.price * item.quantity
      enrichedItems.push({
        product:  product._id,
        name:     product.name,
        image:    product.images?.[0],
        quantity: item.quantity,
        price:    product.price
      })
      product.stock -= item.quantity
      await product.save()
    }
    const deliveryFee = subtotal > 50000 ? 0 : 2000
    const order = await Order.create({
      user: req.user._id,
      items: enrichedItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      notes
    })
    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone')
    if (!order) return res.status(404).json({ message: 'Commande introuvable' })
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Accès refusé' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Commande introuvable' })
    order.status = req.body.status
    if (req.body.status === 'livre') {
      order.isDelivered = true
      order.deliveredAt = new Date()
    }
    const updated = await order.save()
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus }