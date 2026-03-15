const { parse } = require('csv-parse')
const fs = require('fs')
const { csvRowSchema, normaliseDirection, normaliseCategory } = require('../middleware/validate')

const MAX_ROWS = 5000

/**
 * Parse and validate a CSV file of transactions.
 * Expected columns (case-insensitive): date, amount, direction, category, description, merchant_name
 * - direction aliases accepted: in/out/credit/debit/income/expense
 * - unknown categories are normalised to 'uncategorised' instead of rejected
 * - negative amounts are stored as positive (direction determines sign)
 * - Max 5000 rows; temp file always deleted after parsing
 */
async function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    const errors = []

    const stream = fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))

    stream.on('data', row => {
      if (rows.length + errors.length >= MAX_ROWS) {
        stream.destroy(
          Object.assign(new Error(`CSV exceeds maximum of ${MAX_ROWS} rows`), { status: 422 })
        )
        return
      }

      const keys = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v])
      )

      const rawAmount = parseFloat(keys.amount)
      // If amount is negative and no explicit direction, infer outflow
      const inferredDirection = !isNaN(rawAmount) && rawAmount < 0 ? 'outflow' : 'inflow'
      const rawDirection = keys.direction || inferredDirection

      const result = csvRowSchema.safeParse({
        date:         keys.date,
        amount:       isNaN(rawAmount) ? null : rawAmount,
        direction:    normaliseDirection(rawDirection),
        category:     normaliseCategory(keys.category),
        description:  keys.description || null,
        merchantName: keys.merchant_name || keys.merchantname || null,
      })

      if (!result.success) {
        errors.push({
          row:    rows.length + errors.length + 1,
          issues: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
      } else {
        rows.push({
          ...result.data,
          date:   new Date(result.data.date),
          amount: Math.round(result.data.amount * 100), // convert to cents
        })
      }
    })

    stream.on('end', () => {
      fs.unlink(filePath, () => {})

      if (errors.length > 0) {
        return reject(Object.assign(
          new Error(`CSV validation failed on ${errors.length} row(s). First issue: row ${errors[0].row} — ${errors[0].issues.map(i => `${i.field}: ${i.message}`).join(', ')}`),
          { status: 422, validationErrors: errors }
        ))
      }
      if (rows.length === 0) {
        return reject(Object.assign(new Error('CSV file contained no valid rows'), { status: 422 }))
      }
      resolve(rows)
    })

    stream.on('error', err => {
      fs.unlink(filePath, () => {})
      reject(err)
    })
  })
}

module.exports = { parseCsvFile }
