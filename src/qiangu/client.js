import _ from 'lodash'
import * as log from 'loglevel'

import Client from '../client'
import schema from './schema'

export default class QianGuClient extends Client {
  constructor (host, port, timeout = 5000) {
    super(host, port, timeout)

    this.sender = 'QG0001'
    this.receiver = 'YL0001'
    this.id = '1371000020100001'
    this.channelNum = 2

    this.quantity = [0, 0] // 已充电度数
  }

  pack (srvcode, body) {
    const buf1 = Buffer.alloc(2)
    buf1.writeInt16BE(body.length / 2)
    let len = buf1.toString('hex')
    let s = '5aa510000000' + this.id + _.padStart(srvcode, 2, '0') + len + body + '0068'
    log.debug('--> pack(): ' + s)
    const buf = Buffer.from(s, 'hex')
    return buf
  }

  unpack (msg) {
    // 5aa5101011001374000030100020340058030000000000046722166600002bbde7002be4320000264b0009573500001fa50009379000000000
    // 000007e30710160a2d020700000000011664017000005d5a07d00319aa002d0000000000000000000000000000000000c1
    // 5aa510101100137400003010001934005803000000000004672216660000286cac00288a6c00001dc0000957350000188e00093ea717c5024c
    // 016507e30710160a1b020700140101011d59015200005b5807d00319aa03e80000000000000000000000000000000000fc
    // 头 5aa5
    let startFlag = msg.substring(0, 4)
    // 版本 10
    let version = msg.substring(4, 6)
    // 厂家编号 10
    let vender = msg.substring(6, 8)
    // 流水号 1100
    let sn = msg.substring(8, 12)
    // 终端号 2000000000000007
    let device = msg.substring(12, 28)
    // 命令字 1
    let srvCode = parseInt(_.trimStart(msg.substring(28, 30), '0'))
    // 长度 2
    let bodyLength = Buffer.from(msg.substring(30, 34), 'hex').readInt16BE()
    // 消息体
    let body = msg.substring(34, 34 + bodyLength * 2)
    // 检验码
    let checksum = msg.substring(34 + bodyLength * 2, 34 + bodyLength * 2 + 2)
    let endFlag = msg.substr(34 + bodyLength * 2 + 2, 2)

    let _schema = schema.getSchema(srvCode)
    // log.info('--> schema: ', _schema)
    let bodyarr = []
    let startIdx = 0
    for (let i = 0; i < _schema.records; i++) {
      if (startIdx >= body.length) {
        break
      }

      let len = _schema.recordLens[i]
      let endIdx = startIdx + len * 2

      let s = body.substring(startIdx, endIdx)
      log.debug('--> s: ', s, startIdx)

      let value = null
      if (_.includes(_schema.stringIdx, i)) {
        value = s
      } else if (s.length <= 8) {
        value = Buffer.from(_.padStart(s, 8, '0'), 'hex').readInt32BE()
      }

      bodyarr.push(value)
      startIdx = endIdx
    }

    body = bodyarr
    // log.info('--> body array: ', bodyarr)

    return {
      startFlag, version, vender, sn, device, srvCode, bodyLength, body, checksum, endFlag
    }
  }

  onReady () {
    this.login()
  }

  onData (data) {
    let d = this.unpack(data.toString('hex'))
    log.debug('收到数据：', d)
    switch (d.srvCode) {
      case 4:
        this.onHeartbeat(d)
        break
      case 2:
        this.onlogin(d)
        break
      case 40:
        this.onOpen(d)
        break
      case 42:
        this.atClose(d)
        break
      case 31:
        this.onVerifyCard(d)
        break
    }
  }

  onTimeout () {
    if (this.logined) {
      this.heartbeat()
    }
  }

  login () {
    log.info('--> 开始登录...')
    let body = '03020006'
    let s = this.pack(1, body)
    this.channel.write(s)
  }

  onlogin (msg) {
    let result = msg.body[3]
    if (result > 0) {
      this.logined = true
      log.info('--> 登录成功')
    } else {
      this.logined = false
      log.info('--> 登录失败：', msg)
    }
  }

