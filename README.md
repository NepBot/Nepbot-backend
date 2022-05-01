# Nepbot backend

## Detail of the project
├── <big>_**commands**_</big>   every commands of bot will store in this folder.  
├──  <big>_**conf**_</big>    the config file will load from this folder.  
├──  <big>_**controller**_</big>    api folder.  
├──  <big>_**events**_</big>    every events of discord bot will access this folder to moniter those activity.  
├──  <big>_**logs**_</big>    store log file.  
├──  <big>_**pkg**_</big>   including the object (etc. user_info, user_fields), modules like db driver(mysql, postgrl), other tools  
├──  <big>_**schedule_tasks**_</big>    all of the time task   
├──  <big>_**service**_</big>   three services. bot, app, schedule_tasks  
├──  <big>_**.env**_</big>    secret infomation.  
├──  <big>_**index.js**_</big>    main class  
└──  <big>_**deploy-commands.js**_</big>    deploy commands. Commanly used for test or develop a new command.

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