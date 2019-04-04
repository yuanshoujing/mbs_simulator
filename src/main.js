import Client from './client'

let client = new Client('localhost', 40660)
client.connect()

// let i = 0
// let j = 1
// while (i < j) {
//   setTimeout(() => {
//     client.write('S>75b964b0   1YL0001ZX00011509259313953000       D1E2{}<E\r\n')
//     i += 1
//   }, 1000)

//   j -= 1
// }
