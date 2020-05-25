import * as program from 'commander';
import * as logger from './logger';
import * as clc from 'cli-color';
import * as leven from 'leven';
import * as utils from './utils';
import commands from './commands';
import errorOut from './error/errorOut';
import Motd from './motd';
const pkg = require('../package.json');

program.version(pkg.version);
program.option(
  '-P, --project <project_namespace>',
  'the TacoLab project to use for this command'
);
program.option('-j, --json', 'output JSON instead of text, also triggers non-interactive mode');
program.option('--token <token>', 'supply an auth token for this command');
program.option('--non-interactive', 'error out of the command instead of waiting for prompts');
program.option('-i, --interactive', 'force prompts to be displayed');
program.option('--debug', 'print verbose debug output and keep a debug log file');

const client: TacoLabClient = {
    cli: program,
    logger,
    errorOut,
    getCommand: (name: string) => {
        for (const command of client.cli.commands) {
          if (command._name === name) {
            return command;
          }
        }
        return null;
    }
};

// Setup commands
commands(client);

/**
 * Checks to see if there is a different command similar to the provided one.
 * This prints the suggestion and returns it if there is one.
 * @param {string} cmd The command as provided by the user.
 * @param {string[]} cmdList List of commands available in the CLI.
 * @return {string|undefined} Returns the suggested command; undefined if none.
 */
function suggestCommands(cmd: string, cmdList: string[]) {
    const suggestion = cmdList.find((c) => {
      return leven(c, cmd) < c.length * 0.4;
    });
    if (suggestion) {
        logger.error();
        logger.error('Did you mean ' + clc.bold(suggestion) + '?');
        return suggestion;
    }
}

// List command names
const commandNames = program.commands.map((cmd) => {
    return cmd._name;
});

// Default handler, this is called when no other command action matches.
program.action((_, args) => {
    utils.setupLoggers();

    // If no args, display MotD
    if (!args) {
        Motd.render();
        console.log(clc.bold(' TacoLab Tools was installed successfully!'));
        console.log(` To get help, type ${clc.bold('tacolab help')}\n`);
        console.log(` CLI Version: ${clc.blueBright(pkg.version)}`);
        console.log('');
        process.exit(0);
    }

    const cmd = args[0];
    logger.error(clc.bold.red('Error:'), clc.bold(cmd), 'is not a TacoLab command');

    // Check if the first argument is close to a command.
    if (!suggestCommands(cmd, commandNames)) {
        // Check to see if combining the two arguments comes close to a command.
        // e.g. `tacolab a b` may suggest `a:b`.
        suggestCommands(args.join(':'), commandNames);
    }

    process.exit(1);
});

export default client;