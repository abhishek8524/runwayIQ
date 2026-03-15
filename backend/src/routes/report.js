const prisma = require('../lib/prisma')
const express = require('express')
const rateLimit = require('express-rate-limit')

const { generateReport } = require('../services/aiService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()


// Tight rate limit on Claude API calls — 5 per hour per user
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?.id || req.ip,
  message: { error: 'Report generation limit reached. Try again in an hour.' },
})

// POST /api/report/generate
router.post('/generate', requireAuth, reportLimiter, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const report = await generateReport(businessId)
    res.json(report)
  } catch (err) {
    next(err)
  }
})

// GET /api/report/latest
router.get('/latest', requireAuth, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const report = await prisma.aIReport.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    })
    if (!report) return res.status(404).json({ error: 'No report found' })
    res.json(report)
  } catch (err) {
    next(err)
  }
})

module.exports = router
