import * as log from 'loglevel'

import Client from './mbs_client'

log.enableAll()

let client = new Client('localhost', 40660)
client.connect()

client.sn()
client.pack(1, { a: 1 })
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    client.login()
  }, 1000)
}
