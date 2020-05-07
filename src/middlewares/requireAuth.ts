import { TacoLabError } from '../error/error';
import * as clc from 'cli-color';
import { configstore } from '../configstore';
import * as utils from '../utils';
import * as logger from '../logger';

const AUTH_ERROR_MESSAGE = `Command requires authentication, please run ${clc.bold(
    'tacolab login'
)}`;

export default (options: any) => {
    let auth_token;

    const tokens = configstore.get('tokens');
    const user = configstore.get('user');

    const tokenOpt = utils.getInheritedOption(options, 'token');
    if (tokenOpt) {
        logger.debug('> authorizing via --token option');
        auth_token = tokenOpt;
    } else if (process.env.TACOLAB_TOKEN) {
        logger.debug('> authorizing via TACOLAB_TOKEN environment variable');
        auth_token = process.env.TACOLAB_TOKEN;
    } else if (tokens) {
        logger.debug('> authorizing via signed-in user');
        auth_token = tokens.access_token;
    } else {
        throw new TacoLabError(AUTH_ERROR_MESSAGE);
    }

    options.user = user;
    options.tokens = tokens;
};
