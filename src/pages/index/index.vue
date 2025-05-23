<template>
  <view class="container">
    <!-- 加载中提示 -->
    <view class="loading-container" v-if="isLoading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载数据中...</text>
    </view>

    <!-- 顶部统计卡片区 -->
    <view class="stats-container">
      <view class="stat-card primary">
        <view class="stat-icon">📚</view>
        <text class="stat-number" v-if="isLoggedIn">{{ formatNumber(stats.totalMastered) }}</text>
        <text class="stat-number" v-else>{{ formatNumber(learningStats.totalWords) }}</text>
        <text class="stat-label">已掌握单词</text>
      </view>
      <view class="stat-card success">
        <view class="stat-icon">🔥</view>
        <text class="stat-number" v-if="isLoggedIn">{{ stats.streak }}</text>
        <text class="stat-number" v-else>{{ learningStats.streak }}</text>
        <text class="stat-label">连续学习(天)</text>
      </view>
      <view class="stat-card warning">
        <view class="stat-icon">✨</view>
        <text class="stat-number" v-if="isLoggedIn">{{ stats.totalAccuracy }}%</text>
        <text class="stat-number" v-else>{{ learningStats.accuracy }}%</text>
        <text class="stat-label">正确率</text>
      </view>
    </view>

    <!-- 今日学习进度 -->
    <view class="progress-section glass-effect">
      <view class="section-header">
        <text class="section-title">今日学习进度</text>
        <view class="progress-details">
          <text class="progress-text">{{ isLoggedIn ? stats.dailyProgress : dailyProgress }}%</text>
          <text class="progress-count">{{ isLoggedIn ? getTodayWordsCount() : Math.round(dailyProgress * 50 / 100) }}/{{ isLoggedIn ? stats.dailyGoal : 50 }}词</text>
        </view>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: (isLoggedIn ? stats.dailyProgress : dailyProgress) + '%' }">
          <view class="progress-glow"></view>
        </view>
      </view>
    </view>

    <!-- 最近学习数据 -->
    <view class="recent-stats glass-effect">
      <text class="section-title">最近学习</text>
      <view class="stats-grid">
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">📝</view>
          <text class="stat-value" v-if="isLoggedIn">{{ stats.yesterdayWords }}</text>
          <text class="stat-value" v-else>{{ recentActivity.yesterdayWords }}</text>
          <text class="stat-desc">昨日学习单词</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">⏱️</view>
          <text class="stat-value" v-if="isLoggedIn">{{ stats.weeklyHours }}h</text>
          <text class="stat-value" v-else>{{ recentActivity.weeklyHours }}h</text>
          <text class="stat-desc">本周学习时长</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">📊</view>
          <text class="stat-value" v-if="isLoggedIn">{{ stats.weeklyAccuracy }}%</text>
          <text class="stat-value" v-else>{{ recentActivity.weeklyAccuracy }}%</text>
          <text class="stat-desc">周平均正确率</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">🎯</view>
          <text class="stat-value" v-if="isLoggedIn">{{ stats.weeklyNewWords }}</text>
          <text class="stat-value" v-else>{{ recentActivity.weeklyNewWords }}</text>
          <text class="stat-desc">本周新词量</text>
        </view>
      </view>
    </view>

    <!-- 学习建议 -->
    <view class="suggestions glass-effect">
      <text class="section-title">今日建议</text>
      <view class="suggestion-card">
        <text class="suggestion-text">根据你的学习情况，建议今天：</text>
        <view class="suggestion-items">
          <view class="suggestion-item" @click="navigateToReview">
            <text class="suggestion-icon">📖</text>
            <text class="suggestion-content">复习昨日错题（{{ isLoggedIn ? stats.yesterdayWords : 15 }}个）</text>
            <text class="suggestion-arrow">→</text>
          </view>
          <view class="suggestion-item" @click="navigateToLearn">
            <text class="suggestion-icon">🆕</text>
            <text class="suggestion-content">学习新单词（{{ isLoggedIn ? stats.dailyGoal : 50 }}个）</text>
            <text class="suggestion-arrow">→</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false,
      userInfo: null,
      isLoading: true,
      isFirstLoad: true, // 添加标记，用于区分首次加载
      dailyProgress: 65,
      learningStats: {
        totalWords: 2358,
        streak: 15,
        accuracy: 92,
      },
      recentActivity: {
        yesterdayWords: 120,
        weeklyHours: 4.5,
        weeklyAccuracy: 89,
        weeklyNewWords: 856,
      },
      stats: {
        totalMastered: 0,
        streak: 0,
        totalAccuracy: 0,
        dailyProgress: 0,
        dailyGoal: 50,
        yesterdayWords: 0,
        weeklyHours: 0,
        weeklyAccuracy: 0,
        weeklyNewWords: 0
      }
    }
  },
  onLoad() {
    this.checkLoginStatus();
    this.loadUserStatistics();
  },
  onShow() {
    // 如果不是首次加载，则刷新数据
    if (!this.isFirstLoad) {
      console.log('页面再次显示，刷新数据');
      this.loadUserStatistics();
    } else {
      // 首次加载后将标记设为false
      this.isFirstLoad = false;
      console.log('首次加载，不重复请求');
    }
  },
  methods: {
    // 检查用户登录状态
    checkLoginStatus() {
      // 从本地存储获取用户信息
      const userInfoStorage = uni.getStorageSync('userInfo');
      if (userInfoStorage) {
        try {
          this.userInfo = JSON.parse(userInfoStorage);
          this.isLoggedIn = true;
          console.log('用户已登录:', this.userInfo);
          return true;
        } catch (error) {
          console.error('解析用户信息失败:', error);
          this.isLoggedIn = false;
          return false;
        }
      } else {
        console.log('用户未登录');
        this.isLoggedIn = false;
        return false;
      }
    },

    // 加载用户统计数据
    async loadUserStatistics() {
      if (!this.isLoggedIn) {
        console.log('用户未登录，使用默认数据');
        this.isLoading = false;
        return;
      }

      try {
        uni.showLoading({ title: '加载数据...' });

        const res = await wx.cloud.callFunction({
          name: 'getUserStatistics'
        });

        uni.hideLoading();

        if (res.result.code === 0 && res.result.data) {
          console.log('获取用户统计数据成功:', res.result.data);
          this.stats = res.result.data;
        } else {
          console.error('获取用户统计数据失败:', res.result.message);
          uni.showToast({
            title: '获取统计数据失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('获取用户统计数据失败:', error);
        uni.showToast({
          title: '获取统计数据失败',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },

    // 格式化数字（添加千位分隔符）
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // 导航到复习页面
    navigateToReview() {
      // 跳转到词库页面，后续可以添加特定的复习模式参数
      uni.navigateTo({
        url: '/pages/word/index'
      });
    },

    // 导航到学习页面
    navigateToLearn() {
      // 跳转到词库页面
      uni.navigateTo({
        url: '/pages/word/index'
      });
    },

    // 计算今日已学习单词数
    getTodayWordsCount() {
      if (!this.isLoggedIn || !this.stats) {
        return 0;
      }

      // 根据进度百分比和目标计算当前学习的单词数
      const dailyGoal = this.stats.dailyGoal || 50;
      const progress = this.stats.dailyProgress || 0;

      return Math.round((progress * dailyGoal) / 100);
    }
  }
}
</script>

<style>
.container {
  padding: 30rpx;
  background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
  min-height: 100vh;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  gap: 20rpx;
}

.stat-card {
  background: #ffffff;
  padding: 30rpx;
  border-radius: 20rpx;
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
  box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.05);
}

.stat-card.primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.stat-card.success {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.stat-card:hover {
  transform: translateY(-5rpx);
}

.stat-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin: 10rpx 0;
}

.stat-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.9);
}

.glass-effect {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.15);
  margin: 30rpx 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20rpx;
}

.progress-bar {
  height: 24rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 12rpx;
  transition: width 0.5s ease;
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rpx;
  height: 100%;
  background: rgba(255,255,255,0.3);
  filter: blur(4rpx);
}

.progress-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.progress-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #6366f1;
}

