//@ts-check
'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/** @type {import('webpack').Configuration[]} */
const configs = [
    // Extension Host (Node)
    {
        name: 'extension',
        target: 'node',
        mode: 'none',
        entry: './src/extension.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'extension.js',
            libraryTarget: 'commonjs2',
        },
        externals: {
            vscode: 'commonjs vscode',
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [{ loader: 'ts-loader' }],
                },
            ],
        },
        devtool: 'nosources-source-map',
        infrastructureLogging: { level: 'log' },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'packs', to: 'packs' },
                ],
            }),
        ],
    },
    // Webview (Browser)
    {
        name: 'webview',
        target: 'web',
        mode: 'none',
        entry: './src/webview/App.tsx',
        output: {
            path: path.resolve(__dirname, 'dist', 'webview'),
            filename: 'main.js',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                'react': 'preact/compat',
                'react-dom': 'preact/compat',
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [{ loader: 'ts-loader' }],
                },
            ],
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'src/webview/index.html', to: 'index.html' },
                ],
            }),
        ],
        devtool: 'nosources-source-map',
    },
];

module.exports = configs;
