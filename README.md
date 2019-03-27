# wxRequest 使用说明



## API 接口

PS： 以下所有请求路径都不用带基础路径（baseUrl + version）

### 1. 配置接口（具体配置项为在后面 Example 中详细说明）

```js
wxRequest.config.xxx = xxx
```



### 2. 通用登陆接口 --- wxRequest.request（options）

```js
wxRequest.request(options);
```

options 参数

| 参数名 | 说明       | 选项                                              |
| ------ | ---------- | ------------------------------------------------- |
| url    | 请求路径   | 必选                                              |
| method | 请求方法   | 可选（默认 GET）                                  |
| data   | 请求参数   | 可选                                              |
| header | 请求头信息 | 可选（默认 {'Content-Type': 'application/json'}） |
| state  | 登陆标识   | 可选（默认 0， 1代表登录）                        |

返回值为请求中的 data 部分



### 3. POST请求

POST 方式有两种。

#### 3.1 app.wxRequest.POST.xxx([data, header])

​	在 `config` 的 `postList`配置项 种对路径进行配置，然后通过 `app.wxRequest.POST.xxx(data, header).then(res => xxx)` 进行调用

```js
// config
wxRequest.config.postList = {
    decryptUserInfo: 'user/{0}/infos?op=4'
}
```

```js
// index.js
getPhoneNumber ({ detail }) {
        const {encryptedData, iv} = detail;
        app.wxRequest.POST.decryptUserInfo({
            encrypted: encryptedData,
            iv,
            appid: getApp().globalData.appid
        }).then(res => {
            console.log(res);
        })
    }
```

返回值为请求中的 data 部分



#### 3.2 app.wxRequest.post(url, [data, header])

 	第二种是直接通过 `request.post` 进行调用

```js
app.wxRequest.post(`user/${app.wxRequest.system_userInfo.userid}/infos?op=4`, {
            encrypted: encryptedData,
            iv,
            appid: getApp().globalData.appid
        }).then(res => {
            console.log(res);
        })
```

返回值为请求中的 data 部分



### 4. GET请求

get 请求方式也是和 post 一致的，不同点只有下面几点

1.  `postList ` 变为 `getList` 
2.  app.wxRequest.GET.xxx(data, header).then(res => xxx)
3.  app.wxRequest.get(url, data, header).then(res => xxx)



### 5. 获取 TOKEN --- wxRequest.getToken()

首先需要在 `wxRequest.config.TOKENUrl` 中配置 `token` 路径

```js
wxRequest.config.TOKENUrl = `auth/wx31626473fac31e9d/token`;
```

方法一：调用并处理返回值

```js
wxRequest.getToken().then(res => {
    console.log(res)
})
```

方法二：在 `wxRequest.config.tokenSuccessFn ` 中统一处理返回值

```js
wxRequest.config.tokenSuccessFn = (res) => {
    wxRequest.system_userInfo = res;
};
```

然后在页面直接调用

```js
wxRequest.getToken();
```



### 6. 微信登录 --- wxRequest.wxLogin()

直接调用即可

```
wxRequest.wxLogin().then(res => {
    console.log(res) 
    // 返回值和 {code: xxx, errMsg: xxx}
})
```

PS: 在 `getToken` 中已经调用了 `wxLogin();` 想要获取 用户信息科直接使用 `getToken` 即可

### 7. 存/取 用户信息指定地点： wxRequest.system_userInfo



## Example

demo 下载地址：

1. 下载`wxRequest` 并把 `wxRequest` 文件夹放到到 `util` 文件夹中

![1551700537794](.\img\1551700537794.png)



2. 在 `app.js` 上面导入 `wxRequest.js`，并放到 `app` 的全局变量中

```js
// app.js
import wxRequest from './utils/wxRequest/wxRequest.js';
//app.js
App({
  	wxRequest, // 放入全局变量
    
	globalData: {}
    ...
})
```



