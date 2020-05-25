import Config from './config';
import { TacoLabError } from './error/error';
import { Topping } from './models/Topping';

export class Snowball {
    public interactive = true;
    public debug = false;

    public projectRoot?: string;
    public absoluteAppDir?: string;
    public config?: Config;
    public configError?: TacoLabError;

    public topping?: Topping;

    constructor(public cmd: any) {}

    get nonInteractive(): boolean {
        return !this.interactive;
    }
}