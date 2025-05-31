// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  console.log('获取未生成索引的词库列表')
  
  try {
    // 直接查询没有 index: true 的词库
    const unindexedBooksRes = await db.collection('thesaurus').where(
      db.command.or([
        { index: db.command.neq(true) },  // index 不等于 true
        { index: db.command.exists(false) }  // 没有 index 字段
      ])
    ).get()

    if (!unindexedBooksRes.data || unindexedBooksRes.data.length === 0) {
      return {
        code: 0,
        message: '所有词库都已生成索引',
        data: []
      }
    }

    console.log(`找到 ${unindexedBooksRes.data.length} 个未生成索引的词库`)

    // 按进度状态排序：有进度的在前，然后按单词数量排序
    const sortedBooks = unindexedBooksRes.data.sort((a, b) => {
      // 有进度的优先
      const aHasProgress = a.indexProgress && a.indexProgress.processedCount > 0
      const bHasProgress = b.indexProgress && b.indexProgress.processedCount > 0

      if (aHasProgress && !bHasProgress) return -1
      if (!aHasProgress && bHasProgress) return 1

      // 都有进度或都没有，按单词数量排序（多的在前）
      return (b.wordCount || 0) - (a.wordCount || 0)
    })

    return {
      code: 0,
      message: `找到 ${sortedBooks.length} 个需要生成索引的词库`,
      data: sortedBooks
    }
  } catch (error) {
    console.error('获取未索引词库列表失败', error)
    return {
      code: 1,
      message: '获取未索引词库列表失败: ' + error.message,
      data: []
    }
  }
}
