const SCKEY = 'SCU65034T1c2cc6c083aecfa5c3b42f351f8a62f55db2cfb906692'
const url = {
  // 火车票数据
  ticketList: 'https://m.ctrip.com/restapi/soa2/14666/json/GetBookingByStationV3ForPC',
  // 微信通知推送
  wxSend: `https://sc.ftqq.com/${SCKEY}.send`
}

module.exports = url