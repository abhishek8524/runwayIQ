const express = require('express')
const { getLinearForecast } = require('../services/forecastService')
const { requireAuth } = require('../middleware/auth')
const { validate, forecastSchema } = require('../middleware/validate')

const router = express.Router()

// GET /api/forecast
router.get('/', requireAuth, validate(forecastSchema, 'query'), async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const { months } = req.validated  // from validate middleware (bounded 1–24)
    const forecast = await getLinearForecast(businessId, months)
    res.json(forecast)
  } catch (err) {
    next(err)
  }
})

module.exports = router
