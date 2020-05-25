import * as clc from 'cli-color';
import * as os from 'os';
import { Command } from '../command';
import * as logger from '../logger';
import { configstore } from '../configstore';
import * as utils from '../utils';
import * as ora from 'ora';
import * as prompt from '../prompt';
import { TacoLabError } from '../error/error';
import { API } from '../api';
import * as requireAuth from '../middlewares/requireAuth';
import Config from '../config';
import Motd from '../motd';
import * as path from 'path';
import { Project } from '../models/Project';
import { Topping } from '../models/Topping';
import { Cdn } from '../models/Cdn';
import { Snowball } from '../snowball';

module.exports = new Command('init')
  .description('setup a TacoLab topping in the current directory')
  .before(requireAuth)
  .action(async (snowball: Snowball) => {
    const cwd = snowball.cmd.cwd || process.cwd();
    const homeDir = os.homedir();

    // Fetch projects list
    const projects: Project[] = await API.request('GET', '/projects');
    logger.debug('Loaded projects:');
    logger.debug(JSON.stringify(projects));

    const warnings = [];
    let warningText = '';
    if (utils.isOutside(homeDir, cwd)) {
      warnings.push('You are currently outside your home directory');
    }
    if (cwd === homeDir) {
      warnings.push('You are initializing your home directory as a TacoLab topping');
    }

    let config = Config.load(snowball.cmd.cwd, true);
    if (!config) {
        const configPath = path.join(cwd, Config.FILENAME);
        config = new Config(configPath);
    } else {
        warnings.push('You are initializing in an existing TacoLab topping directory');
    }

    if (warnings.length) {
        warningText =
            '\n\nWARNING:\n  ' +
            clc.yellow.bold('* ') +
            warnings.join('\n  ' + clc.yellow.bold('* ')) +
            '\n';
    }

    Motd.render();
    logger.info(
        '\nYou\'re about to initialize a TacoLab topping in this directory:\n\n  ' +
        clc.bold(cwd) +
        '\n' + warningText
    );

    logger.info(
        '\n' +
        clc.bold('=== Topping Setup') +
        '\n\nFirst, let\'s associate this directory with a TacoLab topping.\n'
    );

    // Select Project
    if (projects.length === 0) {
        utils.logWarning('You do not have projects in your TacoLab account.');
        process.exit(1);
    }
    const project_id = await prompt.promptOnce({
        type: 'list',
        name: 'project_id',
        message: 'Please select a projet:',
        choices: projects.map((project) => ({
            value: project.id,
            name: `${project.name} (${project.namespace})`
        }))
    });
    config.project_id = parseInt(project_id, 10);

    // Select Topping
    const spinner = ora('Loading toppings...').start();
    let toppings: Topping[] = await API.request('GET', `/projects/${project_id}/toppings`);
    spinner.stop();

    // Remove non deployable toppings
    toppings = toppings.filter((e) => {
        return e.image_version?.image.is_deployable;
    });

    if (toppings.length === 0) {
        utils.logWarning('You do not have deployable toppings in this TacoLab project.');
        process.exit(1);
    }

    config.topping_id = await prompt.promptOnce({
        type: 'list',
        name: 'topping_id',
        message: 'Please select a topping to associate:',
        choices: toppings.map((topping) => ({
            value: topping.id,
            name: `${topping.name} [${topping.image_version?.image.name}]`
        }))
    });

    logger.info();
    utils.logBullet(`Writing configuration info to ${clc.bold('tacolab.json')}...`);
    config.save();

    logger.info();
    utils.logSuccess('TacoLab initialization complete!');
  });