<template>
  <view class="container">
    <!-- 顶部统计卡片区 -->
    <view class="stats-container">
      <view class="stat-card primary">
        <view class="stat-icon">📚</view>
        <text class="stat-number">2,358</text>
        <text class="stat-label">已掌握单词</text>
      </view>
      <view class="stat-card success">
        <view class="stat-icon">🔥</view>
        <text class="stat-number">15</text>
        <text class="stat-label">连续学习(天)</text>
      </view>
      <view class="stat-card warning">
        <view class="stat-icon">✨</view>
        <text class="stat-number">92%</text>
        <text class="stat-label">正确率</text>
      </view>
    </view>

    <!-- 今日学习进度 -->
    <view class="progress-section glass-effect">
      <view class="section-header">
        <text class="section-title">今日学习进度</text>
        <text class="progress-text">已完成 {{dailyProgress}}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: dailyProgress + '%' }">
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
          <text class="stat-value">120</text>
          <text class="stat-desc">昨日学习单词</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">⏱️</view>
          <text class="stat-value">4.5h</text>
          <text class="stat-desc">本周学习时长</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">📊</view>
          <text class="stat-value">89%</text>
          <text class="stat-desc">周平均正确率</text>
        </view>
        <view class="recent-stat-item hover-effect">
          <view class="stat-icon-small">🎯</view>
          <text class="stat-value">856</text>
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
          <view class="suggestion-item">
            <text class="suggestion-icon">📖</text>
            <text class="suggestion-content">复习昨日错题（15个）</text>
          </view>
          <view class="suggestion-item">
            <text class="suggestion-icon">🆕</text>
            <text class="suggestion-content">学习新单词（50个）</text>
          </view>
          <view class="suggestion-item">
            <text class="suggestion-icon">🎧</text>
            <text class="suggestion-content">完成每日听力练习</text>
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
      }
    }
  },
  onLoad() {
    // 这里后续添加数据获取逻辑
  },
  methods: {
    // 后续添加交互方法
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

.progress-text {
  font-size: 26rpx;
  color: #6b7280;
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
  padding: 16rpx;
  background: #f9fafb;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  background: #f3f4f6;
}

.suggestion-icon {
  font-size: 32rpx;
}

.suggestion-content {
  font-size: 28rpx;
  color: #374151;
}
</style>