  heartbeat () {
    log.debug('--> 发送心跳...')
    let s = this.pack(3, '00')
    this.channel.write(s)
  }

  onHeartbeat (msg) {
    log.debug('--> 心跳成功')
  }

  report () {
    if (this.device_port === undefined) {
      return
    }

    let state = 1
    let num = parseInt(_.random(0, 9).toString())
    if (num % 3 === 0) {
      state = 2
    }

    let msg = this.pack(103, {
      id: this.id,
      channel: this.device_port,
      state: state
    })

    log.info('--> 上报状态：', msg)
    this.channel.write(msg)
  }

  verifyCard (cardNo, channel) {
    if (!this.logined) {
      log.info('--> 尚未登录')
      return
    }

    log.info('--> 模拟刷卡...')
    this.device_port = channel
    this.cardNo = cardNo

    let body = '03' + _.padStart(channel, 2, '0') +
      '00' + _.padStart(cardNo, 16, '0') + '00123456'
    let msg = this.pack(30, body)
    this.channel.write(msg)
  }

  onVerifyCard (msg) {
    let balance = msg.body[4]
    let state = msg.body[5]
    if (state > 0) {
      log.info('--> 刷卡成功，卡内余额为：', balance)
    } else {
      log.info('--> 刷卡失败')
    }
  }

  atClose (msg) {
    log.info('--> 服务端已结算')
    process.exit()
  }

  onOpen (msg) {
    log.info('--> 开桩指令：', msg)

    let respBody = '03' + _.padStart(this.device_port, 2, '0') +
      '00' + _.padStart(this.cardNo, 16, '0') + '00ff00'
    let resp = this.pack(41, respBody)
    this.channel.write(resp)

    log.info('--> 开桩成功，开始模拟充电...')
    _.delay(() => {
      this.loop = setInterval(() => {
        // _.delay(() => {
        //   this.report()
        // }, 600)
        this.charging(this.device_port, msg.body[3])
      }, 5000)
    }, 2000)
  }

  charging (channel, user) {
    let offset = _.random(0, 10)
    let q = parseInt(this.quantity[channel].toString()) + parseInt(offset.toString())
    this.quantity[channel] = q

    const buf = Buffer.alloc(4)
    buf.writeInt32BE(123456, 0)
    let squantity = buf.toString('hex')

    buf.writeInt32BE(123456 + q, 0)
    let equantity = buf.toString('hex')

    buf.writeInt32BE(q, 0)
    let quan = buf.toString('hex')

    let socint = parseInt((q / 30 * 100).toString())
    buf.writeInt32BE(socint)
    let soc = buf.toString('hex').substr(7, 2)

    if (!this.today) {
      this.today = new Date()
    }

    buf.writeInt32BE(this.today.getFullYear(), 0)
    let year = buf.toString('hex').substr(5, 4)

    buf.writeInt32BE(this.today.getMonth() + 1, 0)
    let month = buf.toString('hex').substr(7, 2)

    buf.writeInt32BE(this.today.getDate(), 0)
    let day = buf.toString('hex').substr(7, 2)

    buf.writeInt32BE(this.today.getHours(), 0)
    let hour = buf.toString('hex').substr(7, 2)

    buf.writeInt32BE(this.today.getMinutes(), 0)
    let minute = buf.toString('hex').substr(7, 2)

    buf.writeInt32BE(this.today.getSeconds(), 0)
    let second = buf.toString('hex').substr(7, 2)

    let body = ('03' + _.padStart(this.device_port, 2, '0') +
      '00' + _.padStart(this.cardNo, 16, '0') + '00' + squantity + equantity + quan +
      '00002710 000003e8 00002328 00000bb8 000003ea 0000012c' + year + month + day + hour + minute + second +
      '02 1e 00c8 01 01 01 00' + soc + '07e6 07e6 01 01 00c8 01').replace(/\s/g, '')

    log.info('--> 上报充电信息：', body)

    let msg = this.pack(34, body)
    this.channel.write(msg)

    if (socint >= 100) {
      clearInterval(this.loop)

      // TODO 发送 36 指令
      log.info('--> 充电已结束')
    }
  }
}
