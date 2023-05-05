const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    // ...
    plugins: [new MonacoWebpackPlugin()],
		// devServer: {
			// port: 9000,
			// contentBase: path.join(__dirname, './public')
		// },
		// output: {
			// path: path.resolve(__dirname, './public')
		// }
}