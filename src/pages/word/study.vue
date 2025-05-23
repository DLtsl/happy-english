<template>
  <view class="container">
    <!-- 顶部进度条 -->
    <view class="progress-bar-container glass-effect">
      <view class="progress-info">
        <text class="progress-text">学习进度: {{ currentIndex + 1 }}/{{ totalWords }}</text>
        <text class="time-text">测验: {{ totalWords - currentIndex - 1 }}个</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercentage + '%' }">
          <view class="progress-glow"></view>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 单词卡片 -->
      <view class="word-card glass-effect">
        <!-- 单词和发音 -->
        <view class="word-header">
          <text class="word-text">{{ currentWord.headWord }}</text>
          <view class="pronunciation-buttons">
            <view class="sound-button" @click="playPronunciation('uk', $event)">
              <image class="flag-icon" src="/static/uk-flag.svg" mode="aspectFit"></image>
            </view>
            <view class="sound-button" @click="playPronunciation('us', $event)">
              <image class="flag-icon" src="/static/us-flag.svg" mode="aspectFit"></image>
            </view>
          </view>
        </view>

        <!-- 音标 -->
        <view class="phonetic-container">
          <view class="phonetic-item">
            <text class="phonetic-label">英:</text>
            <text class="phonetic">{{ currentWord.content.word.content.ukphone }}</text>
          </view>
          <view class="phonetic-item">
            <text class="phonetic-label">美:</text>
            <text class="phonetic">{{ currentWord.content.word.content.usphone }}</text>
          </view>
        </view>

        <!-- 分割线 -->
        <view class="divider"></view>

        <!-- 释义部分 -->
        <scroll-view scroll-y class="meanings-container">
          <!-- 翻译 -->
          <view v-for="(trans, index) in currentWord.content.word.content.trans" :key="'trans-'+index" class="meaning-item">
            <text class="part-of-speech">{{ trans.pos }}</text>
            <text class="meaning-text">{{ trans.tranCn }}</text>
          </view>

          <!-- 例句 -->
          <view class="section-title">例句</view>
          <view v-for="(sentence, index) in currentWord.content.word.content.sentence.sentences" :key="'sentence-'+index" class="example-container">
            <text class="example-text">{{ sentence.sContent }}</text>
            <text class="example-translation">{{ sentence.sCn }}</text>
          </view>

          <!-- 短语 -->
          <view v-if="currentWord.content.word.content.phrase && currentWord.content.word.content.phrase.phrases.length > 0" class="section-title">常用短语</view>
          <view v-for="(phrase, index) in currentWord.content.word.content.phrase?.phrases || []" :key="'phrase-'+index" class="phrase-item">
            <text class="phrase-text">{{ phrase.pContent }}</text>
            <text class="phrase-translation">{{ phrase.pCn }}</text>
          </view>

          <!-- 同近义词 -->
          <view v-if="currentWord.content.word.content.syno && currentWord.content.word.content.syno.synos.length > 0" class="section-title">同近义词</view>
          <view v-for="(syno, index) in currentWord.content.word.content.syno?.synos || []" :key="'syno-'+index" class="syno-item">
            <view class="syno-header">
              <text class="part-of-speech">{{ syno.pos }}</text>
              <text class="syno-meaning">{{ syno.tran }}</text>
            </view>
            <view class="syno-words">
              <text v-for="(word, wIndex) in syno.hwds" :key="'word-'+wIndex" class="syno-word">{{ word.w }}</text>
            </view>
          </view>

          <!-- 同根词 -->
          <view v-if="currentWord.content.word.content.relWord && currentWord.content.word.content.relWord.rels.length > 0" class="section-title">同根词</view>
          <view v-for="(rel, index) in currentWord.content.word.content.relWord?.rels || []" :key="'rel-'+index" class="rel-item">
            <text class="part-of-speech">{{ rel.pos }}</text>
            <view v-for="(word, wIndex) in rel.words" :key="'relword-'+wIndex" class="rel-word-item">
              <text class="rel-word">{{ word.hwd }}</text>
              <text class="rel-meaning">{{ word.tran }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons glass-effect">
      <view class="button-group">
        <view class="action-button forget" @click="handleForget">
          <text class="button-icon">😟</text>
          <text class="button-text">不认识</text>
        </view>
        <view class="action-button know" @click="handleKnow">
          <text class="button-icon">😊</text>
          <text class="button-text">认识</text>
        </view>
      </view>
      <view class="next-button" @click="nextWord">
        <text class="next-text">下一个</text>
        <text class="next-icon">→</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 模拟单词数据
const mockWordData = {
  wordRank: 1,
  headWord: "cancel",
  content: {
    word: {
      wordHead: "cancel",
      wordId: "CET4_3_1",
      content: {
        exam: [
          {
            question: "As we can no longer wait for the delivery of our order, we have to _______ it.",
            answer: {
              explain: " cancel order：  取消订单。 句意：  订购的货物尚未送到， 我们不能再等了， 不得不取消订单。 postpone：  推迟， 使延期； refuse：  拒绝， 谢绝； delay：  耽搁， 延迟， 延期。",
              rightIndex: 4
            },
            examType: 1,
            choices: [
              { choiceIndex: 1, choice: "postpone" },
              { choiceIndex: 2, choice: "refuse" },
              { choiceIndex: 3, choice: "delay" },
              { choiceIndex: 4, choice: "cancel" }
            ]
          }
        ],
        sentence: {
          sentences: [
            {
              sContent: "Our flight was cancelled.",
              sCn: "我们的航班取消了。"
            },
            {
              sContent: "I'm afraid I'll have to cancel our meeting tomorrow.",
              sCn: "恐怕我得取消我们明天的会议。"
            },
            {
              sContent: "You'll just have to ring John and cancel.",
              sCn: "你只能打电话给约翰取消了。"
            }
          ],
          desc: "例句"
        },
        usphone: "'kænsl",
        syno: {
          synos: [
            {
              pos: "vt",
              tran: "[计]取消；删去",
              hwds: [
                { w: "recall" },
                { w: "call it off" }
              ]
            },
            {
              pos: "vi",
              tran: "[计]取消；相互抵销",
              hwds: [
                { w: "call it off" },
                { w: "declare off" }
              ]
            },
            {
              pos: "n",
              tran: "[计]取消，撤销",
              hwds: [
                { w: "withdrawal" },
                { w: "revocation" }
              ]
            }
          ],
          desc: "同近"
        },
        ukphone: "'kænsl",
        ukspeech: "cancel&type=1",
        phrase: {
          phrases: [
            {
              pContent: "cancel button",
              pCn: "取消按钮"
            },
            {
              pContent: "cancel out",
              pCn: "取消；抵销"
            },
            {
              pContent: "cancel after verification",
              pCn: "核销"
            }
          ],
          desc: "短语"
        },
        relWord: {
          rels: [
            {
              pos: "n",
              words: [
                {
                  hwd: "cancellation",
                  tran: " 取消；删除"
                }
              ]
            }
          ],
          desc: "同根"
        },
        usspeech: "cancel&type=2",
        trans: [
          {
            tranCn: " 取消， 撤销； 删去",
            descOther: "英释",
            pos: "vt",
            descCn: "中释",
            tranOther: "to decide that something that was officially planned will not happen"
          }
        ]
      }
    }
  },
  bookId: "CET4_3"
};

// 状态变量
const words = ref([mockWordData]); // 实际应用中这里会从API获取词库数据
const currentIndex = ref(0);
const totalWords = ref(1); // 实际应用中这里会是词库的总单词数
const knownWords = ref([]);
const unknownWords = ref([]);

// 计算属性
const currentWord = computed(() => words.value[currentIndex.value] || mockWordData);
const progressPercentage = computed(() => ((currentIndex.value + 1) / totalWords.value) * 100);

// 方法
// 创建两个持久的音频对象
const ukAudio = ref(null);
const usAudio = ref(null);

// 初始化音频对象
const initAudio = () => {
  if (!ukAudio.value) {
    ukAudio.value = uni.createInnerAudioContext();
  }
  if (!usAudio.value) {
    usAudio.value = uni.createInnerAudioContext();
  }
};

// 播放发音
const playPronunciation = (type, e) => {
  // 如果提供了事件对象，阻止事件冒泡
  if (e) {
    e.stopPropagation();
  }

  // 确保音频对象已初始化
  initAudio();

  const word = currentWord.value.headWord;
  const audioType = type === 'uk' ? 1 : 2;
  const audioUrl = `https://dict.youdao.com/dictvoice?audio=${word}&type=${audioType}`;

  // 根据类型选择对应的音频对象
  const audio = type === 'uk' ? ukAudio.value : usAudio.value;

  // 设置音频源并播放
  audio.src = audioUrl;

  // 添加事件监听
  audio.onError((res) => {
    console.error('音频播放失败:', res);
    uni.showToast({
      title: '发音加载失败',
      icon: 'none'
    });
  });

  // 播放音频
  audio.stop(); // 先停止之前的播放
  audio.play();

  // 显示提示
  uni.showToast({
    title: type === 'uk' ? '英式发音' : '美式发音',
    icon: 'none',
    duration: 1000
  });
};

const handleKnow = () => {
  // 标记为认识
  knownWords.value.push(currentWord.value.content.word.wordId);

  // 显示提示
  uni.showToast({
    title: '已标记为认识',
    icon: 'success',
    duration: 1500
  });

  // 自动翻到下一个
  setTimeout(() => {
    nextWord();
  }, 800);
};

const handleForget = () => {
  // 标记为不认识
  unknownWords.value.push(currentWord.value.content.word.wordId);

  // 显示提示
  uni.showToast({
    title: '已标记为不认识',
    icon: 'none',
    duration: 1500
  });

  // 自动滚动到释义部分
  setTimeout(() => {
    // 使用uni的API滚动到顶部
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }, 100);
};

const nextWord = () => {
  console.log("nextWord", currentIndex.value, words.value.length, totalWords.value);

  // 如果当前是最后一个单词，则尝试加载下一个
  if (currentIndex.value >= words.value.length - 1) {
    // 检查是否还有更多单词可以加载
    if (words.value.length < totalWords.value) {
      // 获取下一个单词的序号
      const nextWordRank = words.value[words.value.length - 1].wordRank + 1;

      // 获取当前页面
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      const libraryId = options.libraryId;

      if (libraryId) {
        // 显示加载提示
        uni.showLoading({
          title: '加载下一个单词...'
        });

        // 获取下一个单词
        fetchWordData(libraryId, nextWordRank)
          .then(result => {
            uni.hideLoading();

            if (result.success) {
              // 移动到下一个单词
              currentIndex.value++;
              // 更新音频源
              updateAudioSources();
            } else if (result.isLast) {
              // 已经是最后一个单词
              uni.showToast({
                title: '恭喜你，学习完成！',
                icon: 'success',
                duration: 2000
              });
            } else {
              // 获取失败
              uni.showToast({
                title: '获取下一个单词失败',
                icon: 'none'
              });
            }
          });
      } else {
        // 没有词库ID，无法获取更多单词
        uni.showToast({
          title: '恭喜你，学习完成！',
          icon: 'success',
          duration: 2000
        });
      }
    } else {
      // 已经学习完所有单词
      uni.showToast({
        title: '恭喜你，学习完成！',
        icon: 'success',
        duration: 2000
      });
    }
    return;
  }

  // 切换到下一个单词
  currentIndex.value++;

  // 更新音频源
  updateAudioSources();
};

// 更新音频源
const updateAudioSources = () => {
  if (!ukAudio.value || !usAudio.value) {
    initAudio();
    return;
  }

  const word = currentWord.value.headWord;
  ukAudio.value.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=1`;
  usAudio.value.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=2`;
};

// 获取单个单词数据
const fetchWordData = (libraryId, wordRank = 1, isRetry = false) => {
  // 从云函数获取单词数据
  console.log('获取单词数据:', libraryId, '单词序号:', wordRank, isRetry ? '(重试)' : '');

  if (!isRetry) {
    // 显示加载中提示
    uni.showLoading({
      title: '加载中...'
    });
  }

  // 调用云函数获取单个单词
  return wx.cloud.callFunction({
    name: 'getWordsByBookId',
    data: {
      bookId: libraryId,
      wordRank: wordRank,
      wordCount: totalWords.value
    }
  })
  .then(res => {
    console.log("获取单词数据结果:", res.result);

    if (!isRetry) {
      uni.hideLoading();
    }

    if (res.result.code === 0 && res.result.data) {
      // 如果成功获取到单词
      if (res.result.data.word) {
        // 如果是第一个单词或替换当前单词，则重置单词列表
        if (wordRank === 1 || words.value.length === 0) {
          words.value = [res.result.data.word];
          currentIndex.value = 0;
        } else {
          // 否则添加到单词列表
          words.value.push(res.result.data.word);
        }
        return { success: true, word: res.result.data.word };
      }
      // 如果当前序号没有单词，但有建议的下一个序号
      else if (res.result.data.nextRank) {
        console.log("当前序号没有单词，尝试下一个序号:", res.result.data.nextRank);
        // 递归调用，尝试获取下一个序号的单词
        return fetchWordData(libraryId, res.result.data.nextRank, true);
      }
      // 如果已经是最后一个单词
      else if (res.result.data.isLast) {
        console.log("已经是最后一个单词");
        uni.showToast({
          title: '已经是最后一个单词',
          icon: 'none',
          duration: 2000
        });
        return { success: false, isLast: true };
      }
      // 其他情况，使用模拟数据
      else {
        console.warn("未获取到单词数据，使用示例数据");
        if (words.value.length === 0) {
          words.value = [mockWordData];
          totalWords.value = 1;
        }
        return { success: false };
      }
    } else {
      // 请求失败，使用模拟数据
      console.error("获取单词数据失败", res.result.message);
      if (!isRetry) {
        uni.showToast({
          title: '获取单词数据失败，使用示例数据',
          icon: 'none'
        });
      }
      if (words.value.length === 0) {
        words.value = [mockWordData];
        totalWords.value = 1;
      }
      return { success: false, error: res.result.message };
    }
  })
  .catch(err => {
    console.error("调用云函数失败", err);
    if (!isRetry) {
      uni.hideLoading();
      uni.showToast({
        title: '获取单词数据失败',
        icon: 'none'
      });
    }
    // 使用模拟数据作为备用
    if (words.value.length === 0) {
      words.value = [mockWordData];
      totalWords.value = 1;
    }
    return { success: false, error: err.message };
  });
};

// 获取词库数据（初始化）
const fetchWordLibrary = (libraryId, startRank = 1) => {
  // 获取第一个单词
  fetchWordData(libraryId, startRank);
};

// onLoad 生命周期钩子 - 页面加载时获取参数
onLoad((options) => {
  console.log('study.vue onLoad 获取到的参数:', options);

  // 获取词库ID、名称和单词总数
  const libraryId = options.libraryId;
  const libraryName = options.libraryName ? decodeURIComponent(options.libraryName) : '单词学习';
  const wordCount = options.wordCount ? parseInt(options.wordCount) : 0;

  console.log('解析后的参数:', { libraryId, libraryName, wordCount });

  // 设置总单词数
  if (wordCount > 0) {
    totalWords.value = wordCount;
  }

  if (libraryId) {
    console.log('开始获取词库数据, libraryId:', libraryId);
    // 获取词库数据，从第一个单词开始
    fetchWordLibrary(libraryId, 1);

    // 设置页面标题
    if (libraryName) {
      uni.setNavigationBarTitle({
        title: libraryName
      });
    }
  } else {
    console.warn('未指定词库ID，使用示例数据');
    // 没有传入词库ID，使用默认数据
    totalWords.value = words.value.length;
    uni.showToast({
      title: '未指定词库，使用示例数据',
      icon: 'none'
    });
  }
});

// 生命周期钩子
onMounted(() => {
  // 初始化音频对象
  initAudio();
});

// 组件卸载前销毁音频对象
onBeforeUnmount(() => {
  if (ukAudio.value) {
    ukAudio.value.destroy();
  }
  if (usAudio.value) {
    usAudio.value.destroy();
  }
});
</script>

<style>
.container {
  padding: 20rpx;
  background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  overflow: hidden; /* 防止整个容器滚动 */
  position: relative; /* 确保定位正确 */
  box-sizing: border-box; /* 确保内边距不会增加元素的总宽高 */
}

.content-area {
  flex: 1;
  overflow: hidden;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.15);
}

