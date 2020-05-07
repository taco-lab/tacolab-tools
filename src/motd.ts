import * as clc from 'cli-color';
const pkg = require('../package.json');

export default class Motd {
    static render() {
        console.log('');
        console.log(`''''''''__________________ __''''''''`);
        console.log(`'''''''/                  \\  \\'''''''`);
        console.log(`''''''/                    \\  \\''''''`);
        console.log(`'''''|    TACOLAB TOOLS     |  |'''''`);
        console.log(`'''''|                      |  |'''''`);
        console.log(`''''''\\______________________\\/''''''`);
        console.log('');
        console.log(clc.bold(' TacoLab Tools was installed successfully!'));
        console.log(` To get help, type ${clc.bold('tacolab help')}\n`);
        console.log(` CLI Version: ${clc.blueBright(pkg.version)}`);
        console.log('');
    }
}
