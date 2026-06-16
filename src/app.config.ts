export default defineAppConfig({
  pages: [
    'pages/square/index',
    'pages/publish/index',
    'pages/booking/index',
    'pages/message/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/publish-success/index',
    'pages/leaderboard/index',
    'pages/ranking/index',
    'pages/report/index',
    'pages/credit/index',
    'pages/appeal/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF8A3D',
    navigationBarTitleText: '社区互助',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF9F2'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF8A3D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/square/index',
        text: '广场'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布'
      },
      {
        pagePath: 'pages/booking/index',
        text: '预约'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
