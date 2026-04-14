const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ✅ CORS PRODUCTION FIX - COMPLÈTE
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sama-chantier-frontend-fi68.vercel.app',
      'https://sama-chantier-backend.onrender.com'
    ];

    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }

    console.warn("❌ Origine bloquée par CORS :", origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

// ✅ APPLIQUER LES MIDDLEWARES
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ IMPORTER LES ROUTES
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');

// ✅ UTILISER LES ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);

// ✅ ROUTE DE TEST
app.get('/api/health', (req, res) => {
  res.json({ message: '✅ Serveur en bonne santé' });
});

// ✅ GESTION DES ERREURS
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(err.status || 500).json({ 
    message: 'Erreur serveur', 
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// ✅ ÉCOUTE SUR LE PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});