const { parse } = require('csv-parse')
const fs = require('fs')
const { csvRowSchema } = require('../middleware/validate')

const MAX_ROWS = 5000

/**
 * Parse and validate a CSV file of transactions.
 * Expected columns (case-insensitive): date, amount, direction, category, description, merchant_name
 * - Max 5000 rows
 * - Every row validated against csvRowSchema
 * - Temp file always deleted after parsing (success or failure)
 */
async function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    const errors = []

    const stream = fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))

    stream.on('data', row => {
      // Hard stop at row limit
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

      const result = csvRowSchema.safeParse({
        date: keys.date,
        amount: isNaN(rawAmount) ? null : rawAmount,
        direction: (keys.direction || 'inflow').toLowerCase(),
        category: (keys.category || 'uncategorised').toLowerCase(),
        description: keys.description || null,
        merchantName: keys.merchant_name || keys.merchantname || null,
      })

      if (!result.success) {
        errors.push({
          row: rows.length + errors.length + 1,
          issues: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
      } else {
        rows.push({
          ...result.data,
          date: new Date(result.data.date),
          amount: Math.round(result.data.amount * 100), // convert to cents
        })
      }
    })

    stream.on('end', () => {
      fs.unlink(filePath, () => {}) // always clean up temp file

      if (errors.length > 0) {
        return reject(Object.assign(
          new Error(`CSV validation failed on ${errors.length} row(s)`),
          { status: 422, validationErrors: errors }
        ))
      }
      if (rows.length === 0) {
        return reject(Object.assign(new Error('CSV file contained no valid rows'), { status: 422 }))
      }
      resolve(rows)
    })

    stream.on('error', err => {
      fs.unlink(filePath, () => {}) // clean up even on stream error
      reject(err)
    })
  })
}

module.exports = { parseCsvFile }
