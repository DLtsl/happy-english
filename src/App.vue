<script>
// const db = wx.cloud.database()
export default {
  onLaunch: function () {
    console.log('App Launch')
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-9ggeupp1c239ae4f',
      traceUser: true,
    })

    // 自动登录
    this.autoLogin()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  beforeMount() {
    console.log("App Mounted")
  },
  methods: {
    // 自动登录
    autoLogin() {
      console.log('尝试自动登录')

      // 检查本地存储中是否有用户信息
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        console.log('本地存储中有用户信息，尝试获取最新用户数据')

        // 调用云函数获取最新用户信息
        wx.cloud.callFunction({
          name: 'getUnionId'
        })
        .then(res => {
          console.log("获取用户数据", res.result)

          if (res.result.code === 0 && res.result.data) {
            // 更新本地存储
            uni.setStorageSync('userInfo', JSON.stringify(res.result.data))
            console.log('自动登录成功')
          } else {
            console.log('自动登录失败，需要重新登录')
            // 清除本地存储的用户信息
            uni.removeStorageSync('userInfo')
          }
        })
        .catch(err => {
          console.error('自动登录失败', err)
          // 清除本地存储的用户信息
          uni.removeStorageSync('userInfo')
        })
      } else {
        console.log('本地存储中没有用户信息，需要登录')
      }
    },

    // 微信登录
    wxLogin() {
      return new Promise((resolve, reject) => {
        // 获取微信登录凭证
        wx.login({
          success: (res) => {
            if (res.code) {
              console.log('微信登录成功，code:', res.code)
              resolve(res.code)
            } else {
              console.error('微信登录失败', res)
              reject(new Error('微信登录失败'))
            }
          },
          fail: (err) => {
            console.error('微信登录失败', err)
            reject(err)
          }
        })
      })
    }
  }
}
</script>

<style>
/*每个页面公共css */
</style>
