import _ from "lodash";
import * as log from "loglevel";

import Client from "../client";
import schema from "./schema";

export default class QianGuClient extends Client {
  constructor(host, port, timeout = 5000) {
    super(host, port, timeout);

    this.id = "1371000020100001";
    this.pile_port = 0;
    this.cardNo = "3365360681";
  }

  pack(srvcode, body) {
    let len = _.padStart(parseInt(body.length / 2).toString(16), 4, "0");
    let s =
      "5aa510000000" +
      this.id +
      _.padStart(srvcode, 2, "0") +
      len +
      body +
      "0068";
    log.debug("--> pack(): " + s);
    const buf = Buffer.from(s, "hex");
    return buf;
  }

  unpack(msg) {
    // 5aa5101011001374000030100020340058030000000000046722166600002bbde7002be4320000264b0009573500001fa50009379000000000
    // 000007e30710160a2d020700000000011664017000005d5a07d00319aa002d0000000000000000000000000000000000c1
    // 5aa510101100137400003010001934005803000000000004672216660000286cac00288a6c00001dc0000957350000188e00093ea717c5024c
    // 016507e30710160a1b020700140101011d59015200005b5807d00319aa03e80000000000000000000000000000000000fc
    // 头 5aa5
    let startFlag = msg.substring(0, 4);
    // 版本 10
    let version = msg.substring(4, 6);
    // 厂家编号 10
    let vender = msg.substring(6, 8);
    // 流水号 1100
    let sn = msg.substring(8, 12);
    // 终端号 2000000000000007
    let device = msg.substring(12, 28);
    // 命令字 1
    let srvCode = parseInt(_.trimStart(msg.substring(28, 30), "0"));
    // 长度 2
    let bodyLength = Buffer.from(msg.substring(30, 34), "hex").readInt16BE();
    // 消息体
    let body = msg.substring(34, 34 + bodyLength * 2);
    // 检验码
    let checksum = msg.substring(34 + bodyLength * 2, 34 + bodyLength * 2 + 2);
    let endFlag = msg.substr(34 + bodyLength * 2 + 2, 2);

    let _schema = schema.getSchema(srvCode);
    // log.info('--> schema: ', _schema)
    let bodyarr = [];
    let startIdx = 0;
    for (let i = 0; i < _schema.records; i++) {
      if (startIdx >= body.length) {
        break;
      }

      let len = _schema.recordLens[i];
      let endIdx = startIdx + len * 2;

      let s = body.substring(startIdx, endIdx);
      log.debug("--> s: ", s, startIdx);

      let value = null;
      if (_.includes(_schema.stringIdx, i)) {
        value = s;
      } else if (s.length <= 8) {
        value = Buffer.from(_.padStart(s, 8, "0"), "hex").readInt32BE();
      }

      bodyarr.push(value);
      startIdx = endIdx;
    }

    body = bodyarr;
    // log.info('--> body array: ', bodyarr)

    return {
      startFlag,
      version,
      vender,
      sn,
      device,
      srvCode,
      bodyLength,
      body,
      checksum,
      endFlag,
    };
  }

  onReady() {
    this.login();
  }

  onData(data) {
    let d = this.unpack(data.toString("hex"));
    log.debug("收到数据：", d);
    switch (d.srvCode) {
      case 4:
        this.onHeartbeat(d);
        break;
      case 2:
        this.onlogin(d);
        break;
      case 31:
        this.onVerifyCard(d);
        break;
      case 37:
        this.onStop(d);
        break;
      case 40:
        this.onOpen(d);
        break;
      case 42:
        this.atClose(d);
        break;
      case 61:
        this.onFinish(d);
        break;
    }
  }

  onTimeout() {
    if (this.logined) {
      this.heartbeat();
    }
  }

  onClose() {
    log.info("close");
    clearInterval(this.loop);
  }

  login() {
    log.info("--> 开始登录...");
    let body = "03020006";
    let s = this.pack(1, body);
    this.channel.write(s);
  }

  onlogin(msg) {
    let result = msg.body[3];
    if (result > 0) {
      log.info("--> 登录成功");
      setTimeout(() => {
        this.verifyCard();
      }, 1000);
    } else {
      log.info("--> 登录失败：", msg);
      setTimeout(() => {
        log.info("--> 尝试重新登录...");
        this.login();
      }, 1000);
    }
  }

  heartbeat() {
    log.debug("--> 发送心跳...");
    let s = this.pack(3, "00");
    this.channel.write(s);
  }

  onHeartbeat(msg) {
    log.debug("--> 心跳成功");
  }

  report() {
    let body = "03 02 0120 00 00000000 01 00 01 00 00003039 00003039".replace(
      /\s/g,
      ""
    );

    let msg = this.pack(5, body);
    this.channel.write(msg);
  }

