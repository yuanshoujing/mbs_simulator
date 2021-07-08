import * as log from "loglevel";

import MBusClient from "./mbs/client";
import QianGuClient from "./qiangu/client";

// log.enableAll()
log.setLevel("info");
// 模拟云朗协议客户端
// let client = new MBusClient('localhost', 40660)
// client.id = 'LDZN00010001'
// client.connect()

// 模拟乾谷协议
let client = new QianGuClient("61.158.167.166", 40662);
client.id = "1374000030100002";
client.cardNo = "3365360681";
client.connect();

// let d = client.unpack(
//   "5aa51000000013740000301000023400480300000000003365360681000001e2400001e2480000000800002710000003e80000232800000bb8000003ea0000012c07e507060e2832021e00c801010100a07e607e6010100c801006"
// );
// log.info(d);
