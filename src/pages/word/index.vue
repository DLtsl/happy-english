<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header glass-effect">
      <text class="header-title">{{ activeTab === 'libraries' ? '词库选择' : '生疏词本' }}</text>
      <text class="header-subtitle">{{ activeTab === 'libraries' ? '选择适合你的词库开始学习' : '复习你标记为不认识的单词' }}</text>
    </view>

    <!-- 主要标签切换 -->
    <view class="main-tabs glass-effect">
      <view
        class="main-tab"
        :class="{ active: activeTab === 'libraries' }"
        @click="activeTab = 'libraries'"
      >
        <text class="main-tab-text">词库列表</text>
      </view>
      <view
        class="main-tab"
        :class="{ active: activeTab === 'unknown' }"
        @click="switchToUnknownWords"
      >
        <text class="main-tab-text">生疏词本</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-container glass-effect" v-if="activeTab === 'libraries'">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input class="search-input" type="text" placeholder="搜索词库" v-model="searchQuery" />
      </view>
    </view>

    <!-- 分类标签（暂时隐藏） -->
    <!-- <view class="category-tabs">
      <view
        v-for="(category, index) in categories"
        :key="index"
        class="category-tab"
        :class="{ active: activeCategory === index }"
        @click="activeCategory = index"
      >
        <text class="category-text">{{ category }}</text>
      </view>
    </view> -->

    <!-- 词库列表 -->
    <scroll-view scroll-y class="library-list" v-if="activeTab === 'libraries'">
      <view
        v-for="(library, index) in filteredLibraries"
        :key="index"
        class="library-card glass-effect"
        :class="{ 'library-card-selected': selectedLibraryId === library.bookId }"
        @click="selectLibrary(library)"
      >
        <view class="library-header">
          <!-- 使用封面图替代图标 -->
          <view class="library-icon" :class="library.color">
            <image v-if="library.coverImage" class="icon-image" :src="library.coverImage" mode="aspectFill"></image>
            <text v-else class="icon-text">{{ library.icon }}</text>
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

        <!-- 立即学习按钮 -->
        <view class="learn-now-button" @click.stop="startLearningLibrary(library)">
          <text class="learn-now-text">立即学习</text>
          <text class="learn-now-icon">→</text>
        </view>
      </view>
    </scroll-view>

    <!-- 生疏词本列表 -->
    <scroll-view scroll-y class="library-list" v-if="activeTab === 'unknown'">
      <view v-if="isLoading" class="loading-container glass-effect">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="unknownWordsByBook.length === 0" class="empty-container glass-effect">
        <text class="empty-title">暂无生疏单词</text>
        <text class="empty-subtitle">学习词库并标记不认识的单词，它们会出现在这里</text>
        <view class="empty-action" @click="activeTab = 'libraries'">
          <text class="empty-action-text">去学习</text>
          <text class="empty-action-icon">→</text>
        </view>
      </view>
      <view
        v-else
        v-for="(bookData, index) in unknownWordsByBook"
        :key="index"
        class="library-card glass-effect"
      >
        <view class="library-header">
          <!-- 使用封面图替代图标 -->
          <view class="library-icon" :class="bookData.color">
            <image v-if="bookData.coverImage" class="icon-image" :src="bookData.coverImage" mode="aspectFill"></image>
            <text v-else class="icon-text">{{ bookData.icon || '📚' }}</text>
          </view>
          <view class="library-info">
            <text class="library-name">{{ bookData.name || '未知词库' }}</text>
            <text class="library-count">{{ bookData.unknownCount }}个生疏单词</text>
          </view>
          <view v-if="bookData.difficulty" class="library-badge" :class="'difficulty-' + getDifficultyClass(bookData.difficulty)">
            <text class="badge-text">{{ bookData.difficulty }}</text>
          </view>
        </view>

        <!-- 复习按钮 -->
        <view class="learn-now-button review-button" @click.stop="startReviewingLibrary(bookData)">
          <text class="learn-now-text">开始复习</text>
          <text class="learn-now-icon">→</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮（暂时隐藏） -->
    <!-- <view v-if="selectedLibraryId" class="bottom-button start-button" @click="startLearning">
      <text class="button-icon">▶️</text>
      <text class="button-text">开始学习</text>
    </view> -->
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app'

// 搜索数据
const searchQuery = ref('');
const selectedLibraryId = ref(null); // 当前选中的词库ID

// 分类数据（暂时不使用）
// const categories = ['全部', '考试', '日常', '专业', '自定义'];
// const activeCategory = ref(0);

