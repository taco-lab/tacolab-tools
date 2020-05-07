#!/usr/bin/env node

// Notify user when CLI update is available
import * as updateNotifier from 'update-notifier';
const pkg = require('../../package.json');
updateNotifier({pkg}).notify({ defer: true, isGlobal: true });

// Initialize packages
import client from '..';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as logger from '../logger';
import { SPLAT } from 'triple-beam';
import { strip } from 'cli-color';
import * as utils from '../utils';
import { configstore } from '../configstore';
import errorOut from '../error/errorOut';

let args = process.argv.slice(2);
if (!process.env.DEBUG && args.includes('--debug')) {
    process.env.DEBUG = 'true';
}

process.env.IS_TACOLAB_CLI = 'true';

// Configure Logger
const logFilename = path.join(process.cwd(), '/tacolab-debug.log');
logger.add(
    new winston.transports.File({
      level: 'debug',
      filename: logFilename,
      format: winston.format.printf((info) => {
        const segments = [info.message, ...(info[SPLAT] || [])].map(utils.tryStringify);
        return `[${info.level}] ${strip(segments.join(' '))}`;
      }),
    })
);

// Log boot info & motd
logger.debug('-'.repeat(70));
logger.debug('Command:      ', process.argv.join(' '));
logger.debug('CLI Version:  ', pkg.version);
logger.debug('Platform:     ', process.platform);
logger.debug('Node Version: ', process.version);
logger.debug('Time:         ', new Date().toString());
logger.debug('-'.repeat(70));
logger.debug();

// Actions on CLI exited
process.on('exit', (code) => {
    code = process.exitCode || code;

    // If exited well, delete log file
    if (!process.env.DEBUG && code < 2 && fs.existsSync(logFilename)) {
      fs.unlinkSync(logFilename);
    }

    // Otherwise, display help
    if (code > 1 && process.stdout.isTTY) {
      const lastError = configstore.get('lastErrorAt') || 0;
      const timestamp = Date.now();

      // If another error less than 2 min ago...
      if (lastError > timestamp - 120000) {
        console.log();
        console.log('Having trouble? Try again or contact support with contents of tacolab-debug.log');
      }

      configstore.set('lastErrorAt', timestamp);
    } else {
      configstore.delete('lastErrorAt');
    }
});
require('exit-code');

// On error, display it
process.on('uncaughtException', (err) => {
    errorOut(err);
});

// Parse command
client.cli.parse(process.argv);

// Determine if there are any non-option arguments.
// if not, display help
args = args.filter((arg) => {
  return arg.indexOf('-') < 0;
});
if (!args.length) {
  client.cli.help();
}