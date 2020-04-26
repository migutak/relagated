module.exports = {
    user          : process.env.DB_USER || "ecol",
    password      : process.env.DB_PASSWORD || "ecol",
    connectString : process.env.DB_CONNECTIONSTRING || "52.117.54.217:1521/ORCLCDB.localdomain",
    EXTERNALURL   : process.env.EXTERNALURL || "http://127.0.0.1:8088"
  };