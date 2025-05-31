<template>
  <view class="container">
    <!-- 顶部进度条 -->
    <view class="progress-bar-container glass-effect">
      <view class="progress-info">
        <text class="progress-text">学习进度: {{ currentProgressText }}</text>
        <text class="time-text">{{ remainingText }}</text>
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
          <view v-if="currentWord.content.word.content.sentence && currentWord.content.word.content.sentence.sentences && currentWord.content.word.content.sentence.sentences.length > 0" class="section-title">例句</view>
          <view v-for="(sentence, index) in currentWord.content.word.content.sentence?.sentences || []" :key="'sentence-'+index" class="example-container">
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

    <!-- 操作按钮 - 优化布局 -->
    <view class="action-buttons glass-effect">
      <view class="button-group">
        <view class="action-button forget" @click="handleForget">
          <text class="button-icon">✗</text>
          <text class="button-text">不认识</text>
        </view>
        <view class="action-button know" @click="handleKnow">
          <text class="button-icon">✓</text>
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
const currentWord = ref(mockWordData); // 当前单词数据
const totalWords = ref(1); // 实际应用中这里会是词库的总单词数
const knownWords = ref([]);
const unknownWords = ref([]);

// 用户状态
const isLoggedIn = ref(false);
const userInfo = ref(null);
const userProgress = ref(null);
const libraryId = ref('');
const startRank = ref(1);
const isReviewModeActive = ref(false); // 存储复习模式状态
const isQuizModeActive = ref(false); // 存储小测验模式状态
const isSortModeActive = ref(false); // 存储排序模式状态
const sortType = ref('default'); // 排序类型
const currentSortIndex = ref(0); // 当前排序索引

// 排序选项（与index.vue保持一致）
const sortOptions = ref([
  { value: 'default', label: '默认顺序' },
  { value: 'alphabetical', label: '字母顺序 (A-Z)' },
  { value: 'reverse', label: '字母倒序 (Z-A)' }
]);

// 计算属性
const isReviewMode = computed(() => {
  console.log('isReviewMode 检查 - isReviewModeActive:', isReviewModeActive.value);
  console.log('isReviewMode 检查 - isQuizModeActive:', isQuizModeActive.value);
  console.log('isReviewMode 检查 - isSortModeActive:', isSortModeActive.value);
  // 复习模式、小测验模式或排序模式都使用相同的逻辑
  return isReviewModeActive.value || isQuizModeActive.value || isSortModeActive.value;
});

const currentProgressText = computed(() => {
  console.log('=== 进度计算调试 ===');
  console.log('isReviewMode:', isReviewMode.value);
  console.log('isSortModeActive:', isSortModeActive.value);
  console.log('currentSortIndex:', currentSortIndex.value);
  console.log('currentWord.reviewIndex:', currentWord.value.reviewIndex);
  console.log('currentWord.wordRank:', currentWord.value.wordRank);
  console.log('totalWords:', totalWords.value);

  if (isSortModeActive.value) {
    // 排序模式：显示排序进度
    const progress = `${currentSortIndex.value + 1}/${totalWords.value}`;
    console.log('排序模式进度:', progress);
    return progress;
  } else if (isReviewMode.value) {
    // 复习模式：显示复习进度
    const reviewIndex = currentWord.value.reviewIndex;
    console.log('复习模式 - reviewIndex:', reviewIndex);

    if (reviewIndex !== undefined && reviewIndex !== null) {
      const progress = `${reviewIndex + 1}/${totalWords.value}`;
      console.log('复习模式进度:', progress);
      return progress;
    } else {
      // 如果reviewIndex还没有设置，显示默认值
      const progress = `1/${totalWords.value}`;
      console.log('复习模式默认进度:', progress);
      return progress;
    }
  } else {
    // 正常学习模式：显示学习进度
    const progress = `${currentWord.value.wordRank}/${totalWords.value}`;
    console.log('正常学习模式进度:', progress);
    return progress;
  }
});

