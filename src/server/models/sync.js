const UserInfo = require('./userInfo');
const Rule = require('./Rule');
const UserToken = require('./userField');
const sequelize = require("./mysqlDB");
sequelize.sync({ alter: true }).then(() => {
    console.log("");
});
