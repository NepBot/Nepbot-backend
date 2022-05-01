# Nepbot backend

## Detail of the project
|-- commands    every commands of bot will store in this folder.
|-- conf    the config file will load from this folder.
|-- controller    api folder.
|-- events    every events of discord bot will access this folder to moniter those activity.
|-- logs    store log file
|-- pkg   including the object (etc. user_info, user_fields), modules like db driver(mysql, postgrl), other tools
|-- schedule_tasks    all of the time task 
|-- service   three services. bot, app, schedule_tasks
|-- .env    secret infomation.
|-- index.js    main class
|-- deploy-commands.js    deploy commands. Commanly used for test or develop a new command.

## Note
If you need to execute this project, the config.json in config and .env file is needed. Please contact with project mananger.

## Local debug 
### the environment
discord bot, mysql, config.json, .env
### method
once your parper all the file needed to start this project, it just need to run `node index.js` in the root path.

## product running
### the environment
same env with local test
### method
same with local test