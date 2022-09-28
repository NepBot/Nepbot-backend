// get the app root path
const appRoot = require('app-root-path');
const actions_dir = `${ appRoot }/service/discord_actions/guildCreate`;
// require logger
const logger = require('../../pkg/utils/logger');

const fs = require('node:fs');
// actions
const actionFiles = fs.readdirSync(actions_dir).filter(file => file.endsWith('.js'));

const guildDeletes = require('../../pkg/models/object/guild_deletes');
const schedule = require('node-schedule');

const execute = async guild => {

  for (const file of actionFiles) {
    const action = require(`${actions_dir}/${file}`);
    logger.info(`execute the actions in ${actions_dir}/${file}`);
    await action.execute(guild);
  }

  /**
   * find the table guild_deletes have the data need to be delete and cancel the job in schedule.
   */
  if (await guildDeletes.get({ guild_id: guild.id })) {
    await guildDeletes.delete({
      guild_id: guild.id,
    });
    const job = schedule.scheduledJobs[guild.id];
    job.cancel();
    logger.info(`the guild: ${guild.id} reinvite nepbot, so cancel the job: ${job.name}`);
  }
};

module.exports = {
  name: 'guildCreate',
  execute,
};

