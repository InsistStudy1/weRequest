// 首先导入 wxRequest.js 文件
import wxRequest from './wxRequest';

// 通过 wxRequest.config.xxx = xxx 进行相应配置

// 基础路径
wxRequest.config.baseUrl = 'https://app.welink.io/cloudapp/';

// 后端接口版本号（会和基础路径拼接在一起）
wxRequest.config.version = 'v3/';

// 全局错误处理
wxRequest.config.ERROR = {

    5103: { // 错误码
      msg: 'json mapping error',  // 错误信息
      ui: '接口不存在',					             // 发生错误在界面展示的文字
      showUI: true						             // showUI，当这个值为 true 时，表示发生错误时会通过微信 wx.Toast 进行文字提示
    },
    5401: { // 错误码
        msg: 'invalid param( 错误的业务参数 )',  // 错误信息
        ui: '业务参数出错',					             // 发生错误在界面展示的文字
        showUI: true						             // showUI，当这个值为 true 时，表示发生错误时会通过微信 wx.Toast 进行文字提示
    },
    OTHER_ERROR: {                                       // 默认错误，当出现的错误都没在我们编写的错误字典里面时，则会提示这个错误
        ui: '系统错误',
        showUI: true
    }
};

// TOKEN 重刷错误码
wxRequest.config.TOKEN_ERROR_CODE = 5000;

// 获取 TOKEN URL
wxRequest.config.TOKENUrl = `auth/wx31626473fac31e9d/token`;

// 成功获取 TOKEN 后的处理函数
wxRequest.config.tokenSuccessFn = (res) => {
    wxRequest.system_userInfo = res;
};

// GET 请求列表
wxRequest.config.getList = {
    // 用户信息 GET 接口
    USER: {
        verifyMobileCode: 'user/{0}/verifyCode', // 获取手机验证码 [ 参数：m（手机号） ]
    }
};

// POST 请求列表
wxRequest.config.postList = {
    // 用户信息 POST 接口
    USER: {
        decryptUserInfo: 'user/{0}/infos?op=4', // 解密用户信息
    }
};
// 处理 URL（不变），一定要写（主要是用来吧 postList 和 getList 转换为下面请求的使用方式）
wxRequest.urlDispose(wxRequest.config.postList, 'POST');
wxRequest.urlDispose(wxRequest.config.getList, 'GET');
