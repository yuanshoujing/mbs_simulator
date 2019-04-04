const { createLogger, format, transports } = require('winston')

const instance = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({
      stack: true
    }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: 'combined.log'
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  instance.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }))
}

export default instance
