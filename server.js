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
      'https://sama-chantier-backend.onrender.com'  // ✅ AJOUTER CELUI-CI
    ];

    // Autoriser Postman / mobile apps / server-to-server
    if (!origin) return callback(null, true);

    // Autoriser dynamiquement tous les domaines Vercel et Render
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')  // ✅ AJOUTER CELUI-CI
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... rest du code