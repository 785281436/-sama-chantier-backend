const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/admin', protect, admin, async (req, res) => {
  try {
    res.json({ message: 'Stats à implémenter' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;