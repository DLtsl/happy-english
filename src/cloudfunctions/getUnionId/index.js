// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID, UNIONID, APPID } = wxContext

  // 获取用户信息参数和登录凭证
  const { userInfo, code } = event

  console.log('获取到的用户信息:', userInfo || '无用户信息')
  console.log('获取到的登录凭证:', code || '无登录凭证')
  console.log('微信上下文:', wxContext)

  // 查询用户是否已存在
  const res = await db.collection('users').where({
    openid: OPENID
  }).get()

  let userData = null

  if(res.data.length === 0) {
    // 用户不存在，创建新用户
    const userDefault = {
      openid: OPENID,
      unionid: UNIONID,
      appid: APPID,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      // 默认用户信息
      nickName: userInfo?.nickName || '英语学习者',
      avatarUrl: userInfo?.avatarUrl || '',
      gender: userInfo?.gender || 0,
      country: userInfo?.country || '',
      province: userInfo?.province || '',
      city: userInfo?.city || '',
      language: userInfo?.language || 'zh_CN',
      // 学习数据
      learnedWords: 0,
      masteredWords: 0,
      streak: 0, // 连续学习天数
      lastLearnDate: null,
      totalLearnTime: 0, // 总学习时间（分钟）
      // 用户设置
      dailyGoal: 50, // 每日学习目标
      reminderEnabled: true, // 学习提醒
      darkModeEnabled: false, // 深色模式
      soundEnabled: true, // 声音效果
    }

    // 添加用户到数据库
    const addResult = await db.collection('users').add({
      data: userDefault
    })

    userDefault._id = addResult._id
    userData = userDefault
  } else {
    // 用户已存在
    userData = res.data[0]

    // 如果有新的用户信息，更新用户资料
    if (userInfo) {
      // 准备更新数据
      const updateData = {
        updateTime: db.serverDate(),
      }

      // 只更新有值的字段
      if (userInfo.nickName) updateData.nickName = userInfo.nickName
      if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
      if (userInfo.gender !== undefined) updateData.gender = userInfo.gender
      if (userInfo.country) updateData.country = userInfo.country
      if (userInfo.province) updateData.province = userInfo.province
      if (userInfo.city) updateData.city = userInfo.city
      if (userInfo.language) updateData.language = userInfo.language

      // 更新数据库
      await db.collection('users').doc(userData._id).update({
        data: updateData
      })

      // 更新本地数据
      userData = {
        ...userData,
        ...updateData,
        updateTime: new Date() // 转换为JS日期对象以便前端使用
      }
    }
  }

  // 检查用户是否有连续学习记录
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 设置为今天的开始时间

  const lastLearnDate = userData.lastLearnDate ? new Date(userData.lastLearnDate) : null

  // 如果最后学习日期不是今天，更新登录记录
  if (!lastLearnDate || lastLearnDate.getTime() !== today.getTime()) {
    console.log('更新用户登录记录')

    // 检查是否是连续登录
    let newStreak = userData.streak || 0

    if (lastLearnDate) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // 如果最后学习日期是昨天，增加连续天数
      if (lastLearnDate.getTime() === yesterday.getTime()) {
        newStreak += 1
      } else {
        // 不是连续登录，重置连续天数
        newStreak = 1
      }
    } else {
      // 第一次登录
      newStreak = 1
    }

    // 更新数据库
    await db.collection('users').doc(userData._id).update({
      data: {
        lastLearnDate: db.serverDate(),
        streak: newStreak
      }
    })

    // 更新本地数据
    userData.lastLearnDate = new Date()
    userData.streak = newStreak
  }

  return {
    code: 0,
    message: '获取成功',
    data: userData
  }
}