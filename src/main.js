import * as log from 'loglevel'

import Client from './mbs/client'

log.enableAll()

let client = new Client('localhost', 40660)
client.id = 'LDZN00010001'
client.connect()

setTimeout(() => {
  client.verifyCard()
}, 5000)