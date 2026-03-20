const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur introuvable' })
      }
      return next()
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide' })
    }
  }
  return res.status(401).json({ message: 'Non autorisé, token manquant' })
}

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  return res.status(403).json({ message: 'Accès réservé aux administrateurs' })
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

module.exports = { protect, admin, generateToken }