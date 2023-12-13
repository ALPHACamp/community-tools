const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (
      message.channel.id !== process.env.QUESTION_DISCUSSION_CHANNEL ||
      message.author.bot
    )
      return;
    const authorName = message.author.username;
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('符合版規提醒')
      .setURL(
        'https://discord.com/channels/925294714217967647/1080909526473134100'
      )
      .setDescription(
        `Hi ${authorName}, 很開心看到你提出一個問題，記得檢查自己的提問有沒有符合版規喔！ 另外，如果有人很熱心地協助你解決問題，別忘了給他一個愛心 🧡，感謝他的付出！`
      )
      .addFields({
        name: '版規',
        value:
          'https://discord.com/channels/925294714217967647/1080909526473134100'
      });
    message.reply({ embeds: [embed] });
  }
};
