// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { bookId, wordId, wordRank, status } = event
  
  if (!OPENID) {
    return {
      code: 1,
      message: '用户未登录',
      data: null
    }
  }
  
  if (!bookId) {
    return {
      code: 1,
      message: '词库ID不能为空',
      data: null
    }
  }
  
  if (!wordId) {
    return {
      code: 1,
      message: '单词ID不能为空',
      data: null
    }
  }
  
  if (wordRank === undefined || wordRank < 1) {
    return {
      code: 1,
      message: '单词序号不能为空',
      data: null
    }
  }
  
  if (!status) {
    return {
      code: 1,
      message: '状态不能为空',
      data: null
    }
  }
  
  try {
    // 查询是否已存在该单词的记录
    const wordRes = await db.collection('userUnknownWords').where({
      userId: OPENID,
      bookId: bookId,
      wordId: wordId
    }).get()
    
    const now = db.serverDate()
    
    if (wordRes.data.length === 0) {
      // 没有记录，无法更新状态
      return {
        code: 1,
        message: '未找到该单词的记录',
        data: null
      }
    } else {
      // 已有记录，更新状态
      const wordData = wordRes.data[0]
      
      // 更新记录
      await db.collection('userUnknownWords').doc(wordData._id).update({
        data: {
          status: status,
          updateTime: now,
          // 如果状态改为已学习，记录复习时间和次数
          ...(status === 'learned' && {
            lastReviewTime: now,
            reviewCount: (wordData.reviewCount || 0) + 1
          })
        }
      })
      
      return {
        code: 0,
        message: '更新单词状态成功',
        data: {
          ...wordData,
          status: status,
          updateTime: new Date(),
          ...(status === 'learned' && {
            lastReviewTime: new Date(),
            reviewCount: (wordData.reviewCount || 0) + 1
          })
        }
      }
    }
  } catch (error) {
    console.error('更新单词状态失败', error)
    return {
      code: 1,
      message: '更新单词状态失败: ' + error.message,
      data: null
    }
  }
}
