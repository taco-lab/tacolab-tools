import { TacoLabError } from '../error/error';
import { Snowball } from '../snowball';

export default (snowball: Snowball) => {
    if (snowball.config) {
        return Promise.resolve();
    }
    return Promise.reject(
        snowball.configError ||
        new TacoLabError('Not in a TacoLab project directory (could not locate tacolab.json)', {
            exit: 1,
        })
    );
};