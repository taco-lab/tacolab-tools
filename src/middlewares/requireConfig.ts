import { TacoLabError } from '../error/error';

export default (options: any) => {
    if (options.config) {
        return Promise.resolve();
    }
    return Promise.reject(
        options.configError ||
        new TacoLabError('Not in a TacoLab project directory (could not locate tacolab.json)', {
            exit: 1,
        })
    );
};