// 标签页状态
const activeTab = ref('libraries'); // 'libraries' 或 'unknown'
const isLoading = ref(false);

// 词库数据
const libraries = ref([]);
// 用户状态
const isLoggedIn = ref(false);
// 用户学习进度
const userProgress = ref({});
// 生疏词本数据
const unknownWordsByBook = ref([]);

// 根据搜索过滤词库
const filteredLibraries = computed(() => {
  let result = libraries.value.map(library => {
    // 创建一个新对象，避免修改原始数据
    const newLibrary = { ...library };

    // 如果用户已登录且有该词库的学习进度，则使用实际进度
    if (isLoggedIn.value && userProgress.value[library.bookId]) {
      const progress = userProgress.value[library.bookId];
      newLibrary.learnedCount = progress.totalStudied || 0;
      newLibrary.masteredCount = progress.totalStudied - (progress.unknownCount || 0);

      // 计算正确率（已掌握/已学习）
      if (progress.totalStudied > 0) {
        newLibrary.accuracy = Math.round(((progress.totalStudied - (progress.unknownCount || 0)) / progress.totalStudied) * 100);
      } else {
        newLibrary.accuracy = 0;
      }
    }

    return newLibrary;
  });

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(lib =>
      lib.name.toLowerCase().includes(query) ||
      (lib.category && lib.category.toLowerCase().includes(query))
    );
  }

  return result;
});

// 选择词库
const selectLibrary = (library) => {
  console.log('选择词库:', library.name);

  // 获取词库ID（使用 bookId）
  const libraryId = library.bookId;

  // 如果已经选中了这个词库，则取消选中
  if (selectedLibraryId.value === libraryId) {
    selectedLibraryId.value = null;
    uni.showToast({
      title: `已取消选择`,
      icon: 'none'
    });
  } else {
    // 否则选中这个词库
    selectedLibraryId.value = libraryId;
    uni.showToast({
      title: `已选择: ${library.name}`,
      icon: 'none'
    });
  }
};



// 立即学习指定词库
const startLearningLibrary = (library) => {
  console.log('开始学习:', library.name);

  // 获取词库ID（使用 bookId）
  const libraryId = library.bookId;

  // 显示提示
  uni.showToast({
    title: `开始学习: ${library.name}`,
    icon: 'success'
  });

  // 构建URL参数 - 不再传递进度信息，由云函数自动获取
  const url = `/pages/word/study?libraryId=${libraryId}&libraryName=${encodeURIComponent(library.name)}&wordCount=${library.wordCount}`;

  // 跳转到学习页面
  uni.navigateTo({
    url: url
  });
};

// 开始学习（底部按钮，现在已隐藏，暂时保留代码供参考）
/*
const startLearning = () => {
  const selectedLibrary = libraries.value.find(lib => lib.bookId === selectedLibraryId.value);
  if (selectedLibrary) {
    startLearningLibrary(selectedLibrary);
  }
};
*/

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

// 检查用户登录状态
const checkLoginStatus = () => {
  // 从本地存储获取用户信息
  const userInfoStorage = uni.getStorageSync('userInfo');
  if (userInfoStorage) {
    try {
      const userInfo = JSON.parse(userInfoStorage);
      isLoggedIn.value = true;
      console.log('用户已登录:', userInfo);
      return true;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      isLoggedIn.value = false;
      return false;
    }
  } else {
    console.log('用户未登录');
    isLoggedIn.value = false;
    return false;
  }
};

