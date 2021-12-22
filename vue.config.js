module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules(?!(\/|\\)pdfjs-dist)/,
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-optional-chaining']
          }
        },
        {
          test: /\.txt$/i,
          use: 'raw-loader'
        }
      ]
    }
  }
}
