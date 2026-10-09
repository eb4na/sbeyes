// Extends app.json. The web build's base path comes from WEB_BASE_URL:
// "/sbeyes" for GitHub Pages (eb4na.github.io/sbeyes), unset for Vercel (root).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.WEB_BASE_URL ?? '' },
});
