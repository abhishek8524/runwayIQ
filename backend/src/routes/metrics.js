const express = require('express')
const { getSnapshotHistory, getLatestSnapshot } = require('../services/metricsService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/metrics
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const [history, latest] = await Promise.all([
      getSnapshotHistory(businessId),
      getLatestSnapshot(businessId),
    ])
    res.json({ history, latest })
  } catch (err) {
    next(err)
  }
})

module.exports = router
