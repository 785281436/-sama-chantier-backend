const express = require('express')
const router  = express.Router()
const { getWorkers, getMyWorker, getWorkerById, createWorkerProfile, updateWorkerProfile, verifyWorker } = require('../controllers/workerController')
const { protect, admin } = require('../middleware/authMiddleware')

router.get('/',            getWorkers)
router.get('/me',          protect, getMyWorker)
router.get('/:id',         getWorkerById)
router.post('/',           protect, createWorkerProfile)
router.put('/:id',         protect, updateWorkerProfile)
router.put('/:id/verify',  protect, admin, verifyWorker)

module.exports = router