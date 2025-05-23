// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  // 获取请求参数
  const { bookId, wordRank, wordCount } = event;

  console.log("bookId", bookId);
  console.log("wordRank", wordRank, typeof wordRank, wordRank >= 1);
  console.log("wordCount", wordCount);

  if (!bookId) {
    return {
      code: 1,
      message: "词库ID不能为空",
      data: null,
    };
  }

  if (wordRank < 1) {
    return {
      code: 1,
      message: "单词序号不能为空",
      data: null,
    };
  }

  try {
    // 使用前端传递的 wordCount 参数
    const totalWords = wordCount || 0;

    // 如果请求的单词序号超过了总单词数，返回错误
    if (totalWords > 0 && wordRank > totalWords) {
      return {
        code: 1,
        message: "已经是最后一个单词",
        data: {
          word: null,
          isLast: true,
        },
      };
    }

    // 查询指定序号的单词
    const wordRes = await db
      .collection("words")
      .where({
        bookId: bookId,
        wordRank: wordRank,
      })
      .get();

    // 如果找不到指定序号的单词，尝试查找下一个序号
    if (wordRes.data.length === 0) {
      return {
        code: 0,
        message: "当前序号单词不存在，建议尝试下一个序号",
        data: {
          word: null,
          isLast: totalWords > 0 && wordRank >= totalWords,
          nextRank: totalWords > 0 && wordRank >= totalWords ? null : wordRank + 1,
        },
      };
    }

    return {
      code: 0,
      message: "获取成功",
      data: {
        word: wordRes.data[0],
        isLast: totalWords > 0 && wordRank >= totalWords,
      },
    };
  } catch (error) {
    console.error("获取单词失败", error);
    return {
      code: 1,
      message: "获取单词失败: " + error.message,
      data: null,
    };
  }
};
