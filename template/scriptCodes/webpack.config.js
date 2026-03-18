/*
 * @Author: yyd
 * @Date: 2026-03-15 22:05:25
 * @LastEditTime: 2026-03-17 08:20:53
 * @FilePath: \scriptCodes\webpack.config.js
 * @Description:  webpack 配置文件
 */
const path = require('path');
const NpmDtsPlugin = require('npm-dts-webpack-plugin'); // 引入插件

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, '../assets/Script/types'),
        filename: 'CoreScripts.js',
        library: 'gb'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        // 关键：生成合并后的 .d.ts 文件
        new NpmDtsPlugin({
            output: path.resolve(__dirname, '../assets/Script/types/CoreScripts.d.ts'),
            entry: './src/index.ts',
            logLevel: 'warn'
        })
    ],
    devtool: 'source-map',
    optimization: {
        concatenateModules: true,
        minimize: true
    }
};