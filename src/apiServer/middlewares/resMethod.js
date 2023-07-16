/**
 * @type {import('express').Handler}
 */
module.exports = function resMethod(req, res, next) {
  res.success = function success({ data, ...info }) {
    res.status(200).send({
      success: true,
      data,
      ...info,
    });
  };

  /**
   * @param {Error} error 
   */
  res.fail = function fail(error) {
    res.status(error.code).send({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        type: error.name,
        debugInfo: error.data,
      }
    });
  };

  next();
};