const express = require('express');
const router = express.Router();
const Discord = require('discord.js');

const { db } = require('../../config/db');
const { pageSize } = require('../../const.js');

function validate(req, res, next) {
  const { date, discordId, page } = req.query;
  if (page && typeof Number(page) && Number(page) <= 0) {
    return res.status(400).json('page must be valid number');
  }

  const dateRegex = /([12]\d{3}-(0[1-9]|1[0-2]))/;
  if (date && !dateRegex.test(date)) {
    return res.status(400).json('date must be in YYYY-MM format');
  }

  if (discordId && typeof discordId !== 'string') {
    return res.status(400).json('discordId must be string');
  }

  next();
}



router.get('/', validate, async function (req, res) {
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

  const client = new Discord.Client({
    intents: []
  });
  client.login(process.env.DISCORD_TOKEN);

  const fetchUserDetails = async (doc) => {
    const data = doc.data();
    const discordUser = await client.users.fetch(data.discordId);
    return {
      id: doc.id,
      name: discordUser.username,
      avatarURL: discordUser.displayAvatarURL(),
      ...data
    };
  };

  const promises = querySnapshot.docs.map(fetchUserDetails);
  const results = await Promise.all(promises);

  return res.success({
    data: results,
    offset,
    pageSize,
    totalPages,
    currentPage: page,
    totalDataCount: totalDocsCount
  });
});

module.exports = router;
