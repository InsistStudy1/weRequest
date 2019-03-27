//index.js
const app = getApp();

Page({
    data: {
        flag: true
    },
    onLoad: function () {
        let system_userInfo = app.wxRequest.system_userInfo;
        if (system_userInfo) {
            this.isCheckUserInfo(system_userInfo);
        } else {
            app.getTokenCallback = res => this.isCheckUserInfo(res);
        }
    },
    isCheckUserInfo (system_userInfo) {
        console.log(system_userInfo);
        if (system_userInfo && system_userInfo.access && system_userInfo.userid) {
            this.setData({
                flag: false
            });
        }
    },
    getPhoneNumber ({ detail }) {
        const {encryptedData, iv} = detail;
        app.wxRequest.POST.USER.decryptUserInfo({
            encrypted: encryptedData,
            iv,
            appid: getApp().globalData.appid
        }).then(res => {
            console.log(res);
        })
        // app.wxRequest.post(`user/${app.wxRequest.system_userInfo.userid}/infos?op=4`, {
        //     encrypted: encryptedData,
        //     iv,
        //     appid: getApp().globalData.appid
        // }).then(res => {
        //     console.log(res);
        // })
    }
});
