'use strict';
const pino = require('pino');

// 為了兼容vscode debugger時也能使用pino-pretty特別做的處理; pino-pretty不建議使用於prod環境
const pinoParams = [
  {
    level: 'trace',
    timestamp: pino.stdTimeFunctions.isoTime,
    base: undefined,
  },
];
if (process.env.NODE_ENV === 'dev') {
  const pretty = require('pino-pretty');
  const stream = pretty({
    colorize: true,
    translateTime: 'SYS:mm-dd HH:MM:ss',
  });

  pinoParams.push(stream);
}

/**
 * pino document: https://github.com/pinojs/pino/blob/HEAD/docs/api.md
 */
const Logger = pino(...pinoParams);

module.exports = Logger;
