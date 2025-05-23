// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { bookId, status, limit = 50, skip = 0 } = event
  
  if (!OPENID) {
    return {
      code: 1,
      message: '用户未登录',
      data: null
    }
  }
  
  try {
    let query = db.collection('userUnknownWords').where({
      userId: OPENID
    })
    
    // 如果指定了词库ID，则只查询该词库的单词
    if (bookId) {
      query = query.where({
        bookId: bookId
      })
    }
    
    // 如果指定了状态，则只查询该状态的单词
    if (status) {
      query = query.where({
        status: status
      })
    }
    
    // 获取总数
    const countResult = await query.count()
    
    // 获取单词列表
    const wordsRes = await query
      .orderBy('wordRank', 'asc')
      .skip(skip)
      .limit(limit)
      .get()
    
    return {
      code: 0,
      message: '获取未掌握单词成功',
      data: {
        words: wordsRes.data,
        total: countResult.total
      }
    }
  } catch (error) {
    console.error('获取未掌握单词失败', error)
    return {
      code: 1,
      message: '获取未掌握单词失败: ' + error.message,
      data: null
    }
  }
}
