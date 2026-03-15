const prisma = require('../lib/prisma')
const express = require('express')

const { requireAuth } = require('../middleware/auth')
const { computeAndStoreSnapshots } = require('../services/metricsService')

const router = express.Router()


// GET /api/businesses — list all businesses for the authenticated user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, cashOnHand: true, createdAt: true },
    })
    res.json(businesses)
  } catch (err) {
    next(err)
  }
})

// POST /api/businesses — create a new business for the authenticated user
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, cashOnHand } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' })
    }

    const business = await prisma.business.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        cashOnHand: cashOnHand ? Math.round(Number(cashOnHand) * 100) : 0,
      },
    })

    res.status(201).json(business)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/businesses/current — update name or cashOnHand for the user's business
router.patch('/current', requireAuth, async (req, res, next) => {
  try {
    const { name, cashOnHand } = req.body
    const data = {}
    if (name && typeof name === 'string' && name.trim().length > 0) {
      data.name = name.trim()
    }
    if (cashOnHand !== undefined) {
      data.cashOnHand = Math.max(0, Math.round(Number(cashOnHand) * 100))
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Provide name or cashOnHand to update' })
    }
    const business = await prisma.business.update({
      where: { id: req.businessId },
      data,
      select: { id: true, name: true, cashOnHand: true },
    })

    // Recompute all snapshots so runway reflects the new cash balance
    if (data.cashOnHand !== undefined) {
      await computeAndStoreSnapshots(req.businessId)
    }

    res.json(business)
  } catch (err) {
    next(err)
  }
})

module.exports = router
