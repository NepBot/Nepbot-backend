# Nepbot backend

This repository contains the code for the backend of Nepbot, a discord bot for the Near blockchain community. The Guild Owner in a Discord Guild can use command to generate rules and bind them to the roles. The bot will check the user's on-chain assets and status to decide whether the user can access the role or not. In the meanwhile, members in the Guild can also use Nepbot's commands to check certain information on the Near blockchain. Details can be found in the command folder.

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
* [Authors](#authors)

## Service
### Commands
* [verify](./service/commands/verify.js)  
  Connect your NEAR wallet to verify your on-chain assets and status on Near protocol.
* [setrule](./service/commands/setrule.js)  
  Set token-gated rules for roles in this server.
* [set_twitter_rule](./service/commands/set_twitter_rule.js)  
  Set Twitter rules for roles in this server.
* [check_proposal](./service/commands/check_proposal.js)  
  Check DAO proposals on AstroDao.
* [checkwallet](./service/commands/checkwallet.js)  
  Show the NEAR wallet currently connected to your account.
* [create_snapshot](./service/commands/create_snapshot.js)  
  Create a snapshot based on the current block height and a contract address.
* [createnft](./service/commands/createnft.js)  
  Create an NFT collection or add collectibles to existing collections.
* [listcollections](./service/commands/listcollections.js)  
  List existing NFT collections for this server.
* [mint](./service/commands/mint.js)  
  Mint an NFT from an NFT collection in this server.
* [paras_leaderboard](./service/commands/paras_leaderboard.js)  
  Tracking the leaderboard on Paras OR input a account_id to track your rank on the leaderboard.
* [paras_staking](./service/commands/paras_reward.js)  
  Tracking your staking status on Paras.
* [ft_airdrop](./service/commands/ft_airdrop.js)  
  Airdrop a specific fungible token (NEP-141) on NEAR.
* [poll](./service/commands/poll.js)  
  Create a poll for the server.

### Controllers
* [block_chain](./service/controllers/block_chain.js)  
  When using some commands, users need to interact with temporary links that expire after 5 mins. This file is used to generate a signature.
* [discord_api](./service/controllers/discord_api.js)  
  This file is used to interact with the Nepbot frontend, and also used to send messages to the Discord Guild via frontend.
* [indexer_api](./service/controllers/indexer_api.js)  
  This file is used to interact with the NEAR Indexer.
* [paras](./service/controllers/paras.js)  
  This file is used to interact with the Paras API.
* [twitter](./service/controllers/twitter.js)  
  This file is used to interact with the Twitter API.
* [user](./service/controllers/user.js)  
  This file is used to interact with the frontend to get the user info in the Discord Guild.

### Discord_actions
* [guildCreate](./service/discord_actions/guildCreate.js)  
  The file in this folder is used to handle the event when the bot joins a new guild.
* [interactionCreate](./service/discord_actions/interactionCreate.js)  
  The file in this folder is used to handle the event when a user uses the command in the guild.

### Events
* [events](./service/events)  
  The file in this folder is used to handle the event when a user joins the guild.
  All the events can be found in the https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-channelCreate

### Schedule_tasks
* [schedule_tasks](./service/schedule_tasks)  
  Using Near Lake to get data from the Near blockchain, and then filtering it to get the data we need. The data will be used for the rules.

## Pkg
### Modules
* [db_driver](./pkg/modules/db_driver)  
  This file is used to connect to the mysql database that includes Near on chain data.
* [object](./pkg/modules/object)  
  This file is used to generate the object for the database.

### utils
* [utils](./pkg/utils)  
  This folder is used to store the utils for the project.
  Each platform has different ways to interact with the blockchain, so generating specific utils to interact with them is necessary.

## Note
If you need to execute this project, the [near_net_sample.json](./conf/near_net_sample.json) and [.env_sample](./.env_sample) files are needed, there is a sample file in the current folder. Don't forget to rename the both file by deleting `_sample`.

## Local debug
1. Apply for a Discord Bot and get the token from https://discord.com/developers/applications
2. Apply for a Twitter Developer account and get the token from https://developer.twitter.com/en/portal/dashboard
3. Using the url to connect to the mysql database.
4. Install the dependencies.
  ```bash
  npm install --save
  ```
5. Run the project.
 ```bash
 node index.js
 ```

## Authors
[Nepbot Team](https://github.com/NepBot)