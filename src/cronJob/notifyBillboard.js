const { db } = require('../config/db.js');
const { client } = require('../config/discordClient.js');
const { CronJob } = require('cron');

const notifyBillboardJob = new CronJob(
  '0 18 1 * *', // 每個月1號晚上6點推波
  notifyBillboardJobFunc,
  null,
  false,
  'Asia/Taipei'
);

async function notifyBillboardJobFunc() {
  const now = new Date();

  const [currentMonthLeaderboardSnap, prevMonthLeaderboardSnap] =
    await Promise.all([
      getQeuryPrevMonthLeaderboardDataFunc(now),
      getQeuryPrevPrevMonthLeaderboardDataFunc(now)
    ]);

  const improvementBoard = generateImprovementList({
    prevLeaderboardData: prevMonthLeaderboardSnap.docs.map((doc) => doc.data()),
    curLeaderboardData: currentMonthLeaderboardSnap.docs.map((doc) =>
      doc.data()
    )
  });

  await notifyBillboard({
    improvementBoard,
    curLeaderBoardDocs: currentMonthLeaderboardSnap.docs
  });
}

async function getQeuryPrevPrevMonthLeaderboardDataFunc(now) {
  let collection = `leaderboard-${now.getFullYear()}`;
  let queryMonth = now.getMonth() - 1;
  if (now.getMonth === 0) {
    collection = `leaderboard-${now.getFullYear() - 1}`;
    queryMonth = 11;
  }
  return db.collection(collection).where('month', '=', queryMonth).get();
}

async function getQeuryPrevMonthLeaderboardDataFunc(now) {
  let collection = `leaderboard-${now.getFullYear()}`;
  let queryMonth = now.getMonth();
  if (now.getMonth === 0) {
    collection = `leaderboard-${now.getFullYear() - 1}`;
    queryMonth = 12;
  }
  return db
    .collection(collection)
    .where('month', '=', queryMonth)
    .orderBy('point', 'DESC')
    .get();
}

function getInRankUsersMsg({ totalUserCount, leaderBoardDocs }) {
  let curMonthTopUserMsg = ``;
  for (let i = 0; i < totalUserCount; i++) {
    const user = leaderBoardDocs[i].data();
    curMonthTopUserMsg += `#${i + 1} <@${user.discordId}> - 總分 ${
      user.point
    } \n`;
  }
  return curMonthTopUserMsg;
}

function generateImprovementList({ prevLeaderboardData, curLeaderboardData }) {
  const progressList = curLeaderboardData.map((curUser) => {
    const prevData = prevLeaderboardData.find(
      (prevUser) => prevUser.discordId == curUser.discordId
    );
    const improvement = curUser.point - (prevData ? prevData.point : 0);
    return {
      discordId: curUser.discordId,
      improvement,
      year: curUser.year,
      month: curUser.month
    };
  });

  progressList.sort((a, b) => b.improvement - a.improvement);
  return progressList;
}

async function notifyBillboard({ improvementBoard, curLeaderBoardDocs }) {
  const topUsersMsg = getInRankUsersMsg({
    totalUserCount:
      curLeaderBoardDocs.length > 5 ? 5 : curLeaderBoardDocs.length,
    leaderBoardDocs: curLeaderBoardDocs
  });

  const topImproveList = improvementBoard.slice(
    0,
    curLeaderBoardDocs.length > 5 ? 5 : curLeaderBoardDocs.length
  );
  const topImproveMsg = topImproveList.reduce(
    (msg, curUser, i) =>
      (msg += `#${i + 1} <@${curUser.discordId}> - 增加 ${
        curUser.improvement
      }分 \n`),
    ''
  );

  const message = `Hi @everyone, 將將！上個月的 🧡排行榜出爐啦！來看看你有沒在榜上吧～～～

  <總積分排名前 5 名>
  ${topUsersMsg}
  
  <上個月積分增加最多前 5 名>
  ${topImproveMsg}`;

  await client.channels.cache
    .get(process.env.LEADERBOARD_NOTIFY_CHANNEL_ID)
    .send(message);
}

module.exports = { notifyBillboardJob };
