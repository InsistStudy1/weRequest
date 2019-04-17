/**
 * Created by Jack.Huang on 2019/3/4.
 * */

let regeneratorRuntime = require("./runtime"); // 兼容 async await

String.prototype.format = function () {
    let args = arguments;
    return this.replace(/\{(\d+)\}/g, (m, i) => args[i]);
};

let wxRequest = {};

// 请求配置文件
wxRequest.config = {
    baseUrl: '', // 基础路径
    version: '', // 后端接口版本号

    // 全局错误处理
    ERROR: {
        OTHER_ERROR: {
            msg: '未知错误（错误字典没有）',
            ui: '系统错误',
            showUI: true
        }
    },

    TOKEN_ERROR_CODE: 5000, // TOKEN 重刷错误码

    // 获取 TOKEN URL
    TOKENUrl: ``,
    // 成功获得 TOKEN 后的处理函数
    tokenSuccessFn (res) {
    },

    // GET 请求列表
    getList: {},

    // POST 请求列表
    postList: {}
};

// 用户系统信息
wxRequest.system_userInfo = null;
wxRequest.userInfo = null;

wxRequest.POST = {}; // 可直接调用的 GET 请求
wxRequest.GET = {};  // 可直接调用的 POST 请求

// request 静态属性
wxRequest.loginState = false; // 判断是否登录
wxRequest.isLanding = false; // 判断是否正在登录
wxRequest.tokenFailQueue = []; // TOKEN 失效队列
wxRequest.tokenFailTime = 0; // TOKEN 失效次数

/**
 * 把小程序接口封装成 Promise
 * @param {String} name 接口名称
 * @param {Object} options 调用接口参数
 * @returns {Promise}
 */
function wxApiPromise (name, options = {}) {
    return new Promise((success, fail) => {
        let obj = {...options, ...{success, fail}};
        wx[name](obj);
    });
}

/**
 * 通用请求
 * @param options
 * @returns {Promise}
 */
wxRequest.request = function (options) {
    let baseUrl = this.config.baseUrl + this.config.version;
    let {
        url,
        method = 'GET',
        data = {},
        header = {'Content-Type': 'application/json'},
        state = 0, // 1代表登录
    } = options;

    options.url = url.indexOf(baseUrl) === -1 ? baseUrl + url : url;
    method.toUpperCase();


    // 如果用户信息不存在，直接返回让其登录
    if (!wxRequest.system_userInfo && state !== 1) {
        if (this.loginState) {
            this.wxLogin();
        }
        return;
    }

    // 如果用户信息存在给 Header 带上 TOKEN
    if (this.system_userInfo) {
        header['TOKEN'] = this.system_userInfo.access;
    }
    return new Promise(((resolve, reject) => {
        wxApiPromise('request', options).then(res => {
            if (res.data.hasOwnProperty('code')) {
                // 请求成功
                if (res.data.code === 200) {
                    return resolve(res.data.data);
                } else {
                    // 如果请求是 TOKEN，发生错误进行重刷 TOKEN
                    if (state === 1) {
                        return this.getToken();
                    }

                    let error_code = res.data.code; // 错误码
                    let errObj = this.config.ERROR[error_code]; // 错误对象
                    // 如果错误对象不存在，就使用默认错误
                    if (!errObj) {
                        errObj = this.config.ERROR.OTHER_ERROR;
                    }

                    // TOKEN 失效
                    if (error_code === this.config.TOKEN_ERROR_CODE) {
                        this.loginState = false;
                        console.log('TOKEN 失效 ----------', res);

                        // 把失效的请求压入 TOKEN 失效队列中
                        options.callback = resolve;
                        this.tokenFailQueue.push(options);
                        this.getToken();
                        return;
                    }

                    // 如果需要显示提示的话
                    if (errObj.showUI) {
                        wx.showToast({
                            title: `${ errObj.ui }`,
                            icon: 'none'
                        });
                        return Promise.resolve(errObj.msg);
                    }
                }
            }
        }).catch(err => {
            console.log('request error', err);
            reject(err);
        })
    }))
};

/**
 * GET 请求
 * @param {String} url
 * @param {Object} data
 * @param {Object} header
 * @returns {Promise}
 */
wxRequest.post = async function (url = '', data = {}, header = {}) {
    return this.request({url, method: 'POST', data, header});
};

/**
 * POST 请求
 * @param {String} url
 * @param {Object} data
 * @param {Object} header
 * @returns {Promise}
 */
wxRequest.get = async function (url = '', data = {}, header = {}) {
    return this.request({url, method: 'GET', data, header});
};

/**
 * 获取 TOKEN
 * @returns {Promise}
 */
wxRequest.getToken = async function () {
    wx.showLoading({
        title: '登陆中',
        mask: true
    });
    let {code: jscode} = await this.wxLogin();

    if (jscode) {
        try {
            let res = await this.request({
                method: 'POST',
                url: this.config.TOKENUrl,
                data: {jscode},
                state: 1
            });

            wx.hideLoading();
            this.config.tokenSuccessFn(res);

            // 如果 TOKEN 请求失效请求队列长度大于1的话
            if (this.tokenFailQueue.length) {
                let options = this.tokenFailQueue.shift();
                this.request(options).then(res => {
                    options.callback && options.callback(res);
                });
            }
            return Promise.resolve(res);
        } catch (error) {
            console.log('登录失败 ----------', error);
            wx.hideLoading();
            wx.showToast({
                title: '登录失败，请尝试删除小程序重新搜索该小程序进入',
                icon: 'none'
            });
        }
    }
}
;

/**
 * 微信登录封装
 * @returns {Promise}
 */
wxRequest.wxLogin = async function () {
    // 如果已登录或者正在登陆，返回
    if (this.loginState || this.isLanding) {
        return;
    }
    this.isLanding = true;
    try {
        let res = await wxApiPromise('login');
        console.log('wx.login_success!', res);
        this.loginState = true;
        this.isLanding = false;
        return Promise.resolve(res);
    } catch (err) {
        console.log('wx.login_fail!', err);
        return Promise.reject(err);
    }

};

/**
 * 处理请求 URL
 * @param {Object} urlList
 * @param {String} method
 */
wxRequest.urlDispose = async function (urlList, method) {
    for (let item in urlList) {
        let oldUrl = urlList[item]; // 正常情况下是旧的 URL，情况二是：一种请求接口类型的标识

        if (typeof oldUrl === 'object') {
            let type = urlList[item];

            // 如果 GET/POST 不存在这种类型的接口，则给这种类型初始化
            if (!this[method].hasOwnProperty(item)) {
                this[method][item] = {};
            }

            for (let port in type) {
                this[method][item][port] = (data, header) => {
                    let userid = this.system_userInfo.userid;
                    let string = oldUrl[port].format(userid);
                    return this[method === 'POST' ? 'post' : 'get'](`${ string }`, data, header);
                };
            }

        } else if (typeof oldUrl === 'string') {
            // 把所有接口转换为一个函数
            this[method][item] = (data = {}, header = {}) => {
                let userid = this.system_userInfo.userid;
                let string = oldUrl.format(userid);
                return this[method === 'POST' ? 'post' : 'get'](`${ string }`, data, header);
            };
        }

    }
};


export default wxRequest;
