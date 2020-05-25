import * as clc from 'cli-color';
import * as path from 'path';
import * as fs from 'fs';
import { TacoLabError } from './error/error';
const cjson = require('cjson');

type Configuration = {
  project_id: number;
  topping_id: number;
  app_dir: string;
};

export default class Config {
    static FILENAME = 'tacolab.json';

    static load = (projectRoot: string | undefined, allowMissing: boolean = false) => {
        if (projectRoot) {
          try {
            const configPath = path.join(projectRoot, Config.FILENAME);
            const data = cjson.load(configPath);
            return new Config(configPath, data);
          } catch (e) {
            throw new TacoLabError('There was an error loading tacolab.json:\n\n' + e.message, {
              exit: 1,
            });
          }
        }

        if (allowMissing) {
          return undefined;
        }

        throw new TacoLabError(`Not in a TacoLab app directory (could not locate tacolab.json).
Run ${clc.bold('tacolab init')} to initialize topping here.`, {
          exit: 1,
        });
    }

    constructor(protected configPath: string,
                protected data: Configuration = {project_id: 0, topping_id: 0, app_dir: ''}) {

    }

    get project_id(): number { return this.data.project_id; }
    set project_id(project_id: number) { this.data.project_id = project_id; }

    get topping_id(): number { return this.data.topping_id; }
    set topping_id(topping_id: number) { this.data.topping_id = topping_id; }

    get app_dir(): string { return this.data.app_dir; }
    set app_dir(app_dir: string) { this.data.app_dir = app_dir; }

    save() {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 4), 'utf8');
    }
}
