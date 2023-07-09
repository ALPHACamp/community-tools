FROM node:16-alpine

ARG APP_ID
ARG DISCORD_TOKEN
ARG PUBLIC_KEY
ARG DISCORD_GUILDID
ARG CHANNEL_ID
ARG PORT

ENV APP_ID=$APP_ID
ENV DISCORD_TOKEN=$DISCORD_TOKEN
ENV PUBLIC_KEY=$PUBLIC_KEY
ENV DISCORD_GUILDID=$DISCORD_GUILDID
ENV CHANNEL_ID=$CHANNEL_ID
ENV PORT=$PORT

EXPOSE 8080
WORKDIR /app

COPY . .
RUN npm install -g pm2 pm2-logrotate && \
  pm2 set pm2-logrotate:max_size 200M && \
  pm2 set pm2-logrotate:compress true && \
  pm2 set pm2-logrotate:workerInterval 3600 && \
  pm2 set pm2-logrotate:rotateInterval '0 0 * * *' && \
  npm install --production

CMD npm run start:prod