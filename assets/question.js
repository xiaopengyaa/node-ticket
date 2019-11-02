const question = [
  {
    type: 'input',
    name: 'DepartStation',
    message: '请输入出发地点（如：广州南）',
    validate (val) {
      return !!val || '出发地点不能为空'
    }
  },
  {
    type: 'input',
    name: 'ArriveStation',
    message: '请输入目的地点（如：江门东）',
    validate (val) {
      return !!val || '目的地点不能为空'
    }
  },
  {
    type: 'input',
    name: 'DepartDate',
    message: '请输入出发日期（如：2020-01-01）',
    validate (val) {
      const reg = /^\d{4}-\d{1,2}-\d{1,2}$/
      return reg.test(val) || '出发日期格式不对'
    }
  },
  {
    type: 'input',
    name: 'TimeRange',
    message: '请输入车次时间段（如：0-24或者9-12）',
    default: '0-24',
    validate (val) {
      const reg = /^\d{1,2}-\d{1,2}$/
      return reg.test(val) || '车次时间段格式不对'
    }
  },
  {
    type: 'input',
    name: 'SeatType',
    message: '请输入座位类型（如：二等座或者一等座|二等座，多类型以“|”分隔）'
  },
]

module.exports = question