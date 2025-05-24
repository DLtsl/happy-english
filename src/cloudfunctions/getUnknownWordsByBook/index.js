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
    // 使用聚合查询直接按词库分组统计生疏单词数量
    const aggregateRes = await db.collection('userUnknownWords')
      .aggregate()
      .match({
        userId: OPENID,
        status: 'unknown'
      })
      .group({
        _id: '$bookId',
        unknownCount: $.sum(1)
      })
      .end()

    if (!aggregateRes.list || aggregateRes.list.length === 0) {
      return {
        code: 0,
        message: '没有生疏单词',
        data: {
          books: []
        }
      }
    }

    // 获取所有相关词库的信息
    const bookIds = aggregateRes.list.map(item => item._id)
    const thesaurusRes = await db.collection('thesaurus').where({
      bookId: _.in(bookIds)
    }).get()

    // 合并词库信息和生疏单词数据
    const books = []

    aggregateRes.list.forEach(wordGroup => {
      const bookId = wordGroup._id
      const bookInfo = thesaurusRes.data.find(lib => lib.bookId === bookId)

      if (bookInfo) {
        books.push({
          bookId: bookId,
          unknownCount: wordGroup.unknownCount,
          name: bookInfo.name,
          icon: bookInfo.icon,
          color: bookInfo.color,
          coverImage: bookInfo.coverImage,
          difficulty: bookInfo.difficulty,
          wordCount: bookInfo.wordCount
        })
      } else {
        books.push({
          bookId: bookId,
          unknownCount: wordGroup.unknownCount,
          name: '未知词库',
          icon: '📚',
          color: 'gray'
        })
      }
    })

    // 按生疏单词数量排序（从多到少）
    books.sort((a, b) => b.unknownCount - a.unknownCount)

    return {
      code: 0,
      message: '获取生疏词本成功',
      data: {
        books: books
      }
    }
  } catch (error) {
    console.error('获取生疏词本失败', error)
    return {
      code: 1,
      message: '获取生疏词本失败: ' + error.message,
      data: null
    }
  }
}
