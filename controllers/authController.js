const User = require('../models/User')
const { generateToken } = require('../middleware/authMiddleware')
const { sendMail } = require('../config/mail')

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email déjà utilisé' })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'client'
    })

    sendMail({
      to: user.email,
      subject: 'Bienvenue sur Sama Chantier',
      text: `Bonjour ${user.name},\n\nVotre compte Sama Chantier est bien créé. Vous pouvez dès maintenant parcourir le catalogue et contacter des artisans.\n\nÀ bientôt !`,
      html: `<p>Bonjour ${user.name},</p><p>Votre compte <strong>Sama Chantier</strong> est bien créé.</p><p>Vous pouvez parcourir le catalogue et contacter des artisans.</p>`,
    }).catch(() => {})

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }
    user.name    = req.body.name    || user.name
    user.phone   = req.body.phone   || user.phone
    user.address = req.body.address || user.address
    user.city    = req.body.city    || user.city
    if (req.body.password) user.password = req.body.password
    const updated = await user.save()
    res.json({
      _id:   updated._id,
      name:  updated.name,
      email: updated.email,
      role:  updated.role,
      token: generateToken(updated._id)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { register, login, getMe, updateProfile }