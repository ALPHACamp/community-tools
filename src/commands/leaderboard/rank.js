require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../config/db.js');
const logger = require('../../lib/logger.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('查詢使用者當月排名及分數，請輸入使用者id，留空則查詢自己')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('輸入想查詢的使用者暱稱')
        .setRequired(false)
    ),

  // 等等在看選到的user參數怎拿，或是如何帶資料
  async execute(interaction) {
    const selectedUser = interaction.options.getUser('user');
    // 所選用戶的Discord ID
    const selectedUserId = selectedUser ? selectedUser.id : interaction.user.id;
    const { userRank, userPoint } = await queryUserRankAndPoint(selectedUserId);
    // 找到自己在排行中的第幾位
    await interaction.reply(`#排名：${userRank} 分數：${userPoint}`);
  }
};

async function queryUserRankAndPoint(discordId) {
  try {
    let userRank = '未在排行榜';
    let userPoint = 0;
    const currentYearAndMonth = new Date().toISOString().slice(0, 7);
    const ref = db
      .collection(`leaderboard-${currentYearAndMonth}`)
      .where('period', '=', currentYearAndMonth);

    const querySnapshot = await ref.orderBy('point', 'desc').get();

    querySnapshot.docs.every((doc, index) => {
      const data = doc.data();
      if (data.discordId == discordId) {
        userRank = index + 1;
        userPoint = data.point;
        return false;
      }
      return true;
    });

    return { userRank, userPoint };
  } catch (error) {
    logger.error('查詢用戶排名時發生錯誤：', error);
  }
}
