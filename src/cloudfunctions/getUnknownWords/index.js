// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  // 获取请求参数
  const { bookId, status = 'unknown' } = event

  if (!OPENID) {
    return {
      code: 1,
      message: '用户未登录',
      data: null
    }
  }

  // 必须指定词库ID
  if (!bookId) {
    return {
      code: 1,
      message: '必须指定词库ID',
      data: null
    }
  }

  try {
    // 构建查询条件
    const whereCondition = {
      userId: OPENID,
      bookId: bookId,
      status: status
    }

    // 获取该词库的所有生疏单词，按wordRank排序
    const wordsRes = await db.collection('userUnknownWords')
      .where(whereCondition)
      .orderBy('wordRank', 'asc')
      .get()

    return {
      code: 0,
      message: '获取生疏单词列表成功',
      data: {
        words: wordsRes.data,
        total: wordsRes.data.length,
        bookId: bookId
      }
    }
  } catch (error) {
    console.error('获取生疏单词列表失败', error)
    return {
      code: 1,
      message: '获取生疏单词列表失败: ' + error.message,
      data: null
    }
  }
}
