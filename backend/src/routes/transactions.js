const express = require('express')
const multer = require('multer')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { parseCsvFile } = require('../services/csvParser')
const { computeAndStoreSnapshots } = require('../services/metricsService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true)
    else cb(new Error('Only CSV files are accepted'))
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

// POST /api/transactions/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' })

    const businessId = req.businessId // from JWT via requireAuth
    const rows = await parseCsvFile(req.file.path)

    await prisma.transaction.createMany({
      data: rows.map(r => ({ ...r, businessId, source: 'csv' })),
      skipDuplicates: true,
    })

    const snapshots = await computeAndStoreSnapshots(businessId)

    res.json({ imported: rows.length, snapshots: snapshots.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/transactions
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const businessId = req.businessId // from JWT via requireAuth
    const transactions = await prisma.transaction.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: 200,
    })
    res.json(transactions)
  } catch (err) {
    next(err)
  }
})

module.exports = router
