import * as clc from 'cli-color';
import { Command } from '../command';
import * as logger from '../logger';
import * as crypto from 'crypto';
import { configstore } from '../configstore';
import * as ora from 'ora';
import * as utils from '../utils';
import { TacoLabError } from '../error/error';
import * as prompt from '../prompt';
import { API } from '../api';

/**
 * SERVER CONFIGURATION
 */
const AUTH_PASSWORD_SALT = '358VemtbdXFv4Sd6MXC45ub2H2nRbM64';
const AUTH_CLIENT_ID = 2;
const AUTH_CLIENT_SECRET = 'VU7hfgUjl5XzKYqgRIkBsyA3QuSh7uIT2ITfEVRK';

module.exports = new Command('login')
  .description('log the CLI into TacoLab')
  .option('--reauth', 'force reauthentication even if already logged in')
  .action(async (options: any) => {
    if (options.nonInteractive) {
        throw new TacoLabError(
            'Cannot run login in non-interactive mode.',
            { exit: 1 }
        );
    }

    const user = configstore.get('user');
    const tokens = configstore.get('tokens');

    if (user && tokens && !options.reauth) {
      logger.info('Already logged in as', clc.bold(user.email));
      logger.info('Use', clc.bold('tacolab login --reauth'), 'to force reauthentication');
      return user;
    }

    // Ask account credentials
    const credentials = await prompt.prompt({}, [
        {
            type: 'input',
            name: 'email',
            message: 'TacoLab account email:',
            filter: (input: string) => {
                if (input.length === 0 || !utils.EMAIL_REGEX.test(input)) {
                    return Promise.reject('You should enter valid email')
                }

                return Promise.resolve(input);
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Account password:',
            filter: (input: string) => {
                if (input.length === 0) {
                    return Promise.reject('You should enter password')
                }

                return Promise.resolve(input);
            }
        }
    ]);

    // hash password
    credentials.password = crypto.createHash('sha256')
                                 .update(`${AUTH_PASSWORD_SALT}${credentials.password}`)
                                 .digest('hex');

    // prepare OAUTH
    credentials.username = credentials.email;
    credentials.grant_type = 'password';
    credentials.client_id = AUTH_CLIENT_ID;
    credentials.client_secret = AUTH_CLIENT_SECRET;
    credentials.scope = '*';

    // Authenticate
    const spinner = ora('Authenticating...').start();
    API.request(options, 'POST', '/auth/oauth', credentials).then(async (res) => {
        spinner.stop();

        // parse response
        if (res && res.access_token) {
            // Authentication succeeded
            onAuthSucceeded(credentials.email, res);
        } else if (res && res.error === 'INVALID_CREDENTIALS') {
            utils.logWarning('Authentication failed (invalid credentials)');
        } else if (res && res.error === 'USER_BLOCKED') {
            utils.logWarning('Authentication failed (blocked account)');
        } else if (res && res.error === 'TOTP_REQUIRED') {
            // Ask TOTP
            const totp = await prompt.promptOnce({
                type: 'input',
                name: 'totp',
                message: 'Enter 2-factor authentication 6-digits code (TOTP):',
                filter: (input: string) => {
                    if (input.length !== 6) {
                        return Promise.reject('You should enter valid 6-digits TOTP')
                    }

                    return Promise.resolve(input);
                }
            });

            // Try another authentication
            credentials.totp = `${totp}`;
            spinner.start();
            API.request(options, 'POST', '/auth/oauth', credentials).then(async (res2) => {
                spinner.stop();

                // parse response
                if (res2 && res2.access_token) {
                    // Authentication succeeded
                    onAuthSucceeded(credentials.email, res2);
                } else if (res2 && res2.error === 'INVALID_TOTP') {
                    utils.logWarning('Authentication failed (invalid 6-digits TOTP code)');
                } else {
                    utils.logWarning('Authentication failed');
                }
            });
        } else {
            utils.logWarning('Authentication failed');
        }
    });
  });

function onAuthSucceeded(email: string, tokens: any) {
    // Store generated tokens
    configstore.set('tokens', {
        ...tokens,
        expires_at: new Date().getTime() + tokens.expires_in * 1000
    });

    // Store user email address
    configstore.set('user', {
        email
    });

    // OK
    utils.logSuccess(`Authentication succeeded as ${clc.bold(email)}`);
}