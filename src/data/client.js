module.exports =
  process.env.NODE_ENV === "development"
    ? require("./dev/_client")
    : require("./live/_client");
