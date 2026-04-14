const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();


// ==============================
// ✅ CONFIGURATION CORS PROPRE
// ==============================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sama-chantier-frontend-fi68.vercel.app'
    ];

    // ✅ Autoriser requêtes sans origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);

    // ✅ Autoriser Vercel (y compris preview)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    console.warn("⚠️ Origine non reconnue :", origin);

    // 🔥 IMPORTANT : NE PAS BLOQUER → sinon erreur 500
    return callback(null, true);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Appliquer CORS
app.use(cors(corsOptions));

// ✅ Gérer les requêtes preflight (IMPORTANT)
app.options('*', cors(corsOptions));


// ==============================
// ✅ BODY PARSER
// ==============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==============================
// ✅ IMPORT DES ROUTES
// ==============================
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


// ==============================
// ✅ ROUTES API
// ==============================
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


// ==============================
// ✅ ROUTE TEST
// ==============================
app.get('/api/health', (req, res) => {
  res.json({ message: '✅ Serveur en bonne santé' });
});


// ==============================
// ✅ GESTION ERREURS (IMPORTANT)
// ==============================
app.use((err, req, res, next) => {
  console.error('🔥 ERREUR BACKEND:', err.message);

  res.status(500).json({
    message: 'Erreur serveur',
    error: err.message
  });
});


// ==============================
// ✅ LANCEMENT SERVEUR
// ==============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});