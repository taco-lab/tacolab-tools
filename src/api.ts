import * as request from 'request';
import * as logger from './logger';
import { TacoLabError } from './error/error';

const API_URL = `http://localhost:8002/api/v1`;

export class API {

    static request(method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH', endpoint: string, data?: any): Promise<any> {
        const options = {
            url: `${API_URL}${endpoint}`,
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: data,
            json: true,
        };

        logger.debug('>>> HTTP REQUEST', options);

        return new Promise((resolve) => {
            request(options, (error, response, body) => {
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