const path = require(`path`)
const glob = require('glob')
const md5 = require('md5')
const fs = require('fs-extra')

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
exports.onCreateWebpackConfig = (helper) => {
  const { stage, actions, getConfig } = helper;
  if (stage === "develop") {
    // if (stage === "build-javascript") {
    const config = getConfig();
    const miniCssExtractPlugin = config.plugins.find(
      (plugin) => plugin.constructor.name === "MiniCssExtractPlugin"
    );
    if (miniCssExtractPlugin) {
      miniCssExtractPlugin.options.ignoreOrder = true;
    }
    actions.replaceWebpackConfig(config);
  }
};

exports.onPostBuild = async () => {
  const publicPath = path.join(__dirname, "public")
  const hash = md5(Math.random().toString(36).substring(7))

  const htmlAndJSFiles = glob.sync(`${publicPath}/**/*.{html,js}`)
  console.log(
      "[onPostBuild] Replacing page-data.json references in the following files:"
  )
  for (let file of htmlAndJSFiles) {
    const stats = await fs.stat(file, "utf8")
    if (!stats.isFile()) continue
    console.log(file)
    let content = await fs.readFile(file, "utf8");
    let result = content
        .replace(/page-data.json/g, `page-data.json/?${hash}`)
        .replace(/app-data.json/g, `app-data.json/?${hash}`);
    await fs.writeFile(file, result, "utf8")
  }
}
