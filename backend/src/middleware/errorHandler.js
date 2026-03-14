function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production'
  const status = err.status || err.statusCode || 500

  // Always log full details server-side
  console.error(JSON.stringify({
    event: 'error',
    status,
    message: err.message,
    path: req.path,
    method: req.method,
    ts: new Date().toISOString(),
    ...(isDev && { stack: err.stack }),
  }))

  // 4xx: our own controlled messages, safe to return
  // 5xx: generic in production, full message in dev only
  const clientMessage = status < 500
    ? err.message
    : isDev ? err.message : 'An internal error occurred'

  const body = { error: clientMessage }
  if (err.validationErrors) body.validationErrors = err.validationErrors

  res.status(status).json(body)
}

module.exports = errorHandler