/* 进度条样式 */
.progress-bar-container {
  padding: 15rpx;
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
  height: 12rpx;
  background: #f3f4f6;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 6rpx;
  position: relative;
  transition: width 0.3s ease;
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

/* 单词卡片样式 */
.word-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.word-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #1f2937;
  flex: 1;
}

.pronunciation-buttons {
  display: flex;
  gap: 15rpx;
}

.sound-button {
  width: 70rpx;
  height: 70rpx;
  border-radius: 35rpx;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.sound-button:active {
  background: #e5e7eb;
  transform: scale(0.95);
}

.flag-icon {
  width: 40rpx;
  height: 40rpx;
}

.phonetic-container {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.phonetic-item {
  display: flex;
  align-items: center;
}

.phonetic-label {
  font-size: 28rpx;
  color: #6b7280;
  margin-right: 10rpx;
}

.phonetic {
  font-size: 30rpx;
  color: #6b7280;
}

.divider {
  height: 2rpx;
  background: #e5e7eb;
  margin: 15rpx 0;
}

/* 释义部分样式 */
.meanings-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* 增强iOS滚动体验 */
  padding-bottom: 30rpx; /* 底部留出一些空间 */
  border-radius: 0 0 20rpx 20rpx; /* 底部圆角 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏滚动条 */
.meanings-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.meaning-item {
  display: flex;
  gap: 15rpx;
  align-items: baseline;
  margin-bottom: 15rpx;
  flex-wrap: wrap; /* 允许在小屏幕上换行 */
}

.part-of-speech {
  font-size: 26rpx;
  color: #6366f1;
  font-weight: 500;
  min-width: 50rpx;
}

.meaning-text {
  font-size: 30rpx;
  color: #374151;
  line-height: 1.5;
  flex: 1;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1f2937;
  margin: 25rpx 0 15rpx 0;
  padding-bottom: 8rpx;
  border-bottom: 2rpx solid #e5e7eb;
}

.example-container {
  background: #f9fafb;
  padding: 15rpx;
  border-radius: 10rpx;
  margin-bottom: 15rpx;
}

.example-text {
  font-size: 28rpx;
  color: #374151;
  line-height: 1.5;
  margin-bottom: 8rpx;
  display: block;
}

.example-translation {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.phrase-item {
  margin-bottom: 12rpx;
}

.phrase-text {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.phrase-translation {
  font-size: 26rpx;
  color: #6b7280;
}

/* 同近义词样式 */
.syno-item {
  margin-bottom: 15rpx;
}

.syno-header {
  display: flex;
  gap: 10rpx;
  align-items: baseline;
  margin-bottom: 8rpx;
}

.syno-meaning {
  font-size: 28rpx;
  color: #374151;
}

.syno-words {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-left: 50rpx;
}

.syno-word {
  font-size: 26rpx;
  color: #6366f1;
  background: #eef2ff;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

/* 同根词样式 */
.rel-item {
  margin-bottom: 15rpx;
}

.rel-word-item {
  margin-left: 50rpx;
  margin-bottom: 8rpx;
}

.rel-word {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
  margin-right: 10rpx;
}

.rel-meaning {
  font-size: 26rpx;
  color: #6b7280;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  padding-bottom: env(safe-area-inset-bottom, 0); /* 适配底部安全区域 */
  border-radius: 20rpx;
}

.button-group {
  display: flex;
  gap: 15rpx;
}

.action-button {
  flex: 1;
  padding: 25rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.3s ease;
}

.action-button:active {
  transform: scale(0.98);
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
  font-size: 32rpx;
}

.button-text {
  font-size: 30rpx;
  font-weight: 500;
}

.next-button {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  padding: 25rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.3s ease;
}

.next-button:active {
  transform: scale(0.98);
}

.next-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #ffffff;
}

.next-icon {
  font-size: 30rpx;
  color: #ffffff;
}
</style>
