const userInfos = require('../../pkg/models/object/user_infos');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
  .setName('checkwallet')
  .setDescription('Show the NEAR wallet currently connected to your account.');

const execute = async interaction => {
  const userId = interaction.user.id;
  const _userInfos = await userInfos.getUsers({
    guild_id: interaction.guildId,
    user_id: userId,
  });
  let near_wallet_ids = '';
  for (const _userInfo of _userInfos) {
    near_wallet_ids += _userInfo.dataValues.near_wallet_id + '\n';
  }
  // if the user doesn't connecte to any near wallet, it will reply the following content.
  if (!near_wallet_ids.trim()) {
    interaction.reply({
      content:'You are not connected to any Near wallet.',
      ephemeral: true,
    });
    // break hear;
    return;
  }
  interaction.reply({
    content:`${near_wallet_ids}`,
    ephemeral: true,
  });

};

module.exports = {
  data,
  execute,
};
