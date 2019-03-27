import wxRequest from './utils/wxRequest/wxRequest.js';
require('./utils/wxRequest/config');
//app.js
App({

    wxRequest, // 放入全局变量

    globalData: {
        appid: 'wx31626473fac31e9d'
    },

    onLaunch () {
        wxRequest.getToken().then(res => {
            // 由于在 successTOKEN 已经对 token 成功进行处理了，这里就不进行处理了
            if (this.getTokenCallback) { // 由于 getToken 是异步的，在这里给它一个回调函数，避免页面 onLoad 时获取不到 token 数据
                this.getTokenCallback(res);
            }
        });
    }
});
