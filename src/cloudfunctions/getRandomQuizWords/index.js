// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { count = 50 } = event
  
  if (!OPENID) {
    return {
      code: 1,
      message: '用户未登录',
      data: null
    }
  }
  
  // 验证题数
  if (count < 10) {
    return {
      code: 1,
      message: '最少需要10题',
      data: null
    }
  }
  
  if (count > 200) {
    return {
      code: 1,
      message: '最多只能选择200题',
      data: null
    }
  }
  
  try {
    // 获取用户所有状态为 'unknown' 的生疏单词
    const unknownWordsRes = await db.collection('userUnknownWords')
      .where({
        userId: OPENID,
        status: 'unknown'
      })
      .get()
    
    if (!unknownWordsRes.data || unknownWordsRes.data.length === 0) {
      return {
        code: 1,
        message: '没有可用的错题',
        data: null
      }
    }
    
    const allUnknownWords = unknownWordsRes.data
    
    // 检查是否有足够的错题
    if (allUnknownWords.length < count) {
      return {
        code: 1,
        message: `错题数量不足，当前只有${allUnknownWords.length}个错题`,
        data: null
      }
    }
    
    // 随机选择指定数量的错题
    const shuffled = allUnknownWords.sort(() => 0.5 - Math.random())
    const selectedWords = shuffled.slice(0, count)
    
    // 按词库分组，方便后续处理
    const wordsByBook = {}
    selectedWords.forEach(word => {
      if (!wordsByBook[word.bookId]) {
        wordsByBook[word.bookId] = []
      }
      wordsByBook[word.bookId].push(word)
    })
    
    // 获取所有相关词库的信息
    const bookIds = Object.keys(wordsByBook)
    const booksRes = await db.collection('thesaurus').where({
      bookId: db.command.in(bookIds)
    }).get()
    
    // 构建返回数据
    const quizData = {
      totalCount: selectedWords.length,
      words: selectedWords.map((word, index) => ({
        ...word,
        quizIndex: index // 添加测验索引
      })),
      bookInfo: {}
    }
    
    // 添加词库信息
    booksRes.data.forEach(book => {
      quizData.bookInfo[book.bookId] = {
        name: book.name,
        icon: book.icon,
        color: book.color,
        coverImage: book.coverImage
      }
    })
    
    return {
      code: 0,
      message: '获取随机测验单词成功',
      data: quizData
    }
  } catch (error) {
    console.error('获取随机测验单词失败', error)
    return {
      code: 1,
      message: '获取随机测验单词失败: ' + error.message,
      data: null
    }
  }
}
