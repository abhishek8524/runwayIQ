require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const errorHandler = require('./middleware/errorHandler')

const transactionsRouter = require('./routes/transactions')
const metricsRouter = require('./routes/metrics')
const forecastRouter = require('./routes/forecast')
const riskRouter = require('./routes/risk')
const reportRouter = require('./routes/report')
const businessesRouter = require('./routes/businesses')
const simulateRouter = require('./routes/simulate')
const chatRouter = require('./routes/chat')

const app = express()
const PORT = process.env.PORT || 3000

// 1. Security headers
app.use(helmet())

// 2. CORS — whitelist frontend origins (comma-separated env var, always includes localhost)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, ''))
    : []),
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// 3. Global rate limiter — 200 req / 15 min / IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use(globalLimiter)

// 4. Body parsing
app.use(express.json())

app.use('/api/transactions', transactionsRouter)
app.use('/api/metrics', metricsRouter)
app.use('/api/forecast', forecastRouter)
app.use('/api/risk', riskRouter)
app.use('/api/report', reportRouter)
app.use('/api/businesses', businessesRouter)
app.use('/api/simulate', simulateRouter)
app.use('/api/chat', chatRouter)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`RunwayIQ backend running on http://localhost:${PORT}`)
})
