const logger = require('../../pkg/utils/logger');
const guildDeletes = require('../../pkg/models/object/guild_deletes');
const userInfos = require('../../pkg/models/object/user_infos');
const timeUtils = require('../../pkg/utils/time_utils');
const schedule = require('node-schedule');

const EXPIRED_DAY = 15; // days

const execute = async guild => {
  /**
   * when bot got kick or ban, the data in database will save @EXPIRED_DAY days, the following code will create a schedule job to delete data after that days
   */
  try {
    if (await guildDeletes.get({ guild_id: guild.id })) {
      await guildDeletes.delete({
        guild_id: guild.id,
      });
      const job = schedule.scheduledJobs[guild.id];
      job.cancel();
      logger.info('guildDelete event triggered, find duplicate in guildDeletes table.');
      logger.info(`remove ${guild.id} data in guildDeletes & cancel the job: ${job.name}`);
    }

    const expiredAt = await timeUtils.getExpiredTimeByDay(EXPIRED_DAY);
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