// Require the necessary discord.js classes
const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  Partials
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }

  if (reaction.emoji.name === '🧡' && reaction.message.author !== user) {
    const embedMessage = new EmbedBuilder()
      .setColor('#FFCC39')
      .setDescription(
        `太棒了！ 有人覺得這則在 <#${reaction.message.channelId}> 的 [訊息](https://discord.com/channels/${reaction.message.guildId}/${reaction.message.channelId}/${reaction.message.id}) 有幫助，並且送上了一個 🧡`
      )
      .addFields({ name: 'From', value: `${user}`, inline: true })
      .addFields({
        name: 'To',
        value: `${reaction.message.author}`,
        inline: true
      })
      .addFields({
        name: 'Total 🧡',
        value: `${reaction.count}`,
        inline: true
      });
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    channel.send({ embeds: [embedMessage] });
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
