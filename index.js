const axios = require('axios')
const qs = require("querystring")
const fs = require('fs')
const schedule = require('node-schedule')
const inquirer = require('inquirer')
const question = require('./question')
const SCKEY = 'SCU65034T1c2cc6c083aecfa5c3b42f351f8a62f55db2cfb906692'
let config = {}
let isReWrite = checkArgv(process.argv, '-r') // node index.js -r
let times = 0 // 记录请求的次数
let hasTicket = false // 是否有票

// 读取配置文件
fs.readFile('./config.json', async (err, data) => {
  if (err || !data || isReWrite) {
    config = await inquirer.prompt(question)
    console.log('rewrite:', isReWrite)
    fs.writeFileSync('config.json', JSON.stringify(config))
  } else {
    config = JSON.parse(data)
  }
  console.log(`查询任务：${config.DepartDate} ${config.TimeRange}点 ${config.DepartStation}至${config.ArriveStation}的${config.SeatType}有票车次`)
  ticketSchedule()
})

// 初始化
async function init() {
  let { DepartStation, ArriveStation, DepartDate, TimeRange, SeatType } = config
  let list = await getTicketList({
    DepartStation,
    ArriveStation,
    DepartDate
  }) || []
  let timeRange = TimeRange.split('-')
  let desp = `以下为${DepartDate} ${TimeRange}点 ${DepartStation}至${ArriveStation}的${SeatType}有票车次：` // 消息内容
  list.forEach(item => {
    if (item.Bookable) {
      let showTitle = true
      let startTime = +item.StartTime.slice(0, 2)
      // 出发时间是否在区间内
      if (startTime < timeRange[0] || startTime >= timeRange[1]) return
      item.TicketResult.TicketItems.forEach(ticket => {
        if (ticket.Inventory > 0 && (!SeatType || SeatType.includes(ticket.SeatTypeName))) {
          if (showTitle) {
            console.log(`${DepartDate} ${item.StartTime}有票：`)
            desp += `\n\n${DepartDate} ${item.StartTime}：`
          }
          console.log(`${ticket.SeatTypeName}：${ticket.Inventory}`)
          desp += `${ticket.SeatTypeName}：${ticket.Inventory}，`
          hasTicket = true
          showTitle = false
        }
      })
      // 去掉最后的逗号
      desp = desp.slice(0, -1)
    }
  })
  if (hasTicket) {
    // 标题
    let data = {
      text: '主人我找到啦，快点进来',
      desp
    }
    console.log('查找成功')
    sendMsg(SCKEY, qs.stringify(data)).then(res => {
      if (res.data.errno === 0) {
        console.log('微信通知成功')
      }
    })
  } else {
    console.log('无票')
  }
}

// 获取火车票数据
async function getTicketList(data) {
  const res = await axios({
    url: 'https://m.ctrip.com/restapi/soa2/14666/json/GetBookingByStationV3ForPC',
    method: 'post',
    data
  })
  return new Promise(resolve => {
    resolve(res.data.ResponseBody.TrainItems)
  })
}

// 定时器
function ticketSchedule() {
  let rule = new schedule.RecurrenceRule() //实例化一个对象
  rule.second = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56]
  const job = schedule.scheduleJob(rule, () => {
    times++
    if (hasTicket) {
      job.cancel()
      console.log('停止定时查询任务成功')
    } else {
      console.log(`正在进行第${times}次查找...`)
      init()
    }
  })
}

// 发送消息
function sendMsg (SCKEY, data) {
  return axios({
    url: `https://sc.ftqq.com/${SCKEY}.send`,
    method: 'post',
    data
  })
}

// 命令参数检查
function checkArgv (argv, command) {
  return argv.slice(2).some(item => item === command)
}