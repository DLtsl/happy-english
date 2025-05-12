<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header glass-effect">
      <text class="header-title">词库选择</text>
      <text class="header-subtitle">选择适合你的词库开始学习</text>
    </view>

    <!-- 搜索框 -->
    <view class="search-container glass-effect">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input class="search-input" type="text" placeholder="搜索词库" v-model="searchQuery" />
      </view>
    </view>

    <!-- 分类标签 -->
    <view class="category-tabs">
      <view
        v-for="(category, index) in categories"
        :key="index"
        class="category-tab"
        :class="{ active: activeCategory === index }"
        @click="activeCategory = index"
      >
        <text class="category-text">{{ category }}</text>
      </view>
    </view>

    <!-- 词库列表 -->
    <scroll-view scroll-y class="library-list">
      <view
        v-for="(library, index) in filteredLibraries"
        :key="index"
        class="library-card glass-effect"
        :class="{ 'library-card-selected': selectedLibraryId === library.id }"
        @click="selectLibrary(library)"
      >
        <view class="library-header">
          <view class="library-icon" :class="library.color">
            <text class="icon-text">{{ library.icon }}</text>
          </view>
          <view class="library-info">
            <text class="library-name">{{ library.name }}</text>
            <text class="library-count">{{ library.wordCount }}个单词</text>
          </view>
          <view class="library-badge" :class="'difficulty-' + getDifficultyClass(library.difficulty)">
            <text class="badge-text">{{ library.difficulty }}</text>
          </view>
        </view>

        <view class="library-stats">
          <view class="stat-item">
            <text class="stat-value">{{ library.learnedCount }}</text>
            <text class="stat-label">已学</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ library.masteredCount }}</text>
            <text class="stat-label">已掌握</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ library.accuracy }}%</text>
            <text class="stat-label">正确率</text>
          </view>
        </view>

        <view class="progress-container">
          <view class="progress-info">
            <text class="progress-text">完成进度</text>
            <text class="progress-percent">{{ Math.round(library.masteredCount / library.wordCount * 100) }}%</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: (library.masteredCount / library.wordCount * 100) + '%' }">
              <view class="progress-glow"></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view v-if="selectedLibraryId" class="bottom-button start-button" @click="startLearning">
      <text class="button-icon">▶️</text>
      <text class="button-text">开始学习</text>
    </view>
    <view v-else class="bottom-button" @click="createCustomLibrary">
      <text class="button-icon">➕</text>
      <text class="button-text">创建自定义词库</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

// 分类数据
const categories = ['全部', '考试', '日常', '专业', '自定义'];
const activeCategory = ref(0);
const searchQuery = ref('');
const selectedLibraryId = ref(null); // 当前选中的词库ID

// 词库数据
const libraries = ref([
  {
    id: 1,
    name: '四级核心词汇',
    icon: '📚',
    color: 'blue',
    wordCount: 2500,
    learnedCount: 1200,
    masteredCount: 800,
    accuracy: 92,
    difficulty: '中级',
    category: '考试'
  },
  {
    id: 2,
    name: '六级核心词汇',
    icon: '📝',
    color: 'purple',
    wordCount: 3000,
    learnedCount: 800,
    masteredCount: 500,
    accuracy: 88,
    difficulty: '中高级',
    category: '考试'
  },
  {
    id: 3,
    name: '托福核心词汇',
    icon: '🎓',
    color: 'orange',
    wordCount: 5000,
    learnedCount: 1500,
    masteredCount: 1000,
    accuracy: 85,
    difficulty: '高级',
    category: '考试'
  },
  {
    id: 4,
    name: '雅思词汇',
    icon: '🌟',
    color: 'green',
    wordCount: 4500,
    learnedCount: 1200,
    masteredCount: 700,
    accuracy: 82,
    difficulty: '高级',
    category: '考试'
  },
  {
    id: 5,
    name: '日常交流词汇',
    icon: '💬',
    color: 'teal',
    wordCount: 1500,
    learnedCount: 900,
    masteredCount: 600,
    accuracy: 95,
    difficulty: '初级',
    category: '日常'
  },
  {
    id: 6,
    name: '商务英语词汇',
    icon: '💼',
    color: 'indigo',
    wordCount: 2000,
    learnedCount: 500,
    masteredCount: 300,
    accuracy: 78,
    difficulty: '中级',
    category: '专业'
  },
  {
    id: 7,
    name: 'IT专业词汇',
    icon: '💻',
    color: 'gray',
    wordCount: 1800,
    learnedCount: 400,
    masteredCount: 200,
    accuracy: 75,
    difficulty: '中高级',
    category: '专业'
  },
  {
    id: 8,
    name: '我的收藏词汇',
    icon: '❤️',
    color: 'red',
    wordCount: 120,
    learnedCount: 80,
    masteredCount: 50,
    accuracy: 90,
    difficulty: '混合',
    category: '自定义'
  }
]);

