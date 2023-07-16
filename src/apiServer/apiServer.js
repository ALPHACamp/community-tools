const app = require('./express');
const http = require('http');

const logger = require('../lib/logger.js');

class ApiServer {
  constructor(port) {
    logger.info('Configure API Server ...', { port, node_env: process.env.NODE_ENV });

    this.port = port;
    this.httpServer = null;
    this.db = null;

    this.#createServer();
    this.#bindEvents();
  }

  #createServer() {
    this.httpServer = http.createServer(app);
  }

  #bindEvents() {
    logger.info('Binding Events ...');
    this.httpServer.on('listening', () => {
      logger.info(`Server started on port: ${this.port} for NODE_ENV:${process.env.NODE_ENV}`);
    });
    this.httpServer.on('error', (err) => {
      logger.error('Server error:', err);
    });
  }

  start() {
    this.httpServer.listen(this.port);
  }
}

module.exports = ApiServer;