// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

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
    
    const userData = userRes.data[0]
    
    // 获取用户所有词库的学习进度
    const progressRes = await db.collection('userLearningProgress').where({
      userId: OPENID
    }).get()
    
    // 获取用户所有未掌握单词
    const unknownRes = await db.collection('userUnknownWords').where({
      userId: OPENID
    }).get()
    
    // 计算总体统计数据
    let totalLearned = 0
    let totalMastered = 0
    let totalAccuracy = 0
    let lastStudyTime = null
    
    // 按词库ID分组统计未掌握单词
    const unknownWordsByBook = {}
    unknownRes.data.forEach(item => {
      if (!unknownWordsByBook[item.bookId]) {
        unknownWordsByBook[item.bookId] = 0
      }
      unknownWordsByBook[item.bookId]++
    })
    
    // 计算每个词库的学习进度和总体统计
    progressRes.data.forEach(item => {
      const totalStudied = item.totalStudied || item.currentWordRank || 0
      const unknownCount = unknownWordsByBook[item.bookId] || 0
      const masteredCount = totalStudied - unknownCount
      
      totalLearned += totalStudied
      totalMastered += masteredCount
      
      // 更新最近学习时间
      if (item.lastStudyTime && (!lastStudyTime || new Date(item.lastStudyTime) > new Date(lastStudyTime))) {
        lastStudyTime = item.lastStudyTime
      }
    })
    
    // 计算总体正确率
    if (totalLearned > 0) {
      totalAccuracy = Math.round((totalMastered / totalLearned) * 100)
    } else {
      totalAccuracy = 0
    }
    
    // 计算昨日学习单词数
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 获取昨日学习的单词数量
    const yesterdayProgressRes = await db.collection('userLearningProgress')
      .where({
        userId: OPENID,
        lastStudyTime: _.gte(yesterday).and(_.lt(today))
      })
      .get()
    
    let yesterdayWords = 0
    yesterdayProgressRes.data.forEach(item => {
      yesterdayWords += item.totalStudied || 0
    })
    
    // 计算本周学习数据
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // 设置为本周日
    weekStart.setHours(0, 0, 0, 0)
    
    // 获取本周学习的单词数量
    const weeklyProgressRes = await db.collection('userLearningProgress')
      .where({
        userId: OPENID,
        lastStudyTime: _.gte(weekStart)
      })
      .get()
    
    let weeklyNewWords = 0
    let weeklyAccuracy = 0
    let weeklyTotalLearned = 0
    let weeklyTotalMastered = 0
    
    weeklyProgressRes.data.forEach(item => {
      const totalStudied = item.totalStudied || 0
      const unknownCount = unknownWordsByBook[item.bookId] || 0
      const masteredCount = totalStudied - unknownCount
      
      weeklyNewWords += totalStudied
      weeklyTotalLearned += totalStudied
      weeklyTotalMastered += masteredCount
    })
    
    // 计算本周正确率
    if (weeklyTotalLearned > 0) {
      weeklyAccuracy = Math.round((weeklyTotalMastered / weeklyTotalLearned) * 100)
    } else {
      weeklyAccuracy = 0
    }
    
    // 计算今日学习进度
    const dailyGoal = userData.dailyGoal || 50
    const todayProgressRes = await db.collection('userLearningProgress')
      .where({
        userId: OPENID,
        lastStudyTime: _.gte(today)
      })
      .get()
    
    let todayWords = 0
    todayProgressRes.data.forEach(item => {
      todayWords += item.totalStudied || 0
    })
    
    const dailyProgress = Math.min(Math.round((todayWords / dailyGoal) * 100), 100)
    
    // 组装返回数据
    const statistics = {
      // 顶部统计卡片
      totalMastered,
      streak: userData.streak || 0,
      totalAccuracy,
      
      // 今日学习进度
      dailyProgress,
      dailyGoal,
      
      // 最近学习数据
      yesterdayWords,
      weeklyHours: userData.totalLearnTime ? (userData.totalLearnTime / 60).toFixed(1) : 0,
      weeklyAccuracy,
      weeklyNewWords
    }
    
    return {
      code: 0,
      message: '获取用户统计数据成功',
      data: statistics
    }
  } catch (error) {
    console.error('获取用户统计数据失败', error)
    return {
      code: 1,
      message: '获取用户统计数据失败: ' + error.message,
      data: null
    }
  }
}
