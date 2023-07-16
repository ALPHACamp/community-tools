const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');

/**
 * @type {import('express').Handler}
 */
module.exports = function reqInitializer(req, res, next) {
  const start = process.hrtime.bigint();
  req.requestId = uuidv4();

  const { method, query = {}, body = {}, requestId, originalUrl } = req;
  logger.debug({ msg: `${method} ${originalUrl} [STARTED]`, requestId, query, body });

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    logger.info({ msg: `${method} ${originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`, requestId });
  });

  res.on('close', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    logger.info({ msg: `${method} ${originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`, requestId });
  });

  res.setHeader('X-Request-Id', req.requestId);
  next();
};

function getDurationInMilliseconds(start) {
  const diff = process.hrtime.bigint() - start;
  return Number(diff) / 1000000;
}