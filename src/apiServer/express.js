const express = require('express');
require('express-async-errors'); // for catching async error
const cors = require('cors');
const router = require('./routes/index.js');
const errorHandler = require('./middlewares/errorHandler.js');
const resMethod = require('./middlewares/resMethod.js');
const reqInitializer = require('./middlewares/reqInitializer.js');

const app = express();

app.use(cors({
  exposedHeaders: ['X-Request-Id'],
}));


app.use(reqInitializer);
app.use(resMethod);
app.use('/api', router);

app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => res.status(404).send({
  success: false,
  message: '指定路徑並不存在',
  error: {
    code: 404,
    type: 'RouteNotFound',
    debugInfo: {},
  },
}));

module.exports = app;