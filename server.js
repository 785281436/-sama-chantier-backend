const express    = require('express')
const cors       = require('cors')
const dotenv     = require('dotenv')
const http       = require('http')
const { Server } = require('socket.io')
const connectDB  = require('./config/db')

dotenv.config()
connectDB()

const app    = express()
const server = http.createServer(app)

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      process.env.CLIENT_URL
    ],
    methods: ['GET', 'POST']
  }
})

// Stocker les users connectés
const connectedUsers = {}

io.on('connection', (socket) => {
  console.log('🔌 Utilisateur connecté:', socket.id)

  // User rejoint avec son ID
  socket.on('join', (userId) => {
    connectedUsers[userId] = socket.id
    console.log(`✅ User ${userId} connecté`)
  })

  // Envoyer un message en temps réel
  socket.on('sendMessage', (message) => {
    const receiverSocketId = connectedUsers[message.receiver]
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', message)
    }
  })

  // Déconnexion
  socket.on('disconnect', () => {
    Object.keys(connectedUsers).forEach(userId => {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId]
      }
    })
    console.log('❌ Utilisateur déconnecté:', socket.id)
  })
})

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL,
    /\.vercel\.app$/
  ],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth',         require('./routes/authRoutes'))
app.use('/api/products',     require('./routes/productRoutes'))
app.use('/api/orders',       require('./routes/orderRoutes'))
app.use('/api/workers',      require('./routes/workerRoutes'))
app.use('/api/reviews',      require('./routes/reviewRoutes'))
app.use('/api/upload',       require('./routes/uploadRoutes'))
app.use('/api/messages',     require('./routes/messageRoutes'))
app.use('/api/realisations', require('./routes/realisationRoutes'))

app.get('/', (req, res) => res.json({ message: '🏗️ Sama Chantier API is running' }))
app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }))
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message || 'Erreur serveur' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`))