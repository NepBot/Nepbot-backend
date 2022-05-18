const env = require("./env.js").env

exports.getSecret = function () {
  switch (env) {
    case 'production':
    case 'mainnet':
      return {
        TOKEN: 'OTU4OTk3NDEzODAzMTk2NDc2.YkVd8A.bDYeZdUzid1jvmjQXaGv9PIO0-Q',
        MYSQL: {
          host: 'localhost',
          user: 'nepbot',
          password: 'bhc19930805B',
          database: 'nepbot_mainnet',
        },
      }
      case 'development':
      case 'testnet':
        return {
          TOKEN: 'OTI4NTU5MTM3MTc5MTcyODc0.YdaiFg.D8Mosu0tb-E5iDw5AortkZQ6k2c',
          MYSQL: {
            host: 'localhost',
            user: 'nepbot',
            password: 'bhc19930805B',
            database: 'discordserver',
          },
        }
  }
}

