const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  getWorkers, 
  getWorkerById, 
  createWorkerProfile, 
  updateWorkerProfile, 
  verifyWorker,
  getTopWorkers,
  getSponsoredWorkers,
  sponsorWorker,
  confirmSponsor,
  recalculateAllScores
} = require('../controllers/workerController');

router.route('/')
  .get(getWorkers)
  .post(protect, createWorkerProfile);

router.get('/top', getTopWorkers);
router.get('/sponsored', getSponsoredWorkers);
router.post('/recalculate-scores', protect, recalculateAllScores);

router.post('/:id/sponsor', protect, sponsorWorker);
router.post('/confirm-sponsor', protect, confirmSponsor);

router.get('/:id', getWorkerById);
router.put('/:id', protect, updateWorkerProfile);
router.put('/:id/verify', protect, admin, verifyWorker);

module.exports = router;