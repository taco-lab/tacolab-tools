import { bold } from 'cli-color';
import { CommanderStatic } from 'commander';

import { TacoLabError } from './error/error';
import { getInheritedOption, setupLoggers, detectProjectRoot } from './utils';
import { configstore } from './configstore';
import clc = require('cli-color');
import Config from './config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionFunction = (...args: any[]) => any;

interface BeforeFunction {
  fn: ActionFunction;
  args: any[];
}

interface CLIClient {
  cli: CommanderStatic;
  errorOut: (e: Error) => void;
}

/**
 * Command is a wrapper around commander to simplify our use of promise-based
 * actions and pre-action hooks.
 */
export class Command {
  private name = '';
  private descriptionText = '';
  private options: any[][] = [];
  private befores: BeforeFunction[] = [];
  private helpText = '';
  private client?: CLIClient;
  private actionFn: ActionFunction = (): void => {};

  /**
   * @param cmd the command to create.
   */
  constructor(private cmd: string) {
    this.name = cmd.split(' ')[0] || '';
  }

  /**
   * Sets the description of the command.
   * @param t a human readable description.
   * @return the command, for chaining.
   */
  description(t: string): Command {
    this.descriptionText = t;
    return this;
  }

  /**
   * Sets any options for the command.
   *
   * @example
   *   command.option('-d, --debug', 'turn on debugging', false)
   *
   * @param args the commander-style option definition.
   * @return the command, for chaining.
   */
  option(...args: any[]): Command {
    this.options.push(args);
    return this;
  }

  /**
   * Attaches a function to run before the command's action function.
   * @param fn the function to run.
   * @param args arguments, as an array, for the function.
   * @return the command, for chaining.
   */
  before(fn: {default: ActionFunction}, ...args: any[]): Command {
    this.befores.push({ fn: fn.default, args });
    return this;
  }

  /**
   * Sets the help text for the command.
   *
   * This text is displayed when:
   *   - the `--help` flag is passed to the command, or
   *   - the `help <command>` command is used.
   *
   * @param t the human-readable help text.
   * @return the command, for chaining.
   */
  help(t: string): Command {
    this.helpText = t;
    return this;
  }

  /**
   * Sets the function to be run for the command.
   * @param fn the function to be run.
   * @return the command, for chaining.
   */
  action(fn: ActionFunction): Command {
    this.actionFn = fn;
    return this;
  }

  /**
   * Registers the command with the client. This is used to inisially set up
   * all the commands and wraps their functionality with analytics and error
   * handling.
   * @param client the client object (from src/index.js).
   */
  register(client: CLIClient): void {
    this.client = client;
    const program = client.cli;
    const cmd = program.command(this.cmd);
    if (this.descriptionText) {
      cmd.description(this.descriptionText);
    }
    this.options.forEach((args) => {
      const flags = args.shift();
      cmd.option(flags, ...args);
    });

    if (this.helpText) {
      cmd.on('--help', () => {
        console.log(this.helpText);
      });
    }

    // args is an array of all the arguments provided for the command PLUS the
    // options object as provided by Commander (on the end).
    cmd.action((...args: any[]) => {
      const runner = this.runner();

      // We do not want to provide more arguments to the action functions than
      // we are able to - we're not sure what the ripple effects are. Our
      // action functions are supposed to be of the form (options, ...args)
      // where `...args` are the <required> and [optional] arguments of the
      // command. Therefore, if we check the number of arguments we have
      // against the number of arguments the action function has, we can error
      // out if we would provide too many.
      // TODO(bkendall): it would be nice to not depend on this internal
      //   property of Commander, but that's the limitation we have today. What
      //   we would like is the following:
      //   > if (args.length > this.actionFn.length)
      if (args.length - 1 > cmd._args.length) {
        client.errorOut(
          new TacoLabError(
            `Too many arguments. Run ${bold('tacolab help ' + this.name)} for usage instructions`,
            { exit: 1 }
          )
        );
        return;
      }

      runner(...args)
        .catch(async (err) => {
          client.errorOut(err);
        });
    });
  }

  /**
   * Extends the options with various properties for use in commands.
   * @param options the command options object.
   */
  private prepare(options: any): void {
    options = options || {};
    options.project = getInheritedOption(options, 'project');

    if (!process.stdin.isTTY || getInheritedOption(options, 'nonInteractive')) {
      options.nonInteractive = true;
    }
    // allow override of detected non-interactive with --interactive flag
    if (getInheritedOption(options, 'interactive')) {
      options.interactive = true;
      options.nonInteractive = false;
    }

    if (getInheritedOption(options, 'debug')) {
      options.debug = true;
    }

    if (getInheritedOption(options, 'json')) {
      options.nonInteractive = true;
    } else {
      setupLoggers();
    }

    // Load tacolab.json configuration
    try {
      options.config = Config.load(options);
    } catch (e) {
      options.configError = e;
    }

    // Validate project namespace
    options.projectRoot = detectProjectRoot(options.cwd);
    if (options.project) validateProjectNamespace(options.project);
  }

  /**
   * Returns an async function that calls the pre-action hooks and then the
   * command's action function.
   * @return an async function that executes the command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runner(): (...a: any[]) => Promise<void> {
    return async (...args: any[]) => {
      // always provide at least an empty object for options
      if (args.length === 0) {
        args.push({});
      }
      const options = args[args.length-1];
      this.prepare(options);
      for (const before of this.befores) {
        await before.fn(options, ...before.args);
      }
      return this.actionFn(...args);
    };
  }
}

// Project namespaces must follow a certain format
const PROJECT_NAMESPACE_REGEX = /^[a-z0-9_]+$/;

/**
 * Validate the project namespace and throw on invalid format.
 * @param project the project namespace to validate
 * @throws {TacoLabError} if project namespace has invalid format.
 */
export function validateProjectNamespace(project: string): void {
  if (PROJECT_NAMESPACE_REGEX.test(project)) {
    return;
  }

  const invalidMessage = 'Invalid project namespace: ' + clc.bold(project) + '.';
  if (project.toLowerCase() !== project) {
    // Attempt to be more helpful in case uppercase letters are used.
    throw new TacoLabError(invalidMessage + '\nNote: Project id must be all lowercase.');
  } else {
    throw new TacoLabError(invalidMessage);
  }
}