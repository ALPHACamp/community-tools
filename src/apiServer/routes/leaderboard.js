const express = require('express');
const router = express.Router();
const Discord = require('discord.js');

const { db } = require('../../config/db');
const { pageSize } = require('../../const.js');

function validate(req, res, next) {
  const { year, month, discordId, page } = req.query;
  if (page && typeof Number(page) && Number(page) <= 0) {
    return res.status(400).json('page must be valid number');
  }

  if (!year || !month) {
    return res.status(400).json('年跟月份為必填項');
  }

  const yearRegex = /^[1-9]\d{3}$/;
  const monthRegex = /^(0?[1-9]|1[0-2])$/;
  if (!yearRegex.test(year) || !monthRegex.test(month)) {
    return res.status(400).json({ message: '年或月份為非法格式', year, month });
  }

  if (discordId && typeof discordId !== 'string') {
    return res.status(400).json('discordId must be string');
  }

  next();
}

router.get('/', validate, async function (req, res) {
  const { year, month, discordId, page = 1 } = req.query;
  let ref = db
    .collection(`leaderboard-${year}`)
    .where('month', '=', Number(month));

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
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILDID);
    const member = await guild.members.fetch(data.discordId);

    return {
      id: doc.id,
      name: member.nickname || member.user.username,
      avatarURL: member.user.displayAvatarURL(),
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
    currentPage: Number(page),
    totalDataCount: totalDocsCount
  });
});

module.exports = router;
