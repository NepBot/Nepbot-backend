const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');
const { getCollection } = require('../../pkg/utils/paras_api');
const client = require('../discord_bot');
const update_guild_task = async function(receipts) {
	const actions = await contractUtils.filterCollectionActions(receipts);
    for (const action of actions) {
        const collectionId = action.contract_type + ":" + actions.outer_collection_id
        const collection = await getCollection(collectionId)
        if (!collection) {
            continue
        }
        const command = client.commands.get("mint")
        command.addStringOption().setName(actions.outer_collection_id.split("-")[0])
    }

};

module.exports = update_guild_task;