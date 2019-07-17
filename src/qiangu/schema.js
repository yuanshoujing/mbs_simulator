const schema = {
  // 注册
  1: { // 桩发送
    record_lens: [1, 1, 2],
    stringIdx: null
  },
  2: { // 服务器返回
    record_lens: [1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    stringIdx: null
  },

  // 心跳
  3: { // 桩发送
    record_lens: [1],
    stringIdx: null
  },
  4: { // 服务器返回
    record_lens: [1],
    stringIdx: null
  },

  // 上报状态
  5: { // 桩发送
    record_lens: [1, 1, 2, 1, 4, 1, 1, 1, 1, 4, 4],
    stringIdx: null
  },
  6: { // 服务器返回
    record_lens: [1],
    stringIdx: null
  },

  // 查询状态
  7: { // 服务器发送
    record_lens: [1],
    stringIdx: null
  },

  // 刷卡充电
  30: { // 桩发送
    record_lens: [1, 1, 1, 8, 4],
    stringIdx: [3, 4],
    channelIdx: 1
  },
  31: { // 服务器返回
    record_lens: [1, 1, 1, 8, 4, 1, 1],
    stringIdx: [3],
    channelIdx: 1
  },

  // 充电
  40: { // 服务器发送
    record_lens: [1, 1, 1, 8, 15, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1,
      1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2],
    stringIdx: [3, 4],
    channelIdx: 1
  },
  41: { // 桩返回
    record_lens: [1, 1, 1, 8, 1, 1, 1],
    stringIdx: [3],
    channelIdx: 1
  },

  // 实时数据
  34: { // 桩发送
    record_lens: [1, 1, 1, 8, 1, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1,
      1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 1, 1, 2, 1],
    stringIdx: [3],
    channelIdx: 1
  },
  35: { // 服务器返回
    record_lens: [1, 1, 1, 8, 4],
    stringIdx: [3],
    channelIdx: 1
  },

  // 查询数据
  50: { // 服务器发送
    record_lens: [1],
    stringIdx: null
  },

  // 停止充电
  36: { // 桩发送
    record_lens: [1, 1, 1, 8, 1, 1, 4, 2],
    stringIdx: [3],
    channelIdx: 1
  },
  37: { // 服务器返回
    record_lens: [1, 1, 1, 8, 1],
    stringIdx: [3, 4],
    channelIdx: 1
  },

  // 主动停止充电
  42: { // 服务器发送
    record_lens: [1, 1, 1, 8, 1, 1, 1],
    stringIdx: [3],
    channelIdx: 1
  },
  43: { // 桩返回
    record_lens: [1, 1, 1, 8, 1, 1],
    stringIdx: [3],
    channelIdx: 1
  },

  // 上传账单
  60: { // 桩发送
    record_lens: [1, 1, 1, 8, 15, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1,
      1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1],
    stringIdx: [3, 4],
    channelIdx: 1
  },
  61: { // 服务器返回
    record_lens: [1, 1, 1, 8, 15, 1],
    stringIdx: [3, 4],
    channelIdx: 1
  }
}

export default {
  getSchema (srvCode) {
    let s = schema[srvCode]
    return {
      srvCode: srvCode,
      recordLens: s.record_lens,
      records: s.record_lens.length,
      stringIdx: s.stringIdx,
      channelIdx: s.channelIdx || -1
    }
  }
}
