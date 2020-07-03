module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-undef": "off",
    "no-unused-vars": "off",
    "vue/no-unused-vars": "off"
  }
};