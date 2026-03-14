const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

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

module.exports = router
