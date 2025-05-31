// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { bookId, sortType = 'default', currentIndex = 0, saveProgress = true } = event
  
  console.log('获取排序单词参数:', { bookId, sortType, currentIndex, OPENID })
  
  if (!bookId) {
    return {
      code: 1,
      message: '词库ID不能为空',
      data: null
    }
  }
  
  try {
    // 检查用户是否登录
    const isLoggedIn = !!OPENID
    let userProgress = null
    
    // 根据排序类型确定查询条件
    let sortField, sortOrder
    let targetSortIndex

    switch (sortType) {
      case 'alphabetical':
        // 按字母顺序 A-Z，使用预生成的字母索引
        sortField = 'alphabeticalIndex'
        sortOrder = 'asc'
        targetSortIndex = currentIndex + 1 // 索引从1开始
        break
      case 'reverse':
        // 按字母倒序 Z-A，使用预生成的倒序索引
        sortField = 'reverseAlphabeticalIndex'
        sortOrder = 'asc'
        targetSortIndex = currentIndex + 1 // 索引从1开始
        break
      case 'default':
      default:
        // 默认按 wordRank 排序
        sortField = 'wordRank'
        sortOrder = 'asc'
        targetSortIndex = currentIndex + 1 // wordRank从1开始
        break
    }

    // 先获取总单词数
    const countRes = await db.collection('words').where({ bookId: bookId }).count()
    const totalWords = countRes.total

    if (totalWords === 0) {
      return {
        code: 1,
        message: '该词库没有单词',
        data: null
      }
    }

    // 检查索引是否有效
    if (currentIndex < 0 || currentIndex >= totalWords) {
      return {
        code: 1,
        message: currentIndex >= totalWords ? '已经是最后一个单词' : '索引无效',
        data: {
          word: null,
          isLast: currentIndex >= totalWords,
          totalWords: totalWords,
          currentIndex: currentIndex
        }
      }
    }

    // 查询指定排序索引的单词
    const wordQuery = db.collection('words').where({
      bookId: bookId,
      [sortField]: targetSortIndex
    })

    const wordRes = await wordQuery.get()

    if (!wordRes.data || wordRes.data.length === 0) {
      // 如果找不到指定索引的单词，可能是索引还没生成
      if (sortType !== 'default') {
        return {
          code: 1,
          message: `排序索引不存在，请先生成排序索引。词库ID: ${bookId}, 排序类型: ${sortType}, 目标索引: ${targetSortIndex}`,
          data: null
        }
      } else {
        // 默认模式下，尝试查找下一个可用的wordRank
        return {
          code: 1,
          message: '当前序号单词不存在',
          data: {
            word: null,
            isLast: currentIndex >= totalWords - 1,
            totalWords: totalWords,
            currentIndex: currentIndex
          }
        }
      }
    }

    // 获取当前单词
    const currentWord = wordRes.data[0]
    
    // 如果用户已登录且需要保存进度，更新排序学习进度（使用独立的表）
    if (isLoggedIn && saveProgress) {
      try {
        // 查询用户是否已有该词库的排序学习进度记录
        const progressRes = await db.collection('userSortLearningProgress').where({
          userId: OPENID,
          bookId: bookId,
          sortType: sortType
        }).get()

        const now = db.serverDate()

        // 计算当前学习的单词数（索引+1）
        const studiedCount = currentIndex + 1

        if (progressRes.data.length === 0) {
          // 没有记录，创建新记录
          const newProgress = {
            userId: OPENID,
            bookId: bookId,
            sortType: sortType, // 保存排序类型
            currentSortIndex: currentIndex, // 保存在排序后的索引
            currentWordRank: currentWord.wordRank, // 保存实际的wordRank（仅供参考）
            lastStudyTime: now,
            totalStudied: studiedCount,
            createTime: now,
            updateTime: now
          }

          await db.collection('userSortLearningProgress').add({
            data: newProgress
          })

          console.log('创建新的排序学习进度记录:', newProgress)
          userProgress = newProgress
        } else {
          // 已有记录，更新记录
          const progressData = progressRes.data[0]

          // 更新进度
          await db.collection('userSortLearningProgress').doc(progressData._id).update({
            data: {
              currentSortIndex: currentIndex,
              currentWordRank: currentWord.wordRank,
              lastStudyTime: now,
              totalStudied: Math.max(progressData.totalStudied || 0, studiedCount),
              updateTime: now
            }
          })

          console.log('更新排序学习进度记录:', {
            currentSortIndex: currentIndex,
            currentWordRank: currentWord.wordRank,
            totalStudied: Math.max(progressData.totalStudied || 0, studiedCount),
            sortType: sortType
          })

          userProgress = {
            ...progressData,
            currentSortIndex: currentIndex,
            currentWordRank: currentWord.wordRank,
            lastStudyTime: now,
            totalStudied: Math.max(progressData.totalStudied || 0, studiedCount),
            updateTime: now
          }
        }
      } catch (error) {
        console.error('保存排序学习进度失败', error)
      }
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        word: currentWord,
        isLast: currentIndex >= totalWords - 1,
        totalWords: totalWords,
        currentIndex: currentIndex,
        sortType: sortType,
        userProgress: userProgress
      }
    }
  } catch (error) {
    console.error('获取排序单词失败', error)
    return {
      code: 1,
      message: '获取排序单词失败: ' + error.message,
      data: null
    }
  }
}
