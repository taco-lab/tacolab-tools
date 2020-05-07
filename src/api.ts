import * as request from 'request';
import * as logger from './logger';
import { TacoLabError } from './error/error';

const API_URL = `http://localhost:8002/api/v1`;

export class API {

    static request(options: any, method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH', endpoint: string, data?: any): Promise<any> {
        const opt = {
            url: `${API_URL}${endpoint}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                Authentication: ''
            },
            body: data,
            json: true,
        };

        // Append auth JWT token
        if (options.tokens && options.tokens.access_token) {
            opt.headers.Authentication = `Bearer ${options.tokens.access_token}`;
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

                resolve(body);
            });
        });
    }

}