const { z } = require('zod')

/**
 * Validator factory — wraps any Zod schema into Express middleware.
 * Parsed data is attached to req.validated.
 */
function validate(schema, source = 'query') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: result.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      })
    }
    req.validated = result.data
    next()
  }
}

// --- Route schemas ---

const forecastSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(3),
})

// --- CSV row schema (used inside csvParser, not as route middleware) ---

const ALLOWED_CATEGORIES = [
  'revenue', 'cogs', 'opex', 'payroll', 'rent', 'utilities', 'marketing',
  'software', 'travel', 'tax', 'refund', 'transfer', 'uncategorised',
]

// Normalise direction aliases → 'inflow' | 'outflow'
function normaliseDirection(raw) {
  const v = (raw || '').toLowerCase().trim()
  if (['inflow', 'in', 'credit', 'income', 'revenue', 'positive'].includes(v)) return 'inflow'
  if (['outflow', 'out', 'debit', 'expense', 'payment', 'negative'].includes(v)) return 'outflow'
  return v // let zod reject it with a clear message
}

// Normalise category: keep allowed ones, map unknowns to 'uncategorised'
function normaliseCategory(raw) {
  const v = (raw || 'uncategorised').toLowerCase().trim()
  return ALLOWED_CATEGORIES.includes(v) ? v : 'uncategorised'
}

const csvRowSchema = z.object({
  date: z.string().refine(s => !isNaN(Date.parse(s)), { message: 'Invalid date format' }),
  amount: z.number()
    .refine(n => isFinite(n), { message: 'Amount must be a finite number' })
    .transform(n => Math.abs(n)), // always store as positive; direction col determines sign
  direction: z.enum(['inflow', 'outflow'], {
    errorMap: () => ({ message: "Direction must be 'inflow' or 'outflow' (or: in/out/credit/debit)" }),
  }),
  category: z.string(),
  description: z.string().max(500).nullable().optional(),
  merchantName: z.string().max(200).nullable().optional(),
})

module.exports = { validate, forecastSchema, csvRowSchema, normaliseDirection, normaliseCategory }