const remainingText = computed(() => {
  if (isSortModeActive.value) {
    // 排序模式：显示剩余数量
    const remaining = totalWords.value - (currentSortIndex.value + 1);
    console.log('排序模式剩余:', remaining);
    return `剩余: ${remaining}个`;
  } else if (isReviewMode.value) {
    // 复习模式：显示剩余复习数量
    const reviewIndex = currentWord.value.reviewIndex;

    if (reviewIndex !== undefined && reviewIndex !== null) {
      const remaining = totalWords.value - (reviewIndex + 1);
      console.log('复习模式剩余:', remaining);
      return `剩余: ${remaining}个`;
    } else {
      // 如果reviewIndex还没有设置，显示默认值
      const remaining = totalWords.value - 1;
      console.log('复习模式默认剩余:', remaining);
      return `剩余: ${remaining}个`;
    }
  } else {
    // 正常学习模式：显示剩余学习数量或已学数量
    if (isLoggedIn.value && userProgress.value && userProgress.value.totalStudied) {
      return `已学: ${userProgress.value.totalStudied}个`;
    } else {
      const remaining = totalWords.value - currentWord.value.wordRank;
      console.log('正常学习模式剩余:', remaining);
      return `剩余: ${remaining}个`;
    }
  }
});

const progressPercentage = computed(() => {
  if (isSortModeActive.value) {
    // 排序模式：使用排序索引计算进度
    return ((currentSortIndex.value + 1) / totalWords.value) * 100;
  } else if (isReviewMode.value) {
    // 复习模式：使用复习索引计算进度
    const reviewIndex = currentWord.value.reviewIndex || 0;
    return ((reviewIndex + 1) / totalWords.value) * 100;
  } else {
    // 正常学习模式：使用wordRank计算进度
    return (currentWord.value.wordRank / totalWords.value) * 100;
  }
});

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

const handleKnow = async () => {
  // 获取单词ID
  const wordId = currentWord.value.content.word.wordId;

  // 标记为认识
  if (wordId && !knownWords.value.includes(wordId)) {
    knownWords.value.push(wordId);
  }

  // 如果是复习模式或小测验模式且用户已登录，更新生疏单词状态为已学习
  if ((isReviewModeActive.value || isQuizModeActive.value) && isLoggedIn.value) {
    try {
      const result = await updateUnknownWordStatus(currentWord.value);
      if (result && result.success) {
        console.log('生疏单词状态已更新为已学习');
        // 显示成功提示
        uni.showToast({
          title: '已标记为认识，状态已更新',
          icon: 'success',
          duration: 800
        });
      } else {
        // 更新失败，但仍然显示基本提示
        uni.showToast({
          title: '已标记为认识',
          icon: 'success',
          duration: 500
        });
      }
    } catch (error) {
      console.error('更新生疏单词状态时出错:', error);
      // 出错时显示基本提示
      uni.showToast({
        title: '已标记为认识',
        icon: 'success',
        duration: 500
      });
    }
  } else {
    // 正常学习模式或用户未登录，显示基本提示
    uni.showToast({
      title: '已标记为认识',
      icon: 'success',
      duration: 500
    });
  }

  // 自动翻到下一个
  nextWord();
};

const handleForget = () => {
  // 获取单词ID
  const wordId = currentWord.value.content.word.wordId;

  // 标记为不认识
  if (wordId && !unknownWords.value.includes(wordId)) {
    unknownWords.value.push(wordId);
  }

  // 如果用户已登录，保存未掌握单词
  if (isLoggedIn.value) {
    // 保存到未掌握单词表
    saveUnknownWord(currentWord.value);
  }

  // 显示提示（简短提示）
  uni.showToast({
    title: '已标记为不认识',
    icon: 'none',
    duration: 800
  });

  // 立即滚动到释义部分，无延迟
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 200  // 减少滚动动画时间
  });

  // 给用户一点时间查看释义，然后自动进入下一个单词
  // 使用较短的延迟，避免用户等待太久
  setTimeout(() => {
    nextWord();
  }, 1500); // 1.5秒后自动进入下一个单词
};

