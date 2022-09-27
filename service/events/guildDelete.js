const logger = require('../../pkg/utils/logger');
const guildDeletes = require('../../pkg/models/object/guild_deletes');
const userInfos = require('../../pkg/models/object/user_infos');
const schedule = require('node-schedule');

const EXPIRED_DAY = 15; // days

const execute = async guild => {
  /**
   * when bot got kick or ban, the data in database will save @EXPIRED_DAY days, the following code will create a schedule job to delete data after that days
   */
  try {
    const expiredAt = getExpiredTime(EXPIRED_DAY);
    await guildDeletes.add({
      guild_id: guild.id,
      expired_at: expiredAt,
    });
    const job = schedule.scheduleJob(guild.id, expiredAt, function() {
      deleteData(guild.id);
    });
    logger.info(`create new guild deletes schedule job, name: ${job.name} run at ${expiredAt}`);
  }
  catch (e) {
    logger.error(e);
  }
};

function deleteData(guildId) {
  userInfos.deleteUser({
    guild_id: guildId,
  }).then(logger.info(`delete all data in user_infos, guild_id: ${guildId} `));
  guildDeletes.delete({
    guild_id: guildId,
  }).then(logger.info(`delete data in guild_deletes, guild_id: ${guildId}`));
}

module.exports = {
  name: 'guildDelete',
  execute,
  deleteData,
};

function getExpiredTime(numOfDays) {
  const date = new Date();
  date.setDate(date.getDate() + numOfDays);
  return date;
}