const logger = require('../../lib/logger.js');
const Errors = require('../../lib/Errors.js');

/**
 * @type {import('express').ErrorRequestHandler}
 */
module.exports = function errorHandler(err, req, res, next) {
  const errorMessage = err.msg || err.message;
  const data = {};
  if (process.env.NODE_ENV === 'dev') {
    data.stack = err.stack;
    console.log(err);
  }

  logger.info(`General error handler for error: ${errorMessage}`, data);
  if (res.headersSent) {
    return next(err);
  } else if (err instanceof Errors.GeneralError) {
    return res.fail(err);
  }

  // 當錯誤並非預定義時
  logger.error({ msg: 'Exception', errMsg: err.message, errName: err.name });
  res.status(501);
  return res.send(err.message);
};