const nextWord = async () => {
  console.log("nextWord", currentWord.value.wordRank, totalWords.value);

  // 获取当前页面
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  const currentLibraryId = options.libraryId || libraryId.value;

  if (isSortModeActive.value) {
    // 排序模式 - 获取下一个排序单词
    try {
      // 使用更简洁的加载提示
      uni.showLoading({
        title: '加载中...',
        mask: true
      });

      // 检查是否还有下一个单词
      if (currentSortIndex.value + 1 < totalWords.value) {
        // 有下一个单词，获取下一个单词
        const nextIndex = currentSortIndex.value + 1;

        console.log('排序模式 - 获取下一个单词，索引:', nextIndex);

        // 调用云函数获取下一个排序单词
        const res = await wx.cloud.callFunction({
          name: 'getWordsBySorting',
          data: {
            bookId: currentLibraryId,
            sortType: sortType.value,
            currentIndex: nextIndex,
            saveProgress: true
          }
        });

        uni.hideLoading();

        if (res.result.code === 0 && res.result.data && res.result.data.word) {
          // 更新当前单词和索引
          currentWord.value = res.result.data.word;
          currentSortIndex.value = nextIndex;

          // 更新音频源
          updateAudioSources();

          console.log('成功加载下一个排序单词，新索引:', nextIndex);
        } else {
          uni.showToast({
            title: '获取单词失败',
            icon: 'none'
          });
        }
      } else {
        // 没有更多单词
        uni.hideLoading();
        uni.showToast({
          title: '恭喜你，学习完成！',
          icon: 'success',
          duration: 2000
        });

        // 延迟返回
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
      }
    } catch (err) {
      console.error('获取下一个排序单词失败:', err);
      uni.hideLoading();
      uni.showToast({
        title: '获取下一个单词失败',
        icon: 'none'
      });
    }
  } else if (isReviewModeActive.value || isQuizModeActive.value) {
    // 复习模式或小测验模式 - 获取下一个生疏单词
    try {
      // 使用更简洁的加载提示
      uni.showLoading({
        title: '加载中...',
        mask: true
      });

      // 获取当前单词在生疏单词列表中的索引
      const currentIndex = currentWord.value.reviewIndex || 0;
      const reviewWordsList = currentWord.value.reviewWordsList || [];

      console.log('复习模式 - 当前索引:', currentIndex, '总数:', reviewWordsList.length);

      // 检查是否还有下一个生疏单词
      if (currentIndex + 1 < reviewWordsList.length) {
        // 有下一个生疏单词
        const nextWordData = reviewWordsList[currentIndex + 1];

        console.log('获取下一个生疏单词:', nextWordData);

        // 获取下一个单词的详细信息
        // 在小测验模式下，使用单词自己的bookId，因为可能来自不同词库
        const wordBookId = isQuizModeActive.value ? nextWordData.bookId : currentLibraryId;
        fetchWordDetail(wordBookId, nextWordData.wordRank).then(result => {
          uni.hideLoading();
          if (result.success) {
            // 设置复习索引
            currentWord.value.reviewIndex = currentIndex + 1;
            // 保持生疏单词列表
            currentWord.value.reviewWordsList = reviewWordsList;
            console.log('成功加载下一个生疏单词，新索引:', currentIndex + 1);
          } else {
            uni.showToast({
              title: '获取单词详情失败',
              icon: 'none'
            });
          }
        });
      } else {
        // 没有更多生疏单词
        uni.hideLoading();
        const completionMessage = isQuizModeActive.value ? '恭喜你，测验完成！' : '恭喜你，复习完成！';
        uni.showToast({
          title: completionMessage,
          icon: 'success',
          duration: 2000
        });

        // 延迟返回
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
      }
    } catch (err) {
      console.error('获取下一个生疏单词失败:', err);
      uni.hideLoading();
      uni.showToast({
        title: '获取下一个单词失败',
        icon: 'none'
      });
    }
  } else {
    // 正常学习模式
    // 检查是否还有更多单词可以加载
    if (currentWord.value.wordRank < totalWords.value) {
      // 获取下一个单词的序号
      const nextWordRank = currentWord.value.wordRank + 1;

      if (currentLibraryId) {
        // 使用更简洁的加载提示
        uni.showLoading({
          title: '加载中...',
          mask: true  // 添加遮罩，防止用户多次点击
        });

        // 获取下一个单词
        fetchWordData(currentLibraryId, nextWordRank)
          .then(result => {
            uni.hideLoading();

            if (result.success) {
              // 单词已在 fetchWordData 中更新
              console.log("成功加载下一个单词");
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
  }
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

// 获取单个单词详细数据（专用于复习模式）
const fetchWordDetail = (libraryId, wordRank) => {
  console.log('获取单词详细数据:', libraryId, '单词序号:', wordRank);

  // 调用云函数获取单词详细信息
  return wx.cloud.callFunction({
    name: 'getWordDetail',
    data: {
      bookId: libraryId,
      wordRank: wordRank
    }
  })
  .then(res => {
    console.log("获取单词详细数据结果:", res.result);

    if (res.result.code === 0 && res.result.data && res.result.data.word) {
      // 保存复习相关的数据
      const reviewIndex = currentWord.value.reviewIndex;
      const reviewWordsList = currentWord.value.reviewWordsList;

      // 更新当前单词数据
      currentWord.value = res.result.data.word;

      // 恢复复习相关的数据
      if (reviewIndex !== undefined) {
        currentWord.value.reviewIndex = reviewIndex;
      }
      if (reviewWordsList) {
        currentWord.value.reviewWordsList = reviewWordsList;
      }

      console.log("更新当前单词:", currentWord.value);

      // 更新音频源
      updateAudioSources();

      return { success: true, word: res.result.data.word };
    } else {
      console.error("获取单词详细数据失败", res.result.message);
      return { success: false, error: res.result.message };
    }
  })
  .catch(err => {
    console.error("调用获取单词详细数据云函数失败", err);
    return { success: false, error: err.message };
  });
};

// 获取单个单词数据
const fetchWordData = (libraryId, wordRank = 1, isRetry = false) => {
  // 从云函数获取单词数据
  console.log('获取单词数据:', libraryId, '单词序号:', wordRank, isRetry ? '(重试)' : '');

  if (!isRetry) {
    // 显示简洁的加载提示，添加遮罩防止用户多次点击
    uni.showLoading({
      title: '加载中...',
      mask: true
    });
  }

  // 调用云函数获取单个单词
  return wx.cloud.callFunction({
    name: 'getWordsByBookId',
    data: {
      bookId: libraryId,
      wordRank: wordRank,
      wordCount: totalWords.value,
      saveProgress: !isSortModeActive.value // 排序模式下不保存到正常学习进度
    }
  })
  .then(res => {
    console.log("获取单词数据结果:", res.result);

    if (!isRetry) {
      uni.hideLoading();
    }

    if (res.result.code === 0 && res.result.data) {
      // 如果返回了用户进度信息，更新本地进度
      if (res.result.data.userProgress) {
        userProgress.value = res.result.data.userProgress;
        console.log("更新用户进度:", userProgress.value);
      }

      // 如果成功获取到单词
      if (res.result.data.word) {
        // 直接更新当前单词
        currentWord.value = res.result.data.word;
        console.log("更新当前单词:", currentWord.value);

        // 更新音频源
        updateAudioSources();

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
        currentWord.value = mockWordData;
        totalWords.value = 1;
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
      currentWord.value = mockWordData;
      totalWords.value = 1;
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
    currentWord.value = mockWordData;
    totalWords.value = 1;
    return { success: false, error: err.message };
  });
};

// 检查用户登录状态
const checkLoginStatus = () => {
  // 从本地存储获取用户信息
  const userInfoStorage = uni.getStorageSync('userInfo');
  if (userInfoStorage) {
    try {
      userInfo.value = JSON.parse(userInfoStorage);
      isLoggedIn.value = true;
      console.log('用户已登录:', userInfo.value);
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

// 用户学习进度相关逻辑已整合到 getWordsByBookId 云函数中

// 更新生疏单词状态为已学习
const updateUnknownWordStatus = async (word) => {
  if (!isLoggedIn.value) {
    console.log('用户未登录，不更新生疏单词状态');
    return;
  }

  try {
    // 获取单词ID，优先使用wordId，如果没有则使用headWord
    const wordId = word.content.word.wordId || word.headWord;

    // 确保单词序号有效
    if (!word.wordRank || word.wordRank < 1) {
      console.error('单词序号无效，不更新生疏单词状态');
      return;
    }

    // 获取bookId：在小测验模式下从reviewWordsList中获取，否则使用libraryId
    let bookId = libraryId.value;
    if (isQuizModeActive.value && word.reviewWordsList && word.reviewIndex !== undefined) {
      const currentWordData = word.reviewWordsList[word.reviewIndex];
      if (currentWordData && currentWordData.bookId) {
        bookId = currentWordData.bookId;
      }
    }

    if (!bookId) {
      console.error('无法获取词库ID，不更新生疏单词状态');
      return;
    }

    console.log('更新生疏单词状态为已学习:', {
      bookId: bookId,
      wordId: wordId,
      wordRank: word.wordRank
    });

    const res = await wx.cloud.callFunction({
      name: 'updateUnknownWordStatus',
      data: {
        bookId: bookId,
        wordId: wordId,
        wordRank: word.wordRank,
        status: 'learned' // 设置状态为已学习
      }
    });

    if (res.result.code === 0) {
      console.log('更新生疏单词状态成功:', res.result.data);
      return { success: true };
    } else {
      console.error('更新生疏单词状态失败:', res.result.message);
      return { success: false, error: res.result.message };
    }
  } catch (error) {
    console.error('更新生疏单词状态失败:', error);
    return { success: false, error: error.message };
  }
};

// 保存未掌握的单词
const saveUnknownWord = async (word) => {
  if (!isLoggedIn.value || !libraryId.value) {
    console.log('用户未登录或词库ID为空，不保存未掌握单词');
    return;
  }

  try {
    // 获取单词ID，优先使用wordId，如果没有则使用headWord
    const wordId = word.content.word.wordId || word.headWord;

    // 确保单词序号有效
    if (!word.wordRank || word.wordRank < 1) {
      console.error('单词序号无效，不保存未掌握单词');
      return;
    }

    console.log('保存未掌握单词:', {
      bookId: libraryId.value,
      wordId: wordId,
      wordRank: word.wordRank
    });

    const res = await wx.cloud.callFunction({
      name: 'saveUnknownWord',
      data: {
        bookId: libraryId.value,
        wordId: wordId,
        wordRank: word.wordRank
      }
    });

    if (res.result.code === 0) {
      console.log('保存未掌握单词成功:', res.result.data);

      // 可以在这里更新本地未掌握单词列表，方便后续使用
      // 例如：添加到本地未掌握单词列表中，避免重复添加
      if (!unknownWords.value.includes(wordId)) {
        unknownWords.value.push(wordId);
      }
    } else {
      console.error('保存未掌握单词失败:', res.result.message);
    }
  } catch (error) {
    console.error('保存未掌握单词失败:', error);
  }
};

// 获取词库数据（初始化）
const fetchWordLibrary = (bookId, startWordRank = 1) => {
  // 保存词库ID
  libraryId.value = bookId;

  // 获取第一个单词
  fetchWordData(bookId, startWordRank);
};

// onLoad 生命周期钩子 - 页面加载时获取参数
onLoad(async (options) => {
  console.log('study.vue onLoad 获取到的参数:', options);

  // 获取词库ID、名称和单词总数
  const bookId = options.libraryId;
  const libraryName = options.libraryName ? decodeURIComponent(options.libraryName) : '单词学习';
  const wordCount = options.wordCount ? parseInt(options.wordCount) : 0;
  const isReview = options.isReview === 'true'; // 是否是复习模式
  const isQuiz = options.isQuiz === 'true'; // 是否是小测验模式
  const quizCount = options.quizCount ? parseInt(options.quizCount) : 50; // 小测验题数
  const sortTypeParam = options.sortType || 'default'; // 排序类型

  console.log('解析后的参数:', { bookId, libraryName, wordCount, isReview, isQuiz, quizCount, sortTypeParam });

  // 设置模式状态
  isReviewModeActive.value = isReview;
  isQuizModeActive.value = isQuiz;
  isSortModeActive.value = sortTypeParam !== 'default';
  sortType.value = sortTypeParam;

  console.log('设置复习模式状态:', isReviewModeActive.value);
  console.log('设置小测验模式状态:', isQuizModeActive.value);
  console.log('设置排序模式状态:', isSortModeActive.value);
  console.log('设置排序类型:', sortType.value);

  // 设置总单词数
  if (wordCount > 0) {
    totalWords.value = wordCount;
  }

  // 检查用户登录状态
  checkLoginStatus();

  if (isSortModeActive.value && bookId) {
    // 排序模式 - 获取排序后的单词（支持断点续学）
    console.log('排序模式 - 获取排序后的单词，排序类型:', sortType.value);

    // 保存词库ID到响应式变量
    libraryId.value = bookId;

    // 显示加载提示
    uni.showLoading({
      title: '加载单词中...',
      mask: true
    });

    try {
      let startIndex = 0;

      // 如果用户已登录，先获取排序学习进度
      if (isLoggedIn.value) {
        try {
          const progressRes = await wx.cloud.callFunction({
            name: 'getSortLearningProgress',
            data: {
              bookId: bookId,
              sortType: sortType.value
            }
          });

          console.log('获取排序学习进度结果:', progressRes.result);

          if (progressRes.result.code === 0 && progressRes.result.data && progressRes.result.data.hasProgress) {
            startIndex = progressRes.result.data.currentSortIndex || 0;
            console.log('找到排序学习进度，从索引开始:', startIndex);

            // 显示续学提示
            if (startIndex > 0) {
              uni.showToast({
                title: `继续上次学习进度`,
                icon: 'none',
                duration: 1500
              });
            }
          }
        } catch (progressErr) {
          console.error('获取排序学习进度失败:', progressErr);
          // 进度获取失败不影响学习，从头开始
        }
      }

      // 调用云函数获取排序后的单词
      const res = await wx.cloud.callFunction({
        name: 'getWordsBySorting',
        data: {
          bookId: bookId,
          sortType: sortType.value,
          currentIndex: startIndex,
          saveProgress: true
        }
      });

      console.log('获取排序单词结果:', res.result);

      if (res.result.code === 0 && res.result.data && res.result.data.word) {
        // 更新当前单词和相关数据
        currentWord.value = res.result.data.word;
        currentSortIndex.value = startIndex;
        totalWords.value = res.result.data.totalWords;

        // 更新音频源
        updateAudioSources();

        console.log('成功加载排序单词，索引:', startIndex);

        // 设置页面标题
        const sortLabel = sortOptions.value.find(opt => opt.value === sortType.value)?.label || '排序学习';
        uni.setNavigationBarTitle({
          title: `${libraryName} - ${sortLabel}`
        });
      } else {
        // 获取失败
        uni.showToast({
          title: res.result.message || '获取单词失败',
          icon: 'none',
          duration: 2000
        });

        // 延迟返回
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
      }
    } catch (err) {
      console.error('获取排序单词失败:', err);
      uni.showToast({
        title: '获取单词失败',
        icon: 'none'
      });

      // 延迟返回
      setTimeout(() => {
        uni.navigateBack();
      }, 2000);
    } finally {
      uni.hideLoading();
    }
  } else if (isQuiz) {
    // 小测验模式 - 获取随机错题
    console.log('小测验模式 - 获取随机错题，题数:', quizCount);

    // 显示加载提示
    uni.showLoading({
      title: '准备测验题目...',
      mask: true
    });

    try {
      // 调用云函数获取随机错题
      const res = await wx.cloud.callFunction({
        name: 'getRandomQuizWords',
        data: {
          count: quizCount
        }
      });

      console.log('获取随机测验单词结果:', res.result);

      if (res.result.code === 0 && res.result.data && res.result.data.words.length > 0) {
        // 保存测验单词列表到全局变量
        currentWord.value.reviewWordsList = res.result.data.words;

        // 设置总单词数为测验题数
        totalWords.value = res.result.data.totalCount;

        // 先设置复习索引为0，再获取第一个测验单词的详细信息
        currentWord.value.reviewIndex = 0;

        const firstWord = res.result.data.words[0];
        fetchWordDetail(firstWord.bookId, firstWord.wordRank).then(result => {
          uni.hideLoading();
          if (result.success) {
            console.log('成功加载第一个测验单词，复习索引:', currentWord.value.reviewIndex);
          } else {
            uni.showToast({
              title: '获取单词详情失败',
              icon: 'none'
            });
          }
        });

        // 设置页面标题
        uni.setNavigationBarTitle({
          title: `随机小测验 (${quizCount}题)`
        });
      } else {
        // 没有可用的错题
        uni.hideLoading();
        uni.showToast({
          title: res.result.message || '没有可用的错题',
          icon: 'none',
          duration: 2000
        });

        // 延迟返回
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
      }
    } catch (err) {
      console.error('获取随机测验单词失败:', err);
      uni.hideLoading();
      uni.showToast({
        title: '获取测验题目失败',
        icon: 'none'
      });

      // 延迟返回
      setTimeout(() => {
        uni.navigateBack();
      }, 2000);
    }
  } else if (bookId) {
    // 保存词库ID到响应式变量，方便后续使用
    libraryId.value = bookId;

    if (isReview) {
      // 复习模式 - 获取生疏单词
      console.log('复习模式 - 获取生疏单词');

      // 显示加载提示
      uni.showLoading({
        title: '加载生疏单词...',
        mask: true
      });

      try {
        // 调用云函数获取该词库的生疏单词列表
        const res = await wx.cloud.callFunction({
          name: 'getUnknownWords',
          data: {
            bookId: bookId,
            status: 'unknown'
          }
        });

        console.log('获取生疏单词列表结果:', res.result);

        if (res.result.code === 0 && res.result.data && res.result.data.words.length > 0) {
          // 保存生疏单词列表到全局变量，方便后续使用
          currentWord.value.reviewWordsList = res.result.data.words;

          // 设置总单词数为生疏单词总数
          totalWords.value = res.result.data.total;

          // 先设置复习索引为0，再获取第一个生疏单词的详细信息
          currentWord.value.reviewIndex = 0;

          const firstWord = res.result.data.words[0];
          fetchWordDetail(bookId, firstWord.wordRank).then(result => {
            uni.hideLoading();
            if (result.success) {
              console.log('成功加载第一个生疏单词，复习索引:', currentWord.value.reviewIndex);
            } else {
              uni.showToast({
                title: '获取单词详情失败',
                icon: 'none'
              });
            }
          });

          // 设置页面标题
          uni.setNavigationBarTitle({
            title: `${libraryName} - 生疏词复习`
          });
        } else {
          // 没有生疏单词
          uni.hideLoading();
          uni.showToast({
            title: '该词库没有生疏单词需要复习',
            icon: 'none',
            duration: 2000
          });

          // 延迟返回
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }
      } catch (err) {
        console.error('获取生疏单词失败:', err);
        uni.hideLoading();
        uni.showToast({
          title: '获取生疏单词失败',
          icon: 'none'
        });
      }
    } else {
      // 正常学习模式
      // 从第一个单词开始，云函数会自动获取用户进度
      console.log('从第一个单词开始，云函数会自动获取用户进度');
      startRank.value = 1;

      console.log('开始获取词库数据, bookId:', bookId);
      // 获取词库数据，云函数会自动获取用户进度
      fetchWordLibrary(bookId, startRank.value);

      // 设置页面标题
      if (libraryName) {
        uni.setNavigationBarTitle({
          title: libraryName
        });
      }
    }
  } else {
    console.warn('未指定词库ID，使用示例数据');
    // 没有传入词库ID，使用默认数据
    totalWords.value = 1;
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
  transition: all 0.2s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.action-button:active {
  transform: scale(0.95);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.action-button.forget {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.action-button.know {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.button-icon {
  font-size: 36rpx;
  font-weight: bold;
}

.button-text {
  font-size: 30rpx;
  font-weight: 500;
}

.next-button {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 25rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: all 0.2s ease;
  box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.3);
  margin-top: 10rpx;
}

.next-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 6rpx rgba(99, 102, 241, 0.2);
}

.next-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.next-icon {
  font-size: 32rpx;
  color: #ffffff;
}
</style>
