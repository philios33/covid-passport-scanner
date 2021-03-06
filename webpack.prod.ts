

import * as webpack from 'webpack';
import path from "path";

import './src/scripts/build.js';

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');

// The prod config is heavily based on the data in the dev config to keep things DRY.
const prodConfig = require('./webpack.dev').default;

prodConfig.mode = "production";
prodConfig.output.filename = "[name].[contenthash].bundle.js";
prodConfig.entry = {
    zxing: ['./src/lib/zxing.ts','@zxing/library','@zxing/browser'],
    certs: './src/compiled/certs.json',
    main: {
        import: './src/index.tsx',
        dependOn: ['certs','zxing'],
    },
}
prodConfig.optimization = {
    splitChunks: {
        chunks: (chunk) => {
            // I filter the chunks here so that zxing chunk is NOT included in the vendors bundle.  It is code split.
            return chunk.name === 'main';
        },
        name: 'vendor'
    },
    runtimeChunk: 'single', // This needs to be single since I am injecting multiple entry points in to the page to do code splitting
}
prodConfig.plugins = prodConfig.plugins.filter(p => {
    if (p instanceof webpack.HotModuleReplacementPlugin) {
        return false;
    } else if (p instanceof webpack.DefinePlugin) {
        return false;
    }
    return true;
});

prodConfig.plugins.push(
    new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': JSON.stringify(false),
        'process.env.DEVMODE': JSON.stringify(false),
    })
);

prodConfig.plugins.push(
    new CopyWebpackPlugin({
        patterns: [
            path.resolve(__dirname, "src", "public", "favicon.ico"),
            path.resolve(__dirname, "src", "public", "robots.txt"),
            path.resolve(__dirname, "src", "public", "sitemap.xml")
        ]
    })
);
/*
prodConfig.plugins.push(
    new BundleAnalyzerPlugin()
);
*/
prodConfig.devtool = false;
prodConfig.stats = "errors-only";

export default prodConfig;