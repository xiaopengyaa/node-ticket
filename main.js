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
  console.log(`查询任务：${config.DepartDate} ${config.TrainName} ${config.DepartStation}至${config.ArriveStation}的${config.SeatType}有票车次`)
  ticketSchedule()
})

// 初始化
async function init({ DepartStation, ArriveStation, DepartDate, TrainName, SeatType, SCKEY }) {
  // 获取火车票数据
  const ticketData = await api.post(url.ticketList, {
    DepartStation,
    ArriveStation,
    DepartDate
  })
  const list = ticketData.ResponseBody.TrainItems || []
  let desp = `以下为${DepartDate} ${TrainName} ${DepartStation}至${ArriveStation}的${SeatType}有票车次：` // 消息内容
  list.forEach(item => {
    // 车次信息判断
    if (!TrainName.toLowerCase().includes(item.TrainName.toLowerCase())) return
    // 是否可预订
    if (item.Bookable) {
      let showTitle = true
      item.TicketResult.TicketItems.forEach(ticket => {
        // 余票及座位类型判断
        if (ticket.Inventory > 0 && (!SeatType || SeatType.includes(ticket.SeatTypeName))) {
          if (showTitle) {
            console.log(`${DepartDate} ${item.StartTime} ${item.TrainName}有票：`)
            desp += `\n\n${DepartDate} ${item.StartTime} ${item.TrainName}：`
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
    // 微信通知推送
    const wxUrl = `https://sc.ftqq.com/${SCKEY}.send`
    const reqData = {
      text: '主人我找到啦，快点进来',
      desp
    }
    const resData = await api.post(wxUrl, qs.stringify(reqData))
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