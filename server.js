const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// ✅ Configuration CORS corrigée (une seule fois)
app.use(cors({ 
  origin: ['https://sama-chantier-frontend-fi68.vercel.app', 'http://localhost:5173'], 
  credentials: true 
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth',       require('./routes/authRoutes'))
app.use('/api/products',   require('./routes/productRoutes'))
app.use('/api/orders',     require('./routes/orderRoutes'))
app.use('/api/workers',    require('./routes/workerRoutes'))
app.use('/api/reviews',    require('./routes/reviewRoutes'))
app.use('/api/upload',     require('./routes/uploadRoutes'))
app.use('/api/stats',      require('./routes/statsRoutes'))
app.use('/api/quotes',     require('./routes/quoteRoutes'))
app.use('/api/messagerie', require('./routes/messageRoutes'))
app.use('/api/payments',   require('./routes/paymentRoutes'))

// Route test
app.get('/', (req, res) => res.json({ message: '🏗️ Sama Chantier API is running' }))

// ... le reste de votre code