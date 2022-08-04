const logger = require('../../utils/logger');

module.exports = class {
  constructor({ code, message, success, data }) {
    this.code = code || 200;
    this.message = message || 'success';
    this.success = success == null ? true : success;
    this.data = data;
    logger.info(JSON.stringify(this));
  }
};