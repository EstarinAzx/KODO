//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

// Load .env file for Firebase config (if exists)
try { require('dotenv').config(); } catch (e) { /* dotenv not available in CI */ }
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
            new webpack.DefinePlugin({
                'KODO_FIREBASE_API_KEY': JSON.stringify(process.env.KODO_FIREBASE_API_KEY || ''),
                'KODO_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.KODO_FIREBASE_AUTH_DOMAIN || ''),
                'KODO_FIREBASE_PROJECT_ID': JSON.stringify(process.env.KODO_FIREBASE_PROJECT_ID || ''),
                'KODO_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.KODO_FIREBASE_STORAGE_BUCKET || ''),
                'KODO_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.KODO_FIREBASE_MESSAGING_SENDER_ID || ''),
                'KODO_FIREBASE_APP_ID': JSON.stringify(process.env.KODO_FIREBASE_APP_ID || ''),
            }),
        ],
        devtool: 'nosources-source-map',
    },
];

module.exports = configs;
