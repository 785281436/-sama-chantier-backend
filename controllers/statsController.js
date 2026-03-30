const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Worker = require('../models/Worker')

const getStats = async (req, res) => {
  try {
    const [
      usersCount,
      productsCount,
      workersCount,
      ordersCount,
      pendingOrders,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Worker.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'en_attente' }),
      Order.aggregate([
        { $match: { status: { $ne: 'annule' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ])

    const revenue = revenueAgg[0]?.total || 0
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('total status createdAt user')

    res.json({
      users: usersCount,
      products: productsCount,
      workers: workersCount,
      orders: ordersCount,
      pendingOrders,
      revenue,
      recentOrders,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getStats }
