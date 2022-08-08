const yargs = require("yargs")
const appRoot = require('app-root-path');
const fs = require('node:fs');
const scriptsDir = `${ appRoot }/scripts`;

const scriptFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.js'));
const scriptNames = []

for (const file of scriptFiles) {
    scriptNames.push(file.replace(".js", ""))
}

async function init() {
    const yargsObj = yargs
    .scriptName("nepbot-cli")
    .usage('$0 <cmd> [args]')
    // .options({ 
    //   accountId: { 
    //     type: 'string',
    //     describe: 'account ID',
    //     alias: 'a', 
    //     hidden: false,
    //   }
    // })
    for (let scriptName of scriptNames) {
        const script = require(`${scriptsDir}/${scriptName}.js`)
        let commandStr = `${scriptName}`
        for (arg of script.params.args) {
            commandStr += ` [${arg.name}]`
        }
        yargsObj.command(commandStr, (yargs) => {
            for (arg of scriptsDir.params.args) {
                yargs.positional(args.name, {
                    type: arg.type,
                    describe: args.describe
                })
            }
        }, async function (argv) {
            await script.execute(argv)
        })
    }
    yargsObj.argv
  }
  
  init()