import * as fs from 'fs';
import * as path from 'path';
import { TacoLabError } from '../error/error';
import { Snowball } from '../snowball';

export default (snowball: Snowball) => {
    if (snowball.config && snowball.projectRoot) {
        // Check app dir
        snowball.absoluteAppDir = path.join(snowball.projectRoot, snowball.config.app_dir);
        if (!fs.existsSync(snowball.absoluteAppDir)) {
            return Promise.reject(`App directory '${snowball.absoluteAppDir}' does not exists. Update it into tacolab.json`);
        }
        if (fs.lstatSync(snowball.absoluteAppDir).isFile()) {
            return Promise.reject(`App directory '${snowball.absoluteAppDir}' is not a directory. Update it into tacolab.json`);
        }

        return Promise.resolve();
    }

    return Promise.reject(
        snowball.configError ||
        new TacoLabError('Not in a TacoLab project directory (could not locate tacolab.json)', {
            exit: 1,
        })
    );
};