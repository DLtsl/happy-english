<template>
  <view class="container">
    <!-- 用户信息卡片（登录/未登录通用） -->
    <view class="profile-card glass-effect">
      <view class="avatar-container">
        <!-- 头像选择按钮 -->
        <button class="avatar-button" open-type="chooseAvatar" @chooseavatar="onChooseAvatar" v-if="isLoggedIn">
          <image class="avatar" :src="userInfo.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
          <view class="avatar-edit-icon">✏️</view>
        </button>
        <!-- 未登录状态显示默认头像 -->
        <image class="avatar" src="/static/default-avatar.png" mode="aspectFill" v-else></image>
      </view>

      <view class="user-info">
        <!-- 已登录状态显示用户信息 -->
        <template v-if="isLoggedIn">
          <!-- 昵称编辑 -->
          <view class="nickname-container" @click="showNicknameEdit = true">
            <text class="username">{{ userInfo.nickName }}</text>
            <text class="edit-icon">✏️</text>
          </view>
          <text class="user-id">ID: {{ userInfo._id }}</text>
        </template>

        <!-- 未登录状态显示登录按钮 -->
        <template v-else>
          <text class="login-text">登录后体验更多功能</text>
          <button class="login-button" @click="handleLogin">微信登录</button>
        </template>
      </view>
    </view>

    <!-- 昵称编辑弹窗 -->
    <view class="nickname-modal" v-if="showNicknameEdit">
      <view class="nickname-modal-content glass-effect">
        <text class="nickname-modal-title">修改昵称</text>
        <input class="nickname-input" type="nickname" v-model="editingNickname" placeholder="请输入昵称" />
        <view class="nickname-modal-buttons">
          <button class="nickname-modal-button cancel" @click="showNicknameEdit = false">取消</button>
          <button class="nickname-modal-button confirm" @click="saveNickname">确定</button>
        </view>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="settings-section glass-effect">
      <text class="section-title">设置</text>

      <!-- 学习设置 -->
      <view class="setting-group">
        <view class="setting-header">
          <text class="group-title">学习设置</text>
        </view>

        <view class="setting-item" @click="editDailyGoal">
          <text class="setting-icon">🎯</text>
          <text class="setting-label">每日学习目标</text>
          <text class="setting-value">{{ userInfo.dailyGoal || 50 }}词</text>
          <text class="setting-arrow">›</text>
        </view>

        <view class="setting-item">
          <text class="setting-icon">🔔</text>
          <text class="setting-label">学习提醒</text>
          <switch class="setting-switch" color="#6366f1" :checked="reminderEnabled" @change="toggleReminder"></switch>
        </view>
      </view>

      <!-- 通用设置 -->
      <view class="setting-group">
        <view class="setting-header">
          <text class="group-title">通用设置</text>
        </view>

        <view class="setting-item">
          <text class="setting-icon">🌙</text>
          <text class="setting-label">深色模式</text>
          <switch class="setting-switch" color="#6366f1" :checked="darkModeEnabled" @change="toggleDarkMode"></switch>
        </view>

        <view class="setting-item">
          <text class="setting-icon">🔊</text>
          <text class="setting-label">声音效果</text>
          <switch class="setting-switch" color="#6366f1" :checked="soundEnabled" @change="toggleSound"></switch>
        </view>

        <view class="setting-item">
          <text class="setting-icon">📱</text>
          <text class="setting-label">关于我们</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-button" @click="handleLogout" v-if="isLoggedIn">
        <text class="logout-text">退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 用户信息
const userInfo = ref({});
const isLoggedIn = computed(() => userInfo.value && userInfo.value._id);

// 昵称编辑
const showNicknameEdit = ref(false);
const editingNickname = ref('');

// 设置状态
const reminderEnabled = ref(true);
const darkModeEnabled = ref(false);
const soundEnabled = ref(true);

// 从用户信息中获取设置状态
const initSettings = () => {
  if (userInfo.value) {
    reminderEnabled.value = userInfo.value.reminderEnabled !== undefined ? userInfo.value.reminderEnabled : true;
    darkModeEnabled.value = userInfo.value.darkModeEnabled !== undefined ? userInfo.value.darkModeEnabled : false;
    soundEnabled.value = userInfo.value.soundEnabled !== undefined ? userInfo.value.soundEnabled : true;
  }
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    uni.showLoading({ title: '加载中...' });

    // 从本地存储获取用户信息
    const userInfoStorage = uni.getStorageSync('userInfo');
    if (userInfoStorage) {
      userInfo.value = JSON.parse(userInfoStorage);
    }

    // 调用云函数获取最新用户信息
    const res = await wx.cloud.callFunction({
      name: 'getUnionId'
    });

    console.log('获取用户信息', res.result);

    if (res.result.code === 0 && res.result.data) {
      userInfo.value = res.result.data;
      // 保存到本地存储
      uni.setStorageSync('userInfo', JSON.stringify(res.result.data));
      // 初始化设置状态
      initSettings();
      // 初始化昵称编辑
      editingNickname.value = res.result.data.nickName || '';
    }

    uni.hideLoading();
  } catch (error) {
    console.error('获取用户信息失败', error);
    uni.hideLoading();
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    });
  }
};

