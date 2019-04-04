import { Random } from 'random-js'
import crc32 from 'crc/crc32'
import _ from 'lodash'
import * as log from 'loglevel'

import Client from './client'

const random = new Random()
const snList = []

export default class MbsClient extends Client {
  constructor (host, port, timeout = 3000) {
    super(host, port, timeout)

    this.sender = 'mbssim'
    this.receiver = 'yl0001'

    this.login = this.login.bind(this)
  }

  sn () {
    let result = random.string(8)
    while (snList.includes(result)) {
      result = random.string(8)
    }

    snList.push(result)
    log.info('--> sn(): ' + result)
    return result
  }

  pack (srvcode, msg) {
    let m = JSON.stringify(msg)
    let crcCode = crc32(m).toString(16)
    let s = this.sn() + _.padStart(srvcode, 4) + this.receiver + this.sender +
      new Date().getTime() + '000   ' + crcCode

    s = 'S>' + s + m + '<E'

    log.info('--> pack(): ' + s)
  }

  unpack () {

  }

  login (id) {
    let msg = {
      id: id,
      state: 1
    }
  }
}
