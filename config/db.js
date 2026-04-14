const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('📍 Tentative de connexion à MongoDB...');
    
    // ✅ Utiliser MONGO_URI (comme dans votre .env)
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connecté avec succès');
  } catch (error) {
    console.error('❌ Erreur MongoDB :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;