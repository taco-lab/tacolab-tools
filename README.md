# TacoLab CLI Tools

The TacoLab Command Line Interface (CLI) Tools can be used to test, manage, and deploy your TacoLab project from the command line.  
  
- Deploy code and assets to your TacoLab projects
  
To get started with the TacoLab CLI, read the full list of commands below or check out the documentation.

## Installation
You can install the TacoLab CLI using npm (the Node Package Manager). Note that you will need to install
[Node.js](http://nodejs.org/) and [npm](https://npmjs.org/). Installing Node.js should install npm as well.

To download and install the TacoLab CLI run the following command:

```bash
npm install -g @tacolab/tools
```

This will provide you with the globally accessible `tacolab` command.

## Commands
**The command `tacolab --help` lists the available commands and `tacolab <command> --help` shows more details for an individual command.**

If a command is project-specific, you must either be inside a project directory with an
active project alias or specify the TacoLab project id with the `-P <project_id>` flag.

Below is a brief list of the available commands and their function:

### Configuration Commands

| Command | Description |
| ------- | ----------- |
| **login**    | Authenticate to your TacoLab account. |
| **logout**   | Sign out of the TacoLab CLI. |
<!-- | **init**     | Setup a new TacoLab project in the current directory. This command will create a `tacolab.json` configuration file in your current directory. | -->
| **help**     | Display help information about the CLI or specific commands. |