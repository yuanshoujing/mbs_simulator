import { Random } from 'random-js'
import crc32 from 'crc/crc32'
import _ from 'lodash'
import * as log from 'loglevel'

import Client from '../client'

const random = new Random()
const snList = []

export default class MbsClient extends Client {
  constructor (host, port, timeout = 5000) {
    super(host, port, timeout)

    this.sender = 'mbssim'
    this.receiver = 'YL0001'
    this.id = random.string(16)

    this.logined = false
    this.login = this.login.bind(this)
  }

  sn () {
    let result = random.string(8)
    while (snList.includes(result)) {
      result = random.string(8)
    }

    snList.push(result)
    // log.info('--> sn(): ' + result)
    return result
  }

  pack (srvcode, msg) {
    let m = JSON.stringify(msg)
    let crcCode = crc32(m).toString(16)
    let s = this.sn() + _.padStart(srvcode, 4) + this.receiver + this.sender +
      new Date().getTime() + '000   ' + crcCode

    s = 'S>' + s + m + '<E'
    // log.info('--> pack(): ' + s)
    return s
  }

  unpack (d) {
    // S>pOR_zxc2 100mbssimYL0001156227214663700020029e8f313{"id":"LDZN00010001","time":1562243346638}<E
    let sn = _.trim(d.substr(2, 8))
    let srvCode = parseInt(_.trim(d.substr(10, 4)))
    let receiver = _.trim(d.substr(14, 6))
    let sender = _.trim(d.substr(20, 6))
    let time = new Date(parseInt(_.trim(d.substr(26, 13))))
    let encrypted = parseInt(_.trim(d.substr(39, 1))) === 1
    let compressed = parseInt(_.trim(d.substr(40, 1))) === 1
    let priority = parseInt(_.trim(d.substr(41, 1)))
    let responseCode = parseInt(_.trim(d.substr(42, 3)))
    let checkCode = _.trim(d.substr(45, 8))
    let body = JSON.parse(_.trim(d.substring(53, d.length - 2)))
    return {
      sn, srvCode, receiver, sender, time, encrypted, compressed, priority, responseCode, checkCode, body
    }
  }

  onConnect () {
    this.login()
  }

  onData (data) {
    let d = this.unpack(data.toString('utf8'))
    // log.info('收到数据：', d)
    switch (d.srvCode) {
      case 1:
        this.onHeartbeat(d)
        break
      case 100:
        this.onlogin(d)
        break
      case 102:
        this.onOpen(d)
        break
      case 104:
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
    let msg = {
      id: this.id,
      state: 1
    }

    let s = this.pack(100, msg)
    this.channel.write(s)
  }

  onlogin (msg) {
    if (msg.responseCode === 200) {
      this.logined = true
      log.info('--> 登录成功')
    } else {
      log.info('--> 登录失败：', msg)
    }
  }

  heartbeat () {
    log.info('--> 发送心跳...')
    let msg = {
      id: this.id
    }

    let s = this.pack(1, msg)
    this.channel.write(s)
  }

  onHeartbeat (msg) {
    log.info('--> 心跳成功')
  }

  verifyCard () {
    log.info('--> 模拟刷卡...')
    let msg = this.pack(104, {
      id: this.id,
      channel: 0,
      card: '11111111'
    })
    this.channel.write(msg)
  }

  onVerifyCard (msg) {
    if (msg.responseCode === 200) {
      log.info('--> 刷卡成功，卡内余额为：', msg.body)
    } else {
      log.info('--> 刷卡失败，原因是：', msg.body.error)
    }
  }

  onOpen (msg) {

  }
}
