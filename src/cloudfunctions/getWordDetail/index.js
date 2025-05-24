// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { bookId, wordRank } = event
  
  // 参数验证
  if (!bookId || !wordRank) {
    return {
      code: 1,
      message: '缺少必要参数：bookId 和 wordRank',
      data: null
    }
  }

  try {
    // 查询指定序号的单词
    const wordRes = await db
      .collection("words")
      .where({
        bookId: bookId,
        wordRank: wordRank,
      })
      .get();

    if (wordRes.data.length === 0) {
      return {
        code: 1,
        message: `未找到词库 ${bookId} 中序号为 ${wordRank} 的单词`,
        data: {
          word: null,
          bookId: bookId,
          wordRank: wordRank
        }
      };
    }

    // 获取单词数据
    const wordData = wordRes.data[0];

    // 构建返回的单词对象
    const word = {
      wordRank: wordRank,
      headWord: wordData.headWord,
      content: wordData.content
    };

    return {
      code: 0,
      message: '获取单词详情成功',
      data: {
        word: word,
        bookId: bookId,
        wordRank: wordRank
      }
    };
  } catch (error) {
    console.error("获取单词详情失败", error);
    return {
      code: 1,
      message: '获取单词详情失败: ' + error.message,
      data: null
    };
  }
}
