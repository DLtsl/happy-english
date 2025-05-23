// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { bookId, wordId, wordRank } = event
  
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
  
  try {
    // 查询是否已存在该单词的记录
    const wordRes = await db.collection('userUnknownWords').where({
      userId: OPENID,
      bookId: bookId,
      wordId: wordId
    }).get()
    
    const now = db.serverDate()
    
    if (wordRes.data.length === 0) {
      // 没有记录，创建新记录
      const newWord = {
        userId: OPENID,
        bookId: bookId,
        wordId: wordId,
        wordRank: wordRank,
        status: 'unknown',
        reviewCount: 0,
        lastReviewTime: null,
        createTime: now,
        updateTime: now
      }
      
      const addResult = await db.collection('userUnknownWords').add({
        data: newWord
      })
      
      return {
        code: 0,
        message: '保存未掌握单词成功',
        data: {
          ...newWord,
          _id: addResult._id
        }
      }
    } else {
      // 已有记录，更新状态
      const wordData = wordRes.data[0]
      
      await db.collection('userUnknownWords').doc(wordData._id).update({
        data: {
          status: 'unknown',
          updateTime: now
        }
      })
      
      return {
        code: 0,
        message: '更新未掌握单词状态成功',
        data: {
          ...wordData,
          status: 'unknown',
          updateTime: new Date()
        }
      }
    }
  } catch (error) {
    console.error('保存未掌握单词失败', error)
    return {
      code: 1,
      message: '保存未掌握单词失败: ' + error.message,
      data: null
    }
  }
}