  verifyCard() {
    log.info("--> 模拟刷卡...");
    this.bill = {
      port: this.pile_port,
      cardNo: this.cardNo,
    };

    let body =
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.bill.cardNo, 16, "0") +
      "00123456";
    let msg = this.pack(30, body);
    this.channel.write(msg);
  }

  onVerifyCard(msg) {
    let balance = msg.body[4];
    let state = msg.body[5];

    this.bill = _.extend(this.bill, {
      balance,
    });

    if (state > 0) {
      log.info(`--> 刷卡成功，卡内余额为：${balance / 100} 元`);
    } else {
      log.info("--> 刷卡失败");
    }
  }

  atClose(msg) {
    log.info("--> 服务端请求关桩，关桩，退出程序");

    let body =
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.bill.cardNo, 16, "0") +
      "ff00";

    let resp = this.pack(43, body);
    this.channel.write(resp);

    _.delay(() => {
      log.info("--> 本次充电结束");
      process.exit();
    }, 200);
  }

  onOpen(msg) {
    log.debug("--> 开桩指令：", msg);
    const today = new Date();
    const year = _.padStart(today.getFullYear().toString(16), 4, "0");
    const month = _.padStart(today.getMonth().toString(16), 2, "0");
    const day = _.padStart(today.getDate().toString(16), 2, "0");
    const hour = _.padStart(today.getHours().toString(16), 2, "0");
    const minute = _.padStart(today.getMinutes().toString(16), 2, "0");
    const second = _.padStart(today.getSeconds().toString(16), 2, "0");

    this.bill = _.extend(this.bill, {
      sn: msg.body[4],
      quantity: 0,
      squantity: 0,
      sYear: year,
      sMonth: month,
      sDay: day,
      sHour: hour,
      sMinute: minute,
      sSecond: second,
    });
    log.debug("--> this.bill: ", this.bill);

    let respBody =
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.cardNo, 16, "0") +
      "00ff00";
    let resp = this.pack(41, respBody);
    this.channel.write(resp);

    log.info("--> 开桩成功，开始模拟充电...");
    _.delay(() => {
      this.loop = setInterval(() => {
        _.delay(() => {
          this.report();
        }, 600);
        this.charging();
      }, 5000);
    }, 2000);
  }

  charging() {
    let offset = _.random(0, 10);
    let q = this.bill.quantity + offset;

    this.bill.quantity = q;
    this.bill.equantity = this.bill.squantity + q;

    let socint = parseInt(((q / 30) * 100).toString());
    socint = socint > 100 ? 100 : socint;
    this.bill.soc = socint;

    let body = (
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.bill.cardNo, 16, "0") +
      "00" +
      _.padStart(this.bill.squantity.toString(16), 8, "0") +
      _.padStart(this.bill.equantity.toString(16), 8, "0") +
      _.padStart(this.bill.quantity.toString(16), 8, "0") +
      "00002710 000003e8 00002328 00000bb8 000003ea 0000012c" +
      this.bill.sYear +
      this.bill.sMonth +
      this.bill.sDay +
      this.bill.sHour +
      this.bill.sMinute +
      this.bill.sSecond +
      "02 1e 00c8 01 01 01 00" +
      _.padStart(this.bill.soc.toString(16), 2, "0") +
      "07e6 07e6 1e 01 00c8 01" +
      "0dae 05e1 6162616261626162616261626162616231"
    ).replace(/\s/g, "");

    log.info(`--> 上报充电信息：已充 ${q / 100} kwh，电池 ${socint}%`);

    let msg = this.pack(34, body);
    this.channel.write(msg);

    if (socint >= 100) {
      clearInterval(this.loop);

      log.info("--> 已充满，请求终止充电");
      this.stop();
    }
  }

  stop() {
    let body =
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.bill.cardNo, 16, "0") +
      "0001000000000000";

    let msg = this.pack(36, body);
    this.channel.write(msg);
  }

  onStop(msg) {
    log.info("--> 服务端确认终止充电");
    this.finish();
  }

  finish() {
    log.debug("--> this.bill: ", this.bill);
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(this.bill.quantity, 0);
    let quan = buf.toString("hex");

    const today = new Date();
    const year = _.padStart(today.getFullYear().toString(16), 4, "0");
    const month = _.padStart(today.getMonth().toString(16), 2, "0");
    const day = _.padStart(today.getDate().toString(16), 2, "0");
    const hour = _.padStart(today.getHours().toString(16), 2, "0");
    const minute = _.padStart(today.getMinutes().toString(16), 2, "0");
    const second = _.padStart(today.getSeconds().toString(16), 2, "0");

    const st = `${this.bill.sYear}${this.bill.sMonth}${this.bill.sDay}${this.bill.sHour}${this.bill.sMinute}${this.bill.sSecond}`;
    const et = `${year}${month}${day}${hour}${minute}${second}`;

    let body = (
      "03" +
      _.padStart(this.bill.port, 2, "0") +
      "00" +
      _.padStart(this.bill.cardNo, 16, "0") +
      this.bill.sn +
      "01" +
      st +
      et +
      "05 0a " +
      _.padStart(this.bill.squantity.toString(16), 8, "0") +
      _.padStart(this.bill.equantity.toString(16), 8, "0") +
      _.padStart(this.bill.quantity.toString(16), 8, "0") +
      "00002710 000003e8 00 00 64 00"
    ).replace(/\s/g, "");
    log.debug("--> 60: ", body);

    log.info(`--> 上报结算信息：已充 ${this.bill.quantity / 100} kwh`);
    let msg = this.pack(60, body);
    this.channel.write(msg);
  }

  onFinish(msg) {
    log.info("--> 服务端已结算，本次充电结束");

    setTimeout(() => {
      process.exit();
    }, 2000);
  }
}
