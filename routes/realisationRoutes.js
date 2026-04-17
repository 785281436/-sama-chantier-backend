const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRealisation,
  getWorkerRealisations,
  getAllRealisations,
  updateRealisation,
  deleteRealisation,
  likeRealisation,
  unlikeRealisation,
  boostRealisation,
  getTopRealisations
} = require('../controllers/realisationController');

router.route('/')
  .get(getAllRealisations)
  .post(protect, createRealisation);

router.get('/top', getTopRealisations);
router.get('/worker/:workerId', getWorkerRealisations);

router.route('/:id')
  .put(protect, updateRealisation)
  .delete(protect, deleteRealisation);

router.post('/:id/like', protect, likeRealisation);
router.post('/:id/unlike', protect, unlikeRealisation);
router.post('/:id/boost', protect, boostRealisation);

module.exports = router;