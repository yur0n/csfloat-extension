
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

export default {
  mode: 'production',
  entry: {
    contentCsfloat: './src/content/csfloat.js',
    contentParser: './src/content/parser.js',
    background: './src/background/index.js'
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [{
        from: path.resolve('manifest.json'),
        to: path.resolve('dist')
      }, {
        from: path.resolve('images'),
        to: path.resolve('dist/images')
      }]
    })
  ],
  module: {
    rules: [
      {
        test: /.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env'
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  }
};