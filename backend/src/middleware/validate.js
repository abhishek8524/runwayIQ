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
  'revenue', 'cogs', 'payroll', 'rent', 'utilities', 'marketing',
  'software', 'travel', 'tax', 'refund', 'transfer', 'uncategorised',
]

const csvRowSchema = z.object({
  date: z.string().refine(s => !isNaN(Date.parse(s)), { message: 'Invalid date format' }),
  amount: z.number()
    .min(-10_000_000, 'Amount below -$10M limit')
    .max(10_000_000, 'Amount above $10M limit')
    .refine(n => isFinite(n), { message: 'Amount must be a finite number' }),
  direction: z.enum(['inflow', 'outflow']),
  category: z.enum(ALLOWED_CATEGORIES),
  description: z.string().max(500).nullable().optional(),
  merchantName: z.string().max(200).nullable().optional(),
})

module.exports = { validate, forecastSchema, csvRowSchema }
