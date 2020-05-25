import * as clc from 'cli-color';
import * as request from 'request';
import * as logger from './logger';
import { TacoLabError } from './error/error';
import { configstore } from './configstore';

const API_URL = `http://localhost:8002/api/v1`;

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';

export class API {
    static AUTH_PASSWORD_SALT = '358VemtbdXFv4Sd6MXC45ub2H2nRbM64';
    static AUTH_CLIENT_ID = 2;
    static AUTH_CLIENT_SECRET = 'VU7hfgUjl5XzKYqgRIkBsyA3QuSh7uIT2ITfEVRK';

    static request(method: Method, endpoint: string, data?: any, renew_if_unauthenticated: boolean = true): Promise<any> {
        const opt = {
            url: `${API_URL}${endpoint}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: ''
            },
            body: data,
            json: true,
        };

        // Fetch tokens
        const tokens = configstore.get('tokens');

        // Append auth JWT token
        if (tokens && tokens.access_token) {
            opt.headers.Authorization = `Bearer ${tokens.access_token}`;
        }

        logger.debug('>>> HTTP REQUEST', opt);

        return new Promise((resolve) => {
            request(opt, (error, response, body) => {
                if (error) {
                    throw new TacoLabError('Oops, an error occured. Please try again later.', {
                        exit: 2,
                        original: error
                    });
                }

                // If unauthenticated...
                if (response.statusCode === 401) {
                    logger.debug('/!\\ Received 401 UNAUTHENTICATED response');
                    if (renew_if_unauthenticated && tokens && tokens.refresh_token) {
                        logger.debug('Trying to renew auth token...');

                        // Try to renew auth token
                        API.request('POST', '/auth/oauth/refresh', {
                            grant_type: 'refresh_token',
                            refresh_token: tokens.refresh_token,
                            client_id: API.AUTH_CLIENT_ID,
                            client_secret: API.AUTH_CLIENT_SECRET,
                            scope: '*',
                        }, false).then((res) => {
                            // If OK, store renewed auth tokens
                            if (res && res.access_token) {
                                logger.debug('Refreshed token successfully.\n');

                                configstore.set('tokens', {
                                    ...res,
                                    expires_at: new Date().getTime() + res.expires_in * 1000
                                });

                                // ...and resolve with new request
                                API.request(method, endpoint, data, false).then(
                                    (newReqRes) => resolve(newReqRes)
                                );
                                return;
                            } else {
                                logger.debug('Failed to refresh token.');
                                logger.debug(JSON.stringify(res));

                                // Log out
                                configstore.delete('user');
                                configstore.delete('tokens');

                                throw new TacoLabError(`Command requires authentication, please run ${clc.bold(
                                    'tacolab login'
                                )}`, {
                                    exit: 1
                                });
                                return;
                            }
                        });
                    } else {
                        logger.debug('Logging out...');

                        // Log out
                        configstore.delete('user');
                        configstore.delete('tokens');

                        throw new TacoLabError(`Command requires authentication, please run ${clc.bold(
                            'tacolab login'
                        )}`, {
                            exit: 1
                        });
                    }

                    return;
                }

                // Debug received data
                logger.debug(`<<< STATUS:${response.statusCode}:\n${JSON.stringify(body)}`);

                resolve(body);
            });
        });
    }

}