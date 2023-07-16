const express = require('express');
const router = express.Router();

router.use('/leaderboard', require('./leaderboard.js'));
router.get('/healthCheck', (req, res) => {
  return res.success({ data: 'ok' });
});


module.exports = router;