// 根据分类和搜索过滤词库
const filteredLibraries = computed(() => {
  let result = libraries.value;

  // 按分类过滤
  if (activeCategory.value > 0) {
    result = result.filter(lib => lib.category === categories[activeCategory.value]);
  }

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(lib =>
      lib.name.toLowerCase().includes(query) ||
      lib.category.toLowerCase().includes(query)
    );
  }

  return result;
});

// 选择词库
const selectLibrary = (library) => {
  console.log('选择词库:', library.name);

  // 如果已经选中了这个词库，则取消选中
  if (selectedLibraryId.value === library.id) {
    selectedLibraryId.value = null;
    uni.showToast({
      title: `已取消选择`,
      icon: 'none'
    });
  } else {
    // 否则选中这个词库
    selectedLibraryId.value = library.id;
    uni.showToast({
      title: `已选择: ${library.name}`,
      icon: 'none'
    });
  }
};

// 创建自定义词库
const createCustomLibrary = () => {
  console.log('创建自定义词库');
  uni.showToast({
    title: '创建自定义词库功能即将上线',
    icon: 'none'
  });
};

// 开始学习
const startLearning = () => {
  const selectedLibrary = libraries.value.find(lib => lib.id === selectedLibraryId.value);
  if (selectedLibrary) {
    console.log('开始学习:', selectedLibrary.name);
    uni.showToast({
      title: `开始学习: ${selectedLibrary.name}`,
      icon: 'success'
    });

    // 这里可以添加跳转到学习页面的逻辑
    // 例如：
    // uni.navigateTo({
    //   url: `/pages/word/study?libraryId=${selectedLibraryId.value}`
    // });
  }
};

// 将中文难度转换为英文类名
const getDifficultyClass = (difficulty) => {
  const map = {
    '初级': 'beginner',
    '中级': 'intermediate',
    '中高级': 'advanced',
    '高级': 'expert',
    '混合': 'mixed'
  };
  return map[difficulty] || 'intermediate';
};
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

/* Header styles */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 10rpx;
}

.header-subtitle {
  font-size: 28rpx;
  color: #6b7280;
}

/* Search box styles */
.search-container {
  padding: 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 50rpx;
  padding: 15rpx 30rpx;
}

.search-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  color: #6b7280;
}

.search-input {
  flex: 1;
  height: 70rpx;
  font-size: 30rpx;
  color: #374151;
}

/* Category tab styles */
.category-tabs {
  display: flex;
  overflow-x: auto;
  padding: 10rpx 0;
  gap: 20rpx;
}

.category-tab {
  padding: 15rpx 30rpx;
  background: #f3f4f6;
  border-radius: 50rpx;
  transition: all 0.3s ease;
}

.category-tab.active {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
}

.category-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #4b5563;
}

.category-tab.active .category-text {
  color: #ffffff;
}

/* Library list styles */
.library-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.library-card {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
  margin-bottom: 30rpx;
  transition: all 0.3s ease;
  position: relative;
  border: 3rpx solid transparent;
}

.library-card:active {
  transform: scale(0.98);
}

.library-card-selected {
  border: 3rpx solid #6366f1;
  box-shadow: 0 10rpx 40rpx rgba(99, 102, 241, 0.2);
}

.library-card-selected::after {
  content: "✓";
  position: absolute;
  top: -15rpx;
  right: -15rpx;
  width: 50rpx;
  height: 50rpx;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
}

.library-header {
  display: flex;
  align-items: center;
}

.library-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.icon-text {
  font-size: 40rpx;
}

.library-info {
  flex: 1;
}

.library-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 6rpx;
}

.library-count {
  font-size: 26rpx;
  color: #6b7280;
}

.library-badge {
  padding: 8rpx 20rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.badge-text {
  color: #ffffff;
}

/* Stats styles */
.library-stats {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 2rpx solid #f3f4f6;
  border-bottom: 2rpx solid #f3f4f6;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 6rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #6b7280;
}

/* Progress bar styles */
.progress-container {
  padding: 10rpx 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.progress-text, .progress-percent {
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

/* Bottom button styles */
.bottom-button {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  padding: 30rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  margin-top: 20rpx;
  transition: all 0.3s ease;
}

.bottom-button:active {
  transform: scale(0.98);
}

.start-button {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.2);
}

.button-icon {
  font-size: 32rpx;
  color: #ffffff;
}

.button-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
}

/* Color styles */
.blue {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

.purple {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
}

.orange {
  background: linear-gradient(135deg, #fdba74 0%, #f97316 100%);
}

.green {
  background: linear-gradient(135deg, #86efac 0%, #22c55e 100%);
}

.teal {
  background: linear-gradient(135deg, #5eead4 0%, #14b8a6 100%);
}

.indigo {
  background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%);
}

.gray {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.red {
  background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
}

/* Difficulty styles */
.difficulty-beginner {
  background: #22c55e;
}

.difficulty-intermediate {
  background: #3b82f6;
}

.difficulty-advanced {
  background: #8b5cf6;
}

.difficulty-expert {
  background: #f97316;
}

.difficulty-mixed {
  background: #6b7280;
}
</style>