// 处理登录
const handleLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' });

    // 直接获取微信登录凭证，不再使用 getUserProfile
    wx.login({
      success: async (loginRes) => {
        if (loginRes.code) {
          console.log('微信登录成功，code:', loginRes.code);

          // 调用云函数，传入登录凭证
          const res = await wx.cloud.callFunction({
            name: 'getUnionId',
            data: {
              code: loginRes.code
            }
          });

          console.log('登录结果', res.result);

          if (res.result.code === 0 && res.result.data) {
            // 更新本地用户信息
            uni.setStorageSync('userInfo', JSON.stringify(res.result.data));
            getUserInfo();

            // 如果用户信息不完整，提示用户同步微信资料
            if (!res.result.data.nickName || res.result.data.nickName === '英语学习者') {
              uni.showModal({
                title: '提示',
                content: '建议同步微信资料以获得更好的体验',
                confirmText: '去同步',
                cancelText: '稍后再说',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 用户点击确定，跳转到同步资料
                    syncUserInfo();
                  } else {
                    uni.showToast({
                      title: '登录成功',
                      icon: 'success'
                    });
                  }
                }
              });
            } else {
              uni.showToast({
                title: '登录成功',
                icon: 'success'
              });
            }
          } else {
            uni.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }

          uni.hideLoading();
        } else {
          console.error('微信登录失败', loginRes);
          uni.hideLoading();
          uni.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('微信登录失败', err);
        uni.hideLoading();
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  } catch (error) {
    console.error('登录失败', error);
    uni.hideLoading();
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    });
  }
};

// 处理退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储的用户信息
        uni.removeStorageSync('userInfo');
        userInfo.value = {};

        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      }
    }
  });
};

// 选择头像
const onChooseAvatar = async (e) => {
  const { avatarUrl } = e.detail;
  console.log('用户选择的头像:', avatarUrl);

  // 更新头像
  userInfo.value.avatarUrl = avatarUrl;

  // 保存到云数据库
  if (isLoggedIn.value) {
    try {
      uni.showLoading({ title: '保存中...' });

      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            avatarUrl: avatarUrl
          }
        }
      });

      if (res.result.code === 0) {
        // 更新本地存储
        const updatedUserInfo = JSON.parse(uni.getStorageSync('userInfo') || '{}');
        updatedUserInfo.avatarUrl = avatarUrl;
        uni.setStorageSync('userInfo', JSON.stringify(updatedUserInfo));

        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      } else {
        uni.showToast({
          title: '头像更新失败',
          icon: 'none'
        });
      }

      uni.hideLoading();
    } catch (error) {
      console.error('保存头像失败', error);
      uni.hideLoading();
      uni.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
};

// 保存昵称
const saveNickname = async () => {
  if (!editingNickname.value.trim()) {
    uni.showToast({
      title: '昵称不能为空',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({ title: '保存中...' });

    // 保存到云数据库
    const res = await wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: {
          nickName: editingNickname.value
        }
      }
    });

    if (res.result.code === 0) {
      // 更新本地数据
      userInfo.value.nickName = editingNickname.value;

      // 更新本地存储
      const updatedUserInfo = JSON.parse(uni.getStorageSync('userInfo') || '{}');
      updatedUserInfo.nickName = editingNickname.value;
      uni.setStorageSync('userInfo', JSON.stringify(updatedUserInfo));

      // 关闭弹窗
      showNicknameEdit.value = false;

      uni.showToast({
        title: '昵称更新成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: '昵称更新失败',
        icon: 'none'
      });
    }

    uni.hideLoading();
  } catch (error) {
    console.error('保存昵称失败', error);
    uni.hideLoading();
    uni.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    });
  }
};

