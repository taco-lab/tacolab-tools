import { TacoLabError } from '../error/error';
import { API } from '../api';
import * as ora from 'ora';
import { Snowball } from '../snowball';

let spinner: any;

export default async (snowball: Snowball) => {
    spinner = ora('Loading project...').start();

    if (!snowball.config) {
        return error('missing configuration');
    }

    if (!snowball.config.project_id || !snowball.config.topping_id) {
        return error('missing project_id or topping_id');
    }

    // Load topping
    snowball.topping = await API.request('GET', `/projects/${snowball.config.project_id}/toppings/${snowball.config.topping_id}`);

    // Check loaded resource
    if (!snowball.topping || (snowball.topping as any).error || (snowball.topping as any).exception) {
        return error('invalid topping');
    }

    // OK
    spinner.stop();
    return Promise.resolve();
};

function error(message: string) {
    spinner.stop();
    return Promise.reject(
        new TacoLabError(`TacoLab project configuration seems to be invalid (${message})`, {
            exit: 1,
        })
    );
}