3. 请求配置，我们新建一个 `config.js` 进行配置。

![1551700905339](C:\Users\welinkweb\Desktop\wxRequest 使用说明\img\1551700905339.png)



```js
// 首先导入 wxRequest.js 文件
import wxRequest from './wxRequest';

// 通过 wxRequest.config.xxx = xxx 进行相应配置

// 基础路径
wxRequest.config.baseUrl = 'https://app.welink.io/cloudapp/'; 

// 后端接口版本号（会和基础路径拼接在一起）
wxRequest.config.version = 'v3/'; 

// 全局错误处理
wxRequest.config.ERROR = {
 
    5401: { // 错误码
        msg: 'invalid param( 错误的业务参数 )',  // 错误信息
        ui: '业务参数出错',					  // 发生错误在界面展示的文字
        showUI: true						  // showUI，当这个值为 true 时，表示发生错误时会通过微信 wx.Toast 进行文字提示
    },
    
// 错误处理的配置结构为
    错误码: {
    		msg: 错误信息 // <String>
    		ui: 发生错误在界面展示的文字 // <String>
    		showUI: 发生当前错误是否进行 Toast 提示 // <Boolean>
	},
    
    
    OTHER_ERROR: { // 默认错误，当出现的错误都没在我们编写的错误字典里面时，则会提示这个错误
        ui: '系统错误',
        showUI: true
    }
};

// TOKEN 重刷错误码
wxRequest.config.TOKEN_ERROR_CODE = 5000; 

// TOKEN URL
wxRequest.config.TOKENUrl = `auth/wx31626473fac31e9d/token`;

// 成功获取 TOKEN 后的处理函数
wxRequest.config.tokenSuccessFn = (res) => {
    // res 为后端返回的数据中的 data值
    // 如在本 Demo 中 res 就为
    // {
    		// access: 'xxx',
        	// accid: 'xxx',
			// expire: 7200,
        	// ip: 'xxx',
			// refresh: 'xxx',
			// url: 'xxx',
			// userid: 'xxx'
	// }
    // 可在此处做用户信息的更新(用户信息需存在 wxRequest.system_userInfo 中)
    wxRequest.system_userInfo = res;
}

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
        decryptUserInfo: 'user/{0}/infos?op=4', // 解密用户信息，这里的 {0} 代表着 userid，会在请求时自动替换成 userid
    }
};

// 请求列表有两种格式：
// wxRequest.config.postList = {
	// 第一种
	使用时的名字: 路径
    // 第二种
    分类名字: {
        使用时的名字: 路径
    }
//}

// 处理 URL（不变），使用 wxRequest.POST 和 wxRequest.GET 必要配置。
wxRequest.urlDispose(wxRequest.config.postList, 'POST');
wxRequest.urlDispose(wxRequest.config.getList, 'GET');
```



4. 在 `app.js` 的  `onLaunch` 生命周期函数中进行 `TOKEN` 的请求（使用回调函数方式解决 TOKEN 请求都在 其他请求之前的方案）

```js
import wxRequest from './utils/wxRequest/wxRequest.js';

//app.js
App({

  wxRequest, // 放入全局变量

  onLaunch () {
   wxRequest.getToken().then(res => {
     // 由于在 successTOKEN 已经对 token 成功进行处理了，这里就不进行处理了
     if (this.getTokenCallback) { // 由于 getToken 是异步的，在这里给它一个回调函数，避免页面 onLoad 时获取不到 token 数据
      this.getTokenCallback(res);
     }
   })
  }
})
```

index.js

```js
//index.js
const app = getApp();

Page({
    data: {},
    onLoad: function () {
        let system_userInfo = app.wxRequest.system_userInfo;
        if (system_userInfo) {
			this.init(system_userInfo);
        } else {
            app.getTokenCallback = res => {
                this.init(res);
            }
        }
    },
    // 初始化数据
    init (system_userInfo) {
        console.log(system_userInfo);
    }
});

```



