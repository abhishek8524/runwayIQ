const express = require('express')
const { getRiskScore } = require('../services/riskService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/risk
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const risk = await getRiskScore(businessId)
    res.json(risk)
  } catch (err) {
    next(err)
  }
})

module.exports = router
