let webpack = require("webpack");
let HtmlWebpackPlugin = require("html-webpack-plugin")
let path = require("path");
module.exports = {
    mode: "development",
    entry:"./src/index.js",
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist")
    },
    plugins: [
        new HtmlWebpackPlugin(),//输出一个html，并将打包的chunk引入
        // 生成两个补丁文件
        // manifest.json 是上次编译生成的hash.hot-update.json
        // updated chunk 新编译生成的chunk hash.hot-update.js
        // 这个HotModuleReplacementPlugin插件会调用window上的webpackHotUpdate函数
        // 插件把webpackHotUpdate函数注入到chunk文件中 
        // 这个函数在chunk文件中注入HMR runtime运行时代码 
        // webpack-dev-server调用这个函数
        new webpack.HotModuleReplacementPlugin()
    ]
}