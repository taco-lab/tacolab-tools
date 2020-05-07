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

    return client;
};