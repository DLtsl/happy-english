// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  if (!OPENID) {
    return {
      code: 1,
      message: '用户未登录',
      data: null
    }
  }
  
  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      openid: OPENID
    }).get()
    
    if (userRes.data.length === 0) {
      return {
        code: 1,
        message: '用户不存在',
        data: null
      }
    }
    
    // 获取用户所有词库的学习进度
    const progressRes = await db.collection('userLearningProgress').where({
      userId: OPENID
    }).get()
    
    // 获取用户所有未掌握单词
    const unknownRes = await db.collection('userUnknownWords').where({
      userId: OPENID
    }).get()
    
    // 按词库ID分组统计未掌握单词
    const unknownWordsByBook = {}
    unknownRes.data.forEach(item => {
      if (!unknownWordsByBook[item.bookId]) {
        unknownWordsByBook[item.bookId] = 0
      }
      unknownWordsByBook[item.bookId]++
    })
    
    // 整合数据
    const progressByBook = {}
    progressRes.data.forEach(item => {
      progressByBook[item.bookId] = {
        currentWordRank: item.currentWordRank,
        totalStudied: item.totalStudied || item.currentWordRank,
        lastStudyTime: item.lastStudyTime,
        unknownCount: unknownWordsByBook[item.bookId] || 0
      }
    })
    
    return {
      code: 0,
      message: '获取用户词库学习进度成功',
      data: progressByBook
    }
  } catch (error) {
    console.error('获取用户词库学习进度失败', error)
    return {
      code: 1,
      message: '获取用户词库学习进度失败: ' + error.message,
      data: null
    }
  }
}
