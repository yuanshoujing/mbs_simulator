import * as log from 'loglevel'

import Client from './mbs_client'

log.enableAll()

let client = new Client('localhost', 40660)
client.connect()

client.sn()
client.pack(1, { a: 1 })
