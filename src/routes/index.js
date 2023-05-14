const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { pageSize } = require('../const.js');

function validate(req, res, next) {
  const { date, discordId, page } = req.query;
  if (page && typeof page != 'number') {
    return res.status(400).json('page must be number');
  }

  const dateRegex = /([12]\d{3}-(0[1-9]|1[0-2]))/;
  if (!dateRegex.test(date)) {
    return res.status(400).json('date must be in YYYY-MM format');
  }

  if (discordId && typeof discordId !== 'string') {
    return res.status(400).json('discordId must be string');
  }

  next();
}

router.get('/leaderboard', validate, async function (req, res) {
  try {
    const currentYearAndMonth = new Date().toISOString().slice(0, 7);
    const { date, discordId, page = 1 } = req.query;
    let ref = db
      .collection(`leaderboard-${currentYearAndMonth}`)
      .where('period', '=', date || currentYearAndMonth);

    const countSnapshot = await ref.count().get();
    const totalDocsCount = countSnapshot.data().count;
    const totalPages = Math.ceil(totalDocsCount / 10);
    const offset = (page - 1) * pageSize;

    if (discordId) {
      ref = ref.where('discordId', '=', discordId);
    }

    const querySnapshot = await ref
      .orderBy('point', 'desc')
      .limit(pageSize)
      .offset(offset)
      .get();

    return res.status(200).json({
      data: querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      offset,
      pageSize,
      totalPages,
      totalDataCount: totalDocsCount
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
