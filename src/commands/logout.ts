import * as clc from 'cli-color';
import { Command } from '../command';
import * as logger from '../logger';
import { configstore } from '../configstore';
import * as utils from '../utils';
import { TacoLabError } from '../error/error';
import { API } from '../api';

module.exports = new Command('logout')
  .description('log the CLI out of TacoLab')
  .action(async (options: any) => {
    if (options.nonInteractive) {
        throw new TacoLabError(
            'Cannot run login in non-interactive mode.',
            { exit: 1 }
        );
    }

    const user = configstore.get('user');
    const tokens = configstore.get('tokens');

    if (!user || !tokens) {
        logger.info('Already logged out');
        logger.info('Use', clc.bold('tacolab login'), 'to reauthenticate');
        return user;
    }

    options.tokens = tokens;

    // Revoke token
    API.request(options, 'DELETE', '/auth/logout');

    // Clear config
    configstore.delete('user');
    configstore.delete('tokens');

    // OK
    utils.logSuccess(`Logged out from ${clc.bold(user.email)}`);
  });