// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 获取请求参数
  const { bookId, batchSize = 100, continueFromIndex = 0 } = event

  console.log('生成排序索引参数:', { bookId, batchSize, continueFromIndex })

  if (!bookId) {
    return {
      code: 1,
      message: '词库ID不能为空',
      data: null
    }
  }
  
  try {
    // 检查词库的索引生成进度
    const thesaurusRes = await db.collection('thesaurus').where({
      bookId: bookId
    }).get()

    if (thesaurusRes.data.length === 0) {
      return {
        code: 1,
        message: '词库不存在',
        data: null
      }
    }

    const thesaurusRecord = thesaurusRes.data[0]
    console.log('词库记录:', thesaurusRecord)

    // 获取该词库的所有单词，按headWord排序
    console.log('开始获取词库所有单词...')

    // 分批获取所有单词（避免单次查询限制）
    let allWords = []
    let hasMore = true
    let skip = 0
    const maxWords = 20000 // 最大单词限制

    while (hasMore && skip < maxWords) {
      const wordsRes = await db.collection('words')
        .where({ bookId: bookId })
        .orderBy('headWord', 'asc')
        .skip(skip)
        .limit(batchSize)
        .get()

      if (wordsRes.data.length === 0) {
        hasMore = false
      } else {
        allWords = allWords.concat(wordsRes.data)
        skip += batchSize
        console.log(`已获取 ${allWords.length} 个单词...`)
      }
    }

    console.log(`总共获取到 ${allWords.length} 个单词`)

    if (allWords.length === 0) {
      return {
        code: 1,
        message: '该词库没有单词',
        data: null
      }
    }

    // 按字母顺序排序（确保正确排序）
    allWords.sort((a, b) => {
      const wordA = (a.headWord || '').toLowerCase()
      const wordB = (b.headWord || '').toLowerCase()
      return wordA.localeCompare(wordB)
    })

    // 检查是否已经完成索引生成
    if (thesaurusRecord.index === true) {
      return {
        code: 0,
        message: '该词库已经完成索引生成',
        data: {
          bookId: bookId,
          totalWords: allWords.length,
          isCompleted: true
        }
      }
    }

    // 确定实际的开始位置
    let actualStartIndex = continueFromIndex

    // 如果有进度记录且没有指定continueFromIndex，使用记录中的进度
    if (thesaurusRecord.indexProgress && continueFromIndex === 0) {
      actualStartIndex = thesaurusRecord.indexProgress.continueFromIndex || 0
      console.log(`从词库进度记录继续，起始位置: ${actualStartIndex}`)
      console.log(`上次进度: ${thesaurusRecord.indexProgress.processedCount}/${thesaurusRecord.indexProgress.totalWords}`)
    }
    
    console.log('开始生成排序索引...')

    // 使用真正的批量更新，大幅提高性能
    let successCount = actualStartIndex // 从实际开始位置计算已完成数量
    let errorCount = 0
    const batchUpdateSize = 400 // 调整到400个，平衡性能和稳定性

    for (let i = actualStartIndex; i < allWords.length; i += batchUpdateSize) {
      const batchEnd = Math.min(i + batchUpdateSize, allWords.length)
      const batch = allWords.slice(i, batchEnd)
      const batchNumber = Math.floor(i / batchUpdateSize) + 1
      const totalBatches = Math.ceil(allWords.length / batchUpdateSize)

      console.log(`正在处理批次 ${batchNumber}/${totalBatches}: 第 ${i + 1} 到 ${batchEnd} 个单词的索引...`)

      try {
        // 使用 Promise.all 进行高效并发更新
        // 由于每个单词的索引值都不同，无法使用批量更新API，但并发执行仍然很高效
        const updatePromises = batch.map((word, batchIndex) => {
          const globalIndex = i + batchIndex
          const alphabeticalIndex = globalIndex + 1 // 字母顺序索引（从1开始）
          const reverseAlphabeticalIndex = allWords.length - globalIndex // 字母倒序索引

          return db.collection('words').doc(word._id).update({
            data: {
              alphabeticalIndex: alphabeticalIndex,
              reverseAlphabeticalIndex: reverseAlphabeticalIndex
            }
          })
        })

        // 执行并发更新
        await Promise.all(updatePromises)
        successCount += batch.length

        const progressPercent = Math.round((successCount / allWords.length) * 100)
        console.log(`✅ 批次 ${batchNumber} 完成: ${batch.length} 个单词, 总进度: ${successCount}/${allWords.length} (${progressPercent}%)`)

        // 每完成一个批次就更新词库的进度记录
        try {
          await updateThesaurusProgress(db, thesaurusRecord._id, batchEnd, successCount, allWords.length)
        } catch (progressError) {
          console.error('更新词库进度失败:', progressError)
          // 进度记录失败不影响主流程
        }

      } catch (error) {
        console.error(`❌ 批次 ${batchNumber} (${i + 1}-${batchEnd}) 处理失败:`, error)
        errorCount += batch.length

        // 详细的错误信息记录
        const errorInfo = {
          batchNumber: batchNumber,
          batchRange: `${i + 1}-${batchEnd}`,
          errorMessage: error.message,
          errorType: error.name || 'Unknown'
        }
        console.log('错误详情:', JSON.stringify(errorInfo))

        // 如果是超时错误或网络错误，返回断点续传信息
        if (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('TIMEOUT') ||
          error.message.includes('longer than') ||
          error.message.includes('network') ||
          error.code === 'TIMEOUT'
        )) {
          console.log(`⚠️ 检测到超时错误，准备返回断点续传信息...`)
          console.log(`当前进度: 已完成 ${successCount}/${allWords.length} 个单词`)
          console.log(`下次继续位置: 第 ${i} 个单词`)

          return {
            code: 2, // 特殊代码表示需要续传
            message: `处理超时，已完成 ${successCount}/${allWords.length} 个单词，可从第 ${i + 1} 个单词继续`,
            data: {
              bookId: bookId,
              totalWords: allWords.length,
              processedCount: successCount,
              errorCount: errorCount,
              continueFromIndex: i, // 从当前失败的批次开始继续
              lastSuccessfulBatch: batchNumber - 1,
              failedBatch: batchNumber,
              progressPercent: Math.round((successCount / allWords.length) * 100),
              alphabeticalRange: {
                first: allWords[0]?.headWord,
                last: allWords[allWords.length - 1]?.headWord
              }
            }
          }
        }

        // 对于其他错误，继续处理下一批
        console.log(`⚠️ 非超时错误，继续处理下一批...`)
      }
    }
    
    console.log('排序索引生成完成')

    // 返回详细的处理结果
    const isFullyCompleted = successCount === allWords.length
    const hasErrors = errorCount > 0

    // 如果完全完成，标记词库为已索引并清理进度记录
    if (isFullyCompleted) {
      try {
        // 标记词库为已索引并清理进度记录
        await db.collection('thesaurus').doc(thesaurusRecord._id).update({
          data: {
            index: true,
            indexGeneratedTime: db.serverDate(),
            indexedWordCount: successCount,
            indexProgress: db.command.remove() // 清理进度记录
          }
        })
        console.log(`已标记词库 ${bookId} 为已索引并清理进度记录`)
      } catch (error) {
        console.error('标记词库索引状态失败:', error)
        // 不影响主要流程，继续返回结果
      }
    }

    return {
      code: isFullyCompleted ? 0 : (hasErrors ? 1 : 0),
      message: isFullyCompleted
        ? '排序索引生成成功，词库已标记为已索引'
        : `排序索引生成完成，成功 ${successCount}/${allWords.length} 个单词${hasErrors ? `，失败 ${errorCount} 个` : ''}`,
      data: {
        bookId: bookId,
        totalWords: allWords.length,
        processedCount: successCount,
        errorCount: errorCount,
        isFullyCompleted: isFullyCompleted,
        alphabeticalRange: {
          first: allWords[0]?.headWord,
          last: allWords[allWords.length - 1]?.headWord
        }
      }
    }
  } catch (error) {
    console.error('生成排序索引失败', error)
    return {
      code: 1,
      message: '生成排序索引失败: ' + error.message,
      data: null
    }
  }
}

// 辅助函数：更新词库进度记录
async function updateThesaurusProgress(db, thesaurusId, continueFromIndex, processedCount, totalWords) {
  const now = db.serverDate()
  const progressPercent = Math.round((processedCount / totalWords) * 100)

  const progressData = {
    continueFromIndex: continueFromIndex,
    processedCount: processedCount,
    totalWords: totalWords,
    progressPercent: progressPercent,
    lastUpdateTime: now,
    status: processedCount >= totalWords ? 'completed' : 'in_progress'
  }

  // 更新词库记录中的进度信息
  await db.collection('thesaurus').doc(thesaurusId).update({
    data: {
      indexProgress: progressData
    }
  })

  console.log(`词库进度已更新: ${processedCount}/${totalWords} (${progressPercent}%)`)
}
