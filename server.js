const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ✅ CORS PRODUCTION FIX
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sama-chantier-frontend-fi68.vercel.app'
    ];

    // Autoriser Postman / mobile apps / server-to-server
    if (!origin) return callback(null, true);

    // Autoriser Vercel preview domains aussi
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    console.warn("❌ Origine bloquée par CORS :", origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ✅ UNE SEULE FOIS
app.use(cors(corsOptions));

// IMPORTANT pour preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... routes