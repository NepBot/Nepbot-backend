# Nepbot backend

This repository contains the code for the backend of Nepbot, a discord bot for the Near blockchain community. The manager in discord guild can use command to generate rules and bind them to the roles. The bot will check the user's roles and the rules to decide whether the user can access the channel. Otherwise, the user in the guild can also use the command to check the information on the Near blockchain. The detail can be found in the command folder.

## Contents:
* [Service](#service)
  * [Commands](#commands)
  * [Controllers](#controllers)
  * [Discord_actions](#discord_actions)
  * [Events](#events)
  * [Schedule_tasks](#schedule_tasks)
* [Pkg](#pkg)
  * [Modules](#modules)
  * [utils](#utils)
* [Note](#note)
* [Local debug](#local-debug)

## Service
### Commands
* [verify](./service/commands/verify.js)  
  Connect your NEAR wallet to verify your on-chain assets on Near protocol.
* [setrule](./service/commands/setrule.js)  
  Set token-gated rules for roles in this server.
* [set_twitter_rule](./service/commands/set_twitter_rule.js)
  Set twitter rules for roles in this server.
* [check_proposal](./service/commands/check_proposal.js)
  Check the proposal on AstroDao.
* [checkwallet](./service/commands/checkwallet.js)
  Show the NEAR wallet currently connected to your account.
* [create_snapshot](./service/commands/create_snapshot.js)
  Create a snapshot based on currently block_height and your contract_address.
* [createnft](./service/commands/createnft.js)
  Create a NFT collection or add collectibles to existing collections.
* [listcollections](./service/commands/listcollections.js)
  List existing NFT collections for this server.
* [mint](./service/commands/mint.js)
  Mint an NFT from an NFT collection in this server.
* [paras_leaderboard](./service/commands/paras_leaderboard.js)
  Tracking the leader board on paras OR input a account_id to track your rank.
* [paras_staking](./service/commands/paras_reward.js)
  Tracking your staking status on paras
* [ft_airdrop](./service/commands/ft_airdrop.js)
  Airdrop a specific fungible token (NEP-141) on NEAR.
* [poll](./service/commands/poll.js)
  Create a poll for the server.

### Controllers
* [block_chain](./service/controllers/block_chain.js)  
  For some command, it need to interact with the link, so this file user to generate a signature.
* [discord_api](./service/controllers/discord_api.js)
  This file is used to interact with the Nepbot frontend, and it also used to send message to the discord guild by frontend.
* [indexer_api](./service/controllers/indexer_api.js)
  This file is used to interact with the NEAR Indexer.
* [paras](./service/controllers/paras.js)
  This file is used to interact with the Paras API.
* [twitter](./service/controllers/twitter.js)
  This file is used to interact with the Twitter API.
* [user](./service/controllers/user.js)
  This file is used to interact with the frontend to get the user info in the discord guild.

### Discord_actions
* [guildCreate](./service/discord_actions/guildCreate.js)
  The file in this folder is used to handle the event when the bot join a new guild.
* [interactionCreate](./service/discord_actions/interactionCreate.js)
  The file in this folder is used to handle the event when the user use the command in the guild.

### Events
* [events](./service/events)
  The file in this folder is used to handle the event when the user join the guild.
  All the events can be found in the https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-channelCreate

### Schedule_tasks
* [schedule_tasks](./service/schedule_tasks)
  Using Near Lake to get the data from the Near blockchain, and then filter the data to get the data we need. The data will be used for the rules.

## Pkg
### Modules
* [db_driver](./pkg/modules/db_driver)
  This file is used to connect to the mysql database, and Near index database.
* [object](./pkg/modules/object)
  This file is used to generate the object for the database.

### utils
* [utils](./pkg/utils)
  This file is used to generate the utils for the project.
  Each platform has different way to interact withe the blockchain, so we need to generate specific utils for them.

## Note
If you need to execute this project, the [near_net_sample.json](./conf/near_net_sample.json) and [.env_sample](./.env_sample) file is needed, there is a sample file in the currently folder. Don't forget to rename the both file by deleting `_sample`.

## Local debug
1. Apply for a discord bot and get the token from https://discord.com/developers/applications
2. Apply for a twitter developer account and get the token from https://developer.twitter.com/en/portal/dashboard
3. Using url to connect to the mysql database.
4. install the dependencies.
  ```bash
  npm install --save
  ```
5. run the project.
 ```bash
 node index.js
 ```