// 编辑每日学习目标
const editDailyGoal = () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }

  uni.showModal({
    title: '每日学习目标',
    editable: true,
    placeholderText: '请输入每日学习单词数量（10-100）',
    success: async (res) => {
      if (res.confirm) {
        const dailyGoal = parseInt(res.content || '50');

        if (isNaN(dailyGoal) || dailyGoal < 10 || dailyGoal > 100) {
          uni.showToast({
            title: '请输入10-100之间的数字',
            icon: 'none'
          });
          return;
        }

        try {
          uni.showLoading({ title: '保存中...' });

          // 保存到云数据库
          const updateRes = await wx.cloud.callFunction({
            name: 'updateUserInfo',
            data: {
              userInfo: {
                dailyGoal: dailyGoal
              }
            }
          });

          if (updateRes.result.code === 0) {
            // 更新本地数据
            userInfo.value.dailyGoal = dailyGoal;

            // 更新本地存储
            const updatedUserInfo = JSON.parse(uni.getStorageSync('userInfo') || '{}');
            updatedUserInfo.dailyGoal = dailyGoal;
            uni.setStorageSync('userInfo', JSON.stringify(updatedUserInfo));

            uni.showToast({
              title: '目标设置成功',
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: '设置失败',
              icon: 'none'
            });
          }

          uni.hideLoading();
        } catch (error) {
          console.error('保存学习目标失败', error);
          uni.hideLoading();
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 切换提醒设置
const toggleReminder = async (e) => {
  reminderEnabled.value = e.detail.value;

  // 显示提示
  uni.showToast({
    title: reminderEnabled.value ? '已开启学习提醒' : '已关闭学习提醒',
    icon: 'none'
  });

  // 保存设置到云数据库
  if (isLoggedIn.value) {
    try {
      await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            reminderEnabled: reminderEnabled.value
          }
        }
      });
    } catch (error) {
      console.error('保存设置失败', error);
    }
  }
};

// 切换深色模式
const toggleDarkMode = async (e) => {
  darkModeEnabled.value = e.detail.value;

  // 显示提示
  uni.showToast({
    title: darkModeEnabled.value ? '已开启深色模式' : '已关闭深色模式',
    icon: 'none'
  });

  // 保存设置到云数据库
  if (isLoggedIn.value) {
    try {
      await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            darkModeEnabled: darkModeEnabled.value
          }
        }
      });
    } catch (error) {
      console.error('保存设置失败', error);
    }
  }
};

// 切换声音效果
const toggleSound = async (e) => {
  soundEnabled.value = e.detail.value;

  // 显示提示
  uni.showToast({
    title: soundEnabled.value ? '已开启声音效果' : '已关闭声音效果',
    icon: 'none'
  });

  // 保存设置到云数据库
  if (isLoggedIn.value) {
    try {
      await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            soundEnabled: soundEnabled.value
          }
        }
      });
    } catch (error) {
      console.error('保存设置失败', error);
    }
  }
};

// 页面加载时获取用户信息
onMounted(() => {
  getUserInfo();
});
</script>

<style>
.container {
  padding: 30rpx;
  background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
  min-height: 100vh;
}

/* 玻璃效果 */
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin-bottom: 30rpx;
}

/* 用户信息卡片 */
.profile-card, .login-card {
  padding: 40rpx;
  display: flex;
  align-items: center;
}

.avatar-container, .login-avatar {
  margin-right: 30rpx;
  position: relative;
}

.avatar-button {
  padding: 0;
  margin: 0;
  background: transparent;
  line-height: 1;
  position: relative;
}

.avatar-button::after {
  border: none;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.8);
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.1);
}

.user-info {
  flex: 1;
}

.nickname-container {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-right: 10rpx;
}

.edit-icon {
  font-size: 24rpx;
  color: #999;
}

.user-id {
  font-size: 24rpx;
  color: #999;
}

/* 昵称编辑弹窗 */
.nickname-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.nickname-modal-content {
  width: 80%;
  padding: 40rpx;
  border-radius: 20rpx;
}

.nickname-modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}

.nickname-input {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

.nickname-modal-buttons {
  display: flex;
  justify-content: space-between;
}

.nickname-modal-button {
  flex: 1;
  margin: 0 10rpx;
  border-radius: 10rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
  text-align: center;
}

.nickname-modal-button.cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.nickname-modal-button.confirm {
  background: #6366f1;
  color: white;
}

/* 登录相关样式 */
.login-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.login-button {
  background: #6366f1;
  color: white;
  border-radius: 50rpx;
  padding: 15rpx 40rpx;
  font-size: 28rpx;
  border: none;
  margin-top: 10rpx;
  line-height: 1.5;
}

/* 设置部分标题 */
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

/* 设置部分 */
.settings-section {
  padding: 30rpx;
}

.setting-group {
  margin-bottom: 40rpx;
}

.setting-header {
  margin-bottom: 20rpx;
}

.group-title {
  font-size: 28rpx;
  color: #666;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  margin-right: 20rpx;
  font-size: 36rpx;
}

.setting-label {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.setting-value {
  font-size: 28rpx;
  color: #999;
  margin-right: 10rpx;
}

.setting-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.setting-switch {
  transform: scale(0.8);
}

/* 退出登录按钮 */
.logout-button {
  margin-top: 40rpx;
  padding: 30rpx 0;
  text-align: center;
  border-radius: 10rpx;
  background: rgba(255, 59, 48, 0.1);
}

.logout-text {
  color: #ff3b30;
  font-size: 28rpx;
}
</style>
