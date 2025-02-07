<template>
  <view class="container">
    <!-- 顶部进度条 -->
    <view class="progress-bar-container glass-effect">
      <view class="progress-info">
        <text class="progress-text">今日进度: 23/50</text>
        <text class="time-text">剩余: 27个</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" style="width: 46%">
          <view class="progress-glow"></view>
        </view>
      </view>
    </view>

    <!-- 单词卡片 -->
    <view class="word-card glass-effect">
      <view class="word-header">
        <text class="word-text">Extraordinary</text>
        <view class="sound-button">
          <text class="sound-icon">🔊</text>
        </view>
      </view>
      
      <text class="phonetic">/ɪkˈstrɔːdnri/</text>
      
      <view class="divider"></view>
      
      <view class="word-content">
        <view class="meaning-item">
          <text class="part-of-speech">adj.</text>
          <text class="meaning-text">非凡的；特别的；非常的</text>
        </view>
        
        <view class="example-container">
          <text class="example-label">例句：</text>
          <text class="example-text">She is an extraordinary artist with amazing talent.</text>
          <text class="example-translation">她是一位才华横溢的非凡艺术家。</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="button-group">
        <view class="action-button forget">
          <text class="button-icon">😟</text>
          <text class="button-text">不认识</text>
        </view>
        <view class="action-button know">
          <text class="button-icon">😊</text>
          <text class="button-text">认识</text>
        </view>
      </view>
      <view class="next-button">
        <text class="next-text">下一个</text>
        <text class="next-icon">→</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentWord: {
        word: 'Extraordinary',
        phonetic: '/ɪkˈstrɔːdnri/',
        meanings: [
          {
            partOfSpeech: 'adj.',
            meaning: '非凡的；特别的；非常的'
          }
        ],
        example: {
          en: 'She is an extraordinary artist with amazing talent.',
          zh: '她是一位才华横溢的非凡艺术家。'
        }
      }
    }
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
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.15);
}

.progress-bar-container {
  padding: 20rpx;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.progress-text, .time-text {
  font-size: 26rpx;
  color: #6b7280;
}

.progress-bar {
  height: 16rpx;
  background: #f3f4f6;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 8rpx;
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

.word-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40rpx;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-text {
  font-size: 56rpx;
  font-weight: bold;
  color: #1f2937;
}

.sound-button {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-button:hover {
  background: #e5e7eb;
}

.sound-icon {
  font-size: 40rpx;
}

.phonetic {
  font-size: 32rpx;
  color: #6b7280;
  margin: 20rpx 0;
}

.divider {
  height: 2rpx;
  background: #e5e7eb;
  margin: 30rpx 0;
}

.word-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.meaning-item {
  display: flex;
  gap: 20rpx;
  align-items: baseline;
}

.part-of-speech {
  font-size: 28rpx;
  color: #6366f1;
  font-weight: 500;
}

.meaning-text {
  font-size: 32rpx;
  color: #374151;
  line-height: 1.5;
}

.example-container {
  background: #f9fafb;
  padding: 20rpx;
  border-radius: 12rpx;
}

.example-label {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 10rpx;
  display: block;
}

.example-text {
  font-size: 30rpx;
  color: #374151;
  line-height: 1.5;
  margin-bottom: 10rpx;
  display: block;
}

.example-translation {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.button-group {
  display: flex;
  gap: 20rpx;
}

.action-button {
  flex: 1;
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: all 0.3s ease;
}

.action-button.forget {
  background: #fee2e2;
  color: #ef4444;
}

.action-button.know {
  background: #dcfce7;
  color: #22c55e;
}

.button-icon {
  font-size: 36rpx;
}

.button-text {
  font-size: 32rpx;
  font-weight: 500;
}

.next-button {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: all 0.3s ease;
}

.next-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
}

.next-icon {
  font-size: 32rpx;
  color: #ffffff;
}
</style> 