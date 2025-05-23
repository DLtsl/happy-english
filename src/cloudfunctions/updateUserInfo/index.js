// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  // 获取要更新的用户信息
  const { userInfo } = event

  if (!userInfo) {
    return {
      code: 1,
      message: '用户信息不能为空',
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

    // 准备更新数据
    const updateData = {
      updateTime: db.serverDate(),
    }

    // 基本用户信息
    if (userInfo.nickName) updateData.nickName = userInfo.nickName
    if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
    if (userInfo.gender !== undefined) updateData.gender = userInfo.gender
    if (userInfo.country) updateData.country = userInfo.country
    if (userInfo.province) updateData.province = userInfo.province
    if (userInfo.city) updateData.city = userInfo.city
    if (userInfo.language) updateData.language = userInfo.language

    // 用户设置
    if (userInfo.dailyGoal !== undefined) updateData.dailyGoal = userInfo.dailyGoal
    if (userInfo.reminderEnabled !== undefined) updateData.reminderEnabled = userInfo.reminderEnabled
    if (userInfo.darkModeEnabled !== undefined) updateData.darkModeEnabled = userInfo.darkModeEnabled
    if (userInfo.soundEnabled !== undefined) updateData.soundEnabled = userInfo.soundEnabled

    // 更新用户信息
    await db.collection('users').doc(userData._id).update({
      data: updateData
    })

    // 获取更新后的用户信息
    const updatedUser = await db.collection('users').doc(userData._id).get()

    return {
      code: 0,
      message: '更新成功',
      data: updatedUser.data
    }
  } catch (error) {
    console.error('更新用户信息失败', error)
    return {
      code: 1,
      message: '更新用户信息失败: ' + error.message,
      data: null
    }
  }
}
