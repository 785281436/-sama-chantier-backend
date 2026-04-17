const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes (version minimale)
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/workers',  require('./routes/workerRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/upload',   require('./routes/uploadRoutes'));

// Route test
app.get('/', (req, res) => res.json({ message: '🏗️ Sama Chantier API is running' }))

// 404
app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }))

// Erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Erreur serveur' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`))