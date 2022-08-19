const io = require("socket.io-client/dist/socket.io");
let hotEmitter = require("./emitter");

let currentHash;

// 连接服务器
const URL = "/";
const socket = io(URL);

// 客户端主要分为两个关键点

// 1.创建一个 websocket客户端 连接 websocket服务端，websocket客户端监听 hash 和 ok 事件
// 2.主要的热更新客户端实现逻辑，浏览器会接收服务器端推送的消息，如果需要热更新，浏览器发起http请求去服务器端获取新的模块资源解析并局部刷新页面

const onSocketMessage = {
    hash(hash) {
        console.log("hash",hash);
        currentHash = hash;// 获取最新hash
    },
    ok() {
        console.log("ok");  
        reloadApp();// 开始热更新
    },
    connect() {
        console.log("client connect successful");
    }
};
// 添加监听回调
Object.keys(onSocketMessage).forEach(eventName => {
    let handler = onSocketMessage[eventName];
    socket.on(eventName, handler);
});


let reloadApp = () => {
    let hot = true;
    if (hot) {// 是否支持热更新
        // 如果支持的话发射webpackHotUpdate事件
        hotEmitter.emit("webpackHotUpdate", currentHash);
    } else {
        // 如果不支持则直接刷新浏览器	
        window.location.reload();
    }
}
