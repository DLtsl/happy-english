// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;

  // 获取请求参数
  const { bookId, wordRank: requestedWordRank, wordCount, saveProgress = true } = event;
  let wordRank = requestedWordRank;

  console.log("bookId", bookId);
  console.log("requestedWordRank", requestedWordRank, typeof requestedWordRank);
  console.log("wordCount", wordCount);
  console.log("OPENID", OPENID);

  if (!bookId) {
    return {
      code: 1,
      message: "词库ID不能为空",
      data: null,
    };
  }

  try {
    // 使用前端传递的 wordCount 参数
    const totalWords = wordCount || 0;
    let userProgress = null;

    // 检查用户是否登录（通过OPENID判断）
    const isLoggedIn = !!OPENID;
    console.log("用户登录状态:", isLoggedIn ? "已登录" : "未登录");

    // 如果用户已登录且没有指定wordRank或wordRank为1，尝试获取用户进度
    if (isLoggedIn && (!requestedWordRank || requestedWordRank === 1)) {
      try {
        // 查询用户是否存在
        const userRes = await db.collection('users').where({
          openid: OPENID
        }).get();

        if (userRes.data.length > 0) {
          // 用户存在，查询学习进度
          const progressRes = await db.collection('userLearningProgress').where({
            userId: OPENID,
            bookId: bookId
          }).get();

          if (progressRes.data.length > 0) {
            // 找到学习进度，使用保存的进度
            userProgress = progressRes.data[0];
            wordRank = userProgress.currentWordRank;
            console.log("找到用户进度，使用进度中的单词序号:", wordRank);
          } else {
            // 没有找到学习进度，使用默认值1
            wordRank = 1;
            console.log("未找到用户进度，使用默认单词序号:", wordRank);
          }
        } else {
          // 用户不存在，使用默认值1
          wordRank = 1;
          console.log("用户不存在，使用默认单词序号:", wordRank);
        }
      } catch (error) {
        console.error("获取用户进度失败", error);
        // 出错时使用请求中的wordRank或默认值1
        wordRank = requestedWordRank || 1;
      }
    } else {
      // 使用请求中指定的wordRank
      wordRank = requestedWordRank || 1;
    }

    // 确保wordRank至少为1
    if (wordRank < 1) {
      wordRank = 1;
    }

    // 如果请求的单词序号超过了总单词数，返回错误
    if (totalWords > 0 && wordRank > totalWords) {
      return {
        code: 1,
        message: "已经是最后一个单词",
        data: {
          word: null,
          isLast: true,
          userProgress: userProgress
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
          userProgress: userProgress
        },
      };
    }

    // 如果用户已登录且需要保存进度，更新学习进度
    if (isLoggedIn && saveProgress) {
      try {
        // 查询用户是否已有该词库的学习进度记录
        const progressRes = await db.collection('userLearningProgress').where({
          userId: OPENID,
          bookId: bookId
        }).get();

        const now = db.serverDate();

        if (progressRes.data.length === 0) {
          // 没有记录，创建新记录
          const newProgress = {
            userId: OPENID,
            bookId: bookId,
            currentWordRank: wordRank,
            lastStudyTime: now,
            totalStudied: wordRank,
            createTime: now,
            updateTime: now
          };

          await db.collection('userLearningProgress').add({
            data: newProgress
          });

          console.log("创建新的学习进度记录:", newProgress);
          userProgress = newProgress;
        } else {
          // 已有记录，更新记录
          const progressData = progressRes.data[0];

          // 只有当新的进度大于已有进度时才更新
          if (wordRank > progressData.currentWordRank) {
            await db.collection('userLearningProgress').doc(progressData._id).update({
              data: {
                currentWordRank: wordRank,
                lastStudyTime: now,
                totalStudied: Math.max(progressData.totalStudied || 0, wordRank),
                updateTime: now
              }
            });

            console.log("更新学习进度记录:", {
              currentWordRank: wordRank,
              totalStudied: Math.max(progressData.totalStudied || 0, wordRank)
            });

            userProgress = {
              ...progressData,
              currentWordRank: wordRank,
              lastStudyTime: now,
              totalStudied: Math.max(progressData.totalStudied || 0, wordRank),
              updateTime: now
            };
          } else {
            // 新进度不大于已有进度，只更新学习时间
            await db.collection('userLearningProgress').doc(progressData._id).update({
              data: {
                lastStudyTime: now,
                updateTime: now
              }
            });

            console.log("更新学习时间");
            userProgress = progressData;
          }
        }
      } catch (error) {
        console.error("保存学习进度失败", error);
      }
    }

    return {
      code: 0,
      message: "获取成功",
      data: {
        word: wordRes.data[0],
        isLast: totalWords > 0 && wordRank >= totalWords,
        userProgress: userProgress
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