// 加载词库数据和用户进度
const loadLibraryData = async (showLoading = true) => {
  if (showLoading) {
    // 显示加载中提示
    uni.showLoading({
      title: '加载词库中...'
    });
  }

  // 检查用户登录状态
  const isUserLoggedIn = checkLoginStatus();

  try {
    // 并发请求：同时获取词库列表和用户进度（如果已登录）
    const promises = [
      wx.cloud.callFunction({
        name: 'getThesaurusList'
      })
    ];

    // 如果用户已登录，添加获取进度的请求
    if (isUserLoggedIn) {
      promises.push(
        wx.cloud.callFunction({
          name: 'getLibraryProgress'
        })
      );
    }

    // 等待所有请求完成
    const results = await Promise.all(promises);

    // 处理词库列表结果
    const libraryResult = results[0];
    console.log("获取词库数据", libraryResult.result.data);
    libraries.value = libraryResult.result.data;

    // 处理用户进度结果（如果有）
    if (isUserLoggedIn && results.length > 1) {
      const progressResult = results[1];
      if (progressResult.result.code === 0 && progressResult.result.data) {
        console.log('获取用户词库学习进度成功:', progressResult.result.data);
        userProgress.value = progressResult.result.data;
      } else {
        console.error('获取用户词库学习进度失败:', progressResult.result.message);
      }
    }

    if (showLoading) {
      // 隐藏加载提示
      uni.hideLoading();
    }
  } catch (err) {
    console.error("加载数据失败", err);
    if (showLoading) {
      uni.hideLoading();
      uni.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  }
};

// 标记是否是首次加载
const isFirstLoad = ref(true);

// 切换到生疏词本标签
const switchToUnknownWords = () => {
  activeTab.value = 'unknown';
  loadUnknownWords();
};

// 加载生疏词本数据
const loadUnknownWords = async () => {
  // 检查用户是否登录
  if (!checkLoginStatus()) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    activeTab.value = 'libraries';
    return;
  }

  isLoading.value = true;

  try {
    // 调用云函数获取按词库分组的生疏单词
    const res = await wx.cloud.callFunction({
      name: 'getUnknownWordsByBook'
    });

    console.log('获取生疏词本数据结果:', res.result);

    if (res.result.code === 0 && res.result.data) {
      // 直接使用返回的按词库分组的数据
      unknownWordsByBook.value = res.result.data.books || [];
      console.log('生疏词本数据:', unknownWordsByBook.value);
    } else {
      console.error('获取生疏词本失败:', res.result.message);
      uni.showToast({
        title: '获取生疏词本失败',
        icon: 'none'
      });
      unknownWordsByBook.value = [];
    }
  } catch (err) {
    console.error('获取生疏词本出错:', err);
    uni.showToast({
      title: '获取生疏词本出错',
      icon: 'none'
    });
    unknownWordsByBook.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 开始复习指定词库的生疏单词
const startReviewingLibrary = (bookData) => {
  console.log('开始复习生疏单词:', bookData.name);

  // 获取词库ID
  const libraryId = bookData.bookId;

  // 显示提示
  uni.showToast({
    title: `开始复习: ${bookData.name}`,
    icon: 'success'
  });

  // 构建URL参数 - 添加isReview标记
  const url = `/pages/word/study?libraryId=${libraryId}&libraryName=${encodeURIComponent(bookData.name)}&isReview=true`;

  // 跳转到学习页面
  uni.navigateTo({
    url: url
  });
};

// 页面显示时加载数据
onShow(() => {
  console.log('页面显示，加载数据');
  // 首次加载显示加载提示，后续静默刷新
  loadLibraryData(isFirstLoad.value);

  // 如果当前是生疏词本标签，刷新生疏词本数据
  if (activeTab.value === 'unknown') {
    loadUnknownWords();
  }

  // 设置为非首次加载
  if (isFirstLoad.value) {
    isFirstLoad.value = false;
  }
});
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
  overflow: hidden;
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
  z-index: 2;
}

/* 图标图片样式 */
.icon-image {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  object-fit: cover;
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
  display: flex;
  flex-direction: column;
}

.library-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 10rpx;
  line-height: 1.2;
}

.library-count {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.2;
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

/* 立即学习按钮样式 */
.learn-now-button {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  padding: 20rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 20rpx;
  transition: all 0.3s ease;
}

.learn-now-button:active {
  transform: scale(0.98);
}

.learn-now-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #ffffff;
}

.learn-now-icon {
  font-size: 28rpx;
  color: #ffffff;
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

/* 主标签切换样式 */
.main-tabs {
  display: flex;
  justify-content: space-between;
  padding: 10rpx;
  margin-bottom: 20rpx;
}

.main-tab {
  flex: 1;
  padding: 20rpx 0;
  text-align: center;
  border-radius: 10rpx;
  transition: all 0.3s ease;
}

.main-tab.active {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
}

.main-tab-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #4b5563;
}

.main-tab.active .main-tab-text {
  color: #ffffff;
}

/* 加载和空状态样式 */
.loading-container {
  padding: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300rpx;
}

.loading-text {
  font-size: 32rpx;
  color: #6b7280;
}

.empty-container {
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  text-align: center;
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 20rpx;
}

.empty-subtitle {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.empty-action {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.empty-action-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.empty-action-icon {
  font-size: 28rpx;
  color: #ffffff;
}

/* 复习按钮样式 */
.review-button {
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
}
</style>