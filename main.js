const fs = require('fs')
const qs = require("querystring")
const schedule = require('node-schedule')
const inquirer = require('inquirer')
const question = require('./assets/question')
const api = require('./assets/api')
const url = require('./assets/api/url')
let config = {} // config.json配置文件数据 
let isReWrite = checkArgv(process.argv, '-r') // node main.js -r
let times = 0 // 记录请求的次数
let hasTicket = false // 是否有票
let isRequest = false // 是否在查找

// 读取配置文件
fs.readFile('./assets/config.json', async (err, data) => {
  if (err || !data || isReWrite) {
    config = await inquirer.prompt(question)
    fs.writeFileSync('./assets/config.json', JSON.stringify(config))
  } else {
    config = JSON.parse(data)
  }
  console.log(`查询任务：${config.DepartDate} ${config.TimeRange}点 ${config.DepartStation}至${config.ArriveStation}的${config.SeatType}有票车次`)
  ticketSchedule()
})

// 初始化
async function init({ DepartStation, ArriveStation, DepartDate, TimeRange, SeatType }) {
  // 获取火车票数据
  const ticketData = await api.post(url.ticketList, {
    DepartStation,
    ArriveStation,
    DepartDate
  })
  const list = ticketData.ResponseBody.TrainItems
  const timeRangeArr = TimeRange.split('-')
  let desp = `以下为${DepartDate} ${TimeRange}点 ${DepartStation}至${ArriveStation}的${SeatType}有票车次：` // 消息内容
  list.forEach(item => {
    if (item.Bookable) {
      let showTitle = true
      let startTime = +item.StartTime.slice(0, 2)
      // 出发时间是否在区间内
      if (startTime < timeRangeArr[0] || startTime >= timeRangeArr[1]) return
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
    console.log('查找成功')
    // 标题
    const reqData = {
      text: '主人我找到啦，快点进来',
      desp
    }
    const resData = await api.post(url.wxSend, qs.stringify(reqData))
    resData.errno === 0 && console.log('微信通知成功')
  } else {
    console.log('无票')
  }
}

// 定时器
function ticketSchedule() {
  let rule = new schedule.RecurrenceRule() //实例化一个对象
  rule.second = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56] // 每隔5s
  const job = schedule.scheduleJob(rule, () => {
    if (hasTicket) {
      job.cancel()
      console.log('停止定时查询任务成功')
    } else {
      if (isRequest) return
      times++
      isRequest = true
      console.log(`正在进行第${times}次查找...`)
      init(config)
      isRequest = false
    }
  })
}

// 命令参数检查
function checkArgv (argv, command) {
  return argv.slice(2).some(item => item === command)
}