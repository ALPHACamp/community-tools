// Require the necessary discord.js classes
require('dotenv').config();
const express = require('express');
var cors = require('cors');
const app = express();
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  Partials
} = require('discord.js');
const { db } = require('./config/db.js');
const { FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((file) =>
  file.endsWith('.js')
);

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
const commandsPath = path.join(__dirname, 'commands/leaderboard');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
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
    const date = new Date();
    const yearAndMonth = date.toISOString().slice(0, 7);
    const collectionName = `leaderboard-${yearAndMonth}`;

    await db.runTransaction(async (t) => {
      const ref = db
        .collection(collectionName)
        .where('discordId', '=', reaction.message.author.id);
      const snapshot = await t.get(ref);
      if (snapshot.empty) {
        t.set(db.collection(`leaderboard-${yearAndMonth}`).doc(), {
          period: yearAndMonth,
          discordId: reaction.message.author.id,
          point: 1
        });
      } else {
        t.update(snapshot.docs[0].ref, { point: FieldValue.increment(1) });
      }

      const authorTotalPoint = snapshot.docs[0]
        ? snapshot.docs[0].data().point + 1
        : 1;

      const embedMessage = new EmbedBuilder()
        .setColor('#FFCC39')
        .setDescription(
          `太棒了！ 有人覺得這則在 <#${reaction.message.channelId}> 的 [訊息](https://discord.com/channels/${reaction.message.guildId}/${reaction.message.channelId}/${reaction.message.id}) 有幫助，並且送上了一個 🧡`
        )
        .addFields({ name: '= From', value: `${user}`, inline: true })
        .addFields({
          name: 'To',
          value: `${reaction.message.author}`,
          inline: true
        })
        .addFields({
          name: 'Total 🧡',
          value: `${authorTotalPoint}`,
          inline: true
        });
      const channel = client.channels.cache.get(process.env.CHANNEL_ID);
      channel.send({ embeds: [embedMessage] });
    });
  }
});

// eslint-disable-next-line no-unused-vars
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (reaction.emoji.name === '🧡' && reaction.message.author !== user) {
    await db.runTransaction(async (t) => {
      const date = new Date();
      const yearAndMonth = date.toISOString().slice(0, 7);
      const collectionName = `leaderboard-${yearAndMonth}`;
      const ref = db
        .collection(collectionName)
        .where('discordId', '=', reaction.message.author.id);
      const snapshot = await t.get(ref);

      !snapshot.empty &&
        t.update(snapshot.docs[0].ref, { point: FieldValue.increment(-1) });
    });
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

const apiRoutes = require('./routes/index');

app.use('/api', cors(), apiRoutes);

app.listen(process.env.PORT || 3306, () => {
  console.log(`server is running on ${process.env.PORT || 3306}`);
});
