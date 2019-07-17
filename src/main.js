import * as log from 'loglevel'

import MBusClient from './mbs/client'
import QianGuClient from './qiangu/client'

// log.enableAll()
log.setLevel('info')
// 模拟云朗协议客户端
// let client = new MBusClient('localhost', 40660)
// client.id = 'LDZN00010001'
// client.connect()

// 模拟乾谷协议
let client = new QianGuClient('localhost', 40660)
// let d = client.unpack('5aa5101011001374000030100020340058030000000000046722166600002bbde7002be4320000264b0009573500001fa50009379000000000000007e30710160a2d020700000000011664017000005d5a07d00319aa002d0000000000000000000000000000000000c1')
// log.info(d)
client.connect()

// 模拟刷卡
setTimeout(() => {
  client.verifyCard('11111111', 0)
}, 5000)
