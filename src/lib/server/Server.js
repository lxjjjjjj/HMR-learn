const express = require("express");
const http = require("http");
const mime = require("mime");
const path = require("path");
const socket = require("socket.io");
const MemoryFileSystem = require("memory-fs");
const updateCompiler = require("./updateCompiler");

class Server {
    constructor(compiler) {
        this.compiler = compiler;
        // 1.更改config中的entry属性：将lib/client/index.js、lib/client/hot/dev-server.js注入到打包输出的chunk文件中
        updateCompiler(compiler);
        this.currentHash;// 编译hash
        this.clientSocketList = [];// 客户端集合
        this.fs;// 文件系统
        this.server;// http实例

        this.app;// express实例
        this.middleware;// webpack-dev-middleware返回的中间件

        this.setupHooks();// 监听done事件
        this.setupApp();// 创建express实例
        this.setupDevMiddleware();// webpack-dev-middleware
        this.routes();// app使用中间件
        this.createServer();// 创建静态服务器
        this.createSocketServer();// 创建websocket服务器
    }
    // 2.监听本地文件的变化、文件改变自动编译、编译输出 每当新一个编译完成后都会向客户端发送消息
    setupHooks() {
        let { compiler } = this;
        compiler.hooks.done.tap("webpack-dev-server", (stats) => {
            console.log("stats.hash", stats.hash);

            this.currentHash = stats.hash;
            this.clientSocketList.forEach(socket => {
                // 发送最新的hash
                socket.emit("hash", this.currentHash);
                // 再向客户端发送一个ok
                socket.emit("ok");
            });
        });
    }
    // 3.实现webpack-dev-middleware功能 监听文件的改变并注册客户端可以访问的路由
    setupDevMiddleware() {
        let { compiler } = this;

        // 以watch模式进行编译，会监控文件的变化
        compiler.watch({}, () => {
            console.log("Compiled successfully!");
        });

        //设置文件系统为内存文件系统
        let fs = new MemoryFileSystem();
        this.fs = compiler.outputFileSystem = fs;

        // express中间件，将编译的文件返回
        let staticMiddleWare = (fileDir) => {
            return (req, res, next) => {
                let { url } = req;
                if (url === "/favicon.ico") {
                    return res.sendStatus(404);
                }
                url === "/" ? url = "/index.html" : null;
                let filePath = path.join(fileDir, url);
                try {
                    let statObj = this.fs.statSync(filePath);
                    if (statObj.isFile()) {
                        let content = this.fs.readFileSync(filePath);
                        //路径和原来写到磁盘的一样，只是这是写到内存中了
                        res.setHeader("Content-Type", mime.getType(filePath));
                        res.send(content);
                    } else {
                        res.sendStatus(404);
                    }
                } catch (error) {
                    res.sendStatus(404);
                }
            }
        }
        this.middleware = staticMiddleWare;// 将中间件挂载在this实例上，以便app使用
    }
    // 创建服务端实例
    setupApp() {
        this.app = new express();
    }
    // 将中间件添加在服务上
    routes() {
        let { compiler } = this;
        let config = compiler.options;
        this.app.use(this.middleware(config.output.path));
    }
    createServer() {
        this.server = http.createServer(this.app);
    }
    // 4.创建websocket服务：建立本地服务和浏览器的双向通信；每当有新的编译，立马告知浏览器执行热更新逻辑
    createSocketServer() {
        // 实现一个websocket长链接 
        const io = socket(this.server);
        io.on("connection", (socket) => {
            console.log("a new client connect server");

            this.clientSocketList.push(socket);
            // 监听关闭客户端
            socket.on("disconnect", () => {
                console.log('disconnect')
                let num = this.clientSocketList.indexOf(socket);
                this.clientSocketList = this.clientSocketList.splice(num, 1);
            });
            // 向客户端发送最新的一个编译hash
            socket.emit('hash', this.currentHash);
            // 再向客户端发送一个ok
            socket.emit('ok');
        });
    }
    listen(port, host = "localhost", cb = new Function()) {
        this.server.listen(port, host, cb);
    }
}

module.exports = Server;
