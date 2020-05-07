import * as clc from 'cli-color';
import * as path from 'path';
import { TacoLabError } from './error/error';
import { detectProjectRoot } from './utils';
const cjson = require('cjson');

// var fsutils = require("./fsutils");
// var loadCJSON = require("./loadCJSON");
// var parseBoltRules = require("./parseBoltRules");
// var { promptOnce } = require("./prompt");
// var { resolveProjectPath } = require("./projectPath");
// var utils = require("./utils");

export default class Config {
    static FILENAME = 'tacolab.json';

    static load = (options: any, allowMissing: boolean = false) => {
        const pd = detectProjectRoot(options.cwd);
        if (pd) {
          try {
            const data = cjson.load(path.join(pd, Config.FILENAME));
            return new Config(data, options);
          } catch (e) {
            throw new TacoLabError('There was an error loading tacolab.json:\n\n' + e.message, {
              exit: 1,
            });
          }
        }

        if (allowMissing) {
          return null;
        }

        throw new TacoLabError('Not in a TacoLab app directory (could not locate tacolab.json)', {
          exit: 1,
        });
    }

    constructor(protected data: any, options: any) {

    }
}
