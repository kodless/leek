/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
exports.onCreateWebpackConfig = helper => {
    const { stage, actions, getConfig } = helper
    if (stage === "develop") {
        // if (stage === "build-javascript") {
        const config = getConfig()
        const miniCssExtractPlugin = config.plugins.find(
            plugin => plugin.constructor.name === "MiniCssExtractPlugin"
        )
        if (miniCssExtractPlugin) {
            miniCssExtractPlugin.options.ignoreOrder = true
        }
        actions.replaceWebpackConfig(config)
    }
}