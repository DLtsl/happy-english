// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  // 获取请求参数
  const { bookId, sortType } = event
  
  console.log('获取排序学习进度参数:', { bookId, sortType, OPENID })
  
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
  
  if (!sortType) {
    return {
      code: 1,
      message: '排序类型不能为空',
      data: null
    }
  }
  
  try {
    // 查询用户的排序学习进度
    const progressRes = await db.collection('userSortLearningProgress').where({
      userId: OPENID,
      bookId: bookId,
      sortType: sortType
    }).get()
    
    if (progressRes.data.length === 0) {
      // 没有进度记录，返回初始状态
      return {
        code: 0,
        message: '没有找到学习进度',
        data: {
          hasProgress: false,
          currentSortIndex: 0,
          totalStudied: 0,
          lastStudyTime: null
        }
      }
    } else {
      // 有进度记录，返回进度信息
      const progress = progressRes.data[0]
      
      return {
        code: 0,
        message: '获取学习进度成功',
        data: {
          hasProgress: true,
          currentSortIndex: progress.currentSortIndex || 0,
          totalStudied: progress.totalStudied || 0,
          lastStudyTime: progress.lastStudyTime,
          createTime: progress.createTime,
          updateTime: progress.updateTime
        }
      }
    }
  } catch (error) {
    console.error('获取排序学习进度失败', error)
    return {
      code: 1,
      message: '获取排序学习进度失败: ' + error.message,
      data: null
    }
  }
}
