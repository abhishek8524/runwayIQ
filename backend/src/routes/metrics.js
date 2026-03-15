const express = require('express')
const { computeAndStoreSnapshots, getSnapshotHistory, getLatestSnapshot, getMomDeltas } = require('../services/metricsService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/metrics
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    await computeAndStoreSnapshots(businessId)
    const [history, latest, momDeltas] = await Promise.all([
      getSnapshotHistory(businessId),
      getLatestSnapshot(businessId),
      getMomDeltas(businessId),
    ])
    res.json({ history, latest, momDeltas })
  } catch (err) {
    next(err)
  }
})

module.exports = router
