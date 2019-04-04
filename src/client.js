import net from 'net'
import logger from './logger'

export default class MbsClient {
  constructor (host, port, timeout = 3000) {
    this.host = host
    this.port = port
    this.timeout = timeout
    this.channel = null

    this.onConnect = this.onConnect.bind(this)
    this.onData = this.onData.bind(this)
    this.onDrain = this.onDrain.bind(this)
    this.onEnd = this.onEnd.bind(this)
    this.onError = this.onError.bind(this)
    this.onLookup = this.onLookup.bind(this)
    this.onReady = this.onReady.bind(this)
    this.onTimeout = this.onTimeout.bind(this)
    this.onClose = this.onClose.bind(this)
  }

  connect () {
    this.channel = net.connect({
      host: this.host,
      port: this.port
    })
    this.channel.setTimeout(this.timeout)

    this.channel.on('connect', this.onConnect)
    this.channel.on('data', this.onData)
    this.channel.on('drain', this.onDrain)
    this.channel.on('end', this.onEnd)
    this.channel.on('error', this.onError)
    this.channel.on('lookup', this.onLookup)
    this.channel.on('ready', this.onReady)
    this.channel.on('timeout', this.onTimeout)
    this.channel.on('close', this.onClose)
  }

  onConnect () {
    logger.info('连接到服务器成功！', this.channel.remoteAddress)
  }

  onData (data) {
    logger.info('收到数据：', data)
  }

  onDrain () {
    logger.info('drain')
  }

  onEnd () {
    logger.info('end')
  }

  onError (err) {
    logger.info('error: ', err)
  }

  onLookup (err, address, family, host) {
    logger.info('lookup: ', {
      err, address, family, host
    })
  }

  onReady () {
    logger.info('ready')
  }

  onTimeout () {
    logger.info('超时')
  }

  onClose () {
    logger.info('close')
  }
}

// const client = net.connect({
//   port: 40660
// //   host: '192.168.100.151'
// }, () => {
//   logger.info('--> 连接到服务器')
//   console.log('连接到服务器')
// })

// client.on('data', (data) => {
//   console.log(data.toString())
// })

// client.on('error', (err) => {
//   console.log(err)
// })

// client.on('end', () => {
//   console.log('断开连接')
// })

// export default client