.progress-count {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.recent-stat-item {
  background: #ffffff;
  padding: 24rpx;
  border-radius: 16rpx;
  transition: all 0.3s ease;
  border: 2rpx solid rgba(0,0,0,0.05);
}

.hover-effect:hover {
  transform: translateY(-3rpx);
  box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.05);
}

.stat-icon-small {
  font-size: 36rpx;
  margin-bottom: 10rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
  margin: 8rpx 0;
}

.stat-desc {
  font-size: 26rpx;
  color: #6b7280;
}

.suggestion-card {
  background: #ffffff;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-top: 20rpx;
}

.suggestion-text {
  font-size: 28rpx;
  color: #4b5563;
  margin-bottom: 20rpx;
}

.suggestion-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #f9fafb;
  border-radius: 12rpx;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.suggestion-item:active {
  transform: scale(0.98);
  background: #f3f4f6;
}

.suggestion-icon {
  font-size: 36rpx;
  background: rgba(99, 102, 241, 0.1);
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.suggestion-content {
  font-size: 28rpx;
  color: #374151;
  flex: 1;
}

.suggestion-arrow {
  font-size: 28rpx;
  color: #6366f1;
  font-weight: bold;
}

/* Loading styles */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 8rpx solid #f3f3f3;
  border-top: 8rpx solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 30rpx;
  color: #4b5563;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
