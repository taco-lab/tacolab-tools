export default (client: any) => {
    const loadCommand = (name: string) => {
      let cmd = require('./' + name);

      // .ts commands export at .default.
      if (cmd.default) {
        cmd = cmd.default;
      }

      // Register client into command
      cmd.register(client);
      return cmd.runner();
    };

    client.help = loadCommand('help');
    client.login = loadCommand('login');
    client.logout = loadCommand('logout');
    client.init = loadCommand('init');
    client.deploy = loadCommand('deploy');

    return client;
};