import * as fs from 'fs';
import * as winston from 'winston';
import * as logger from './logger';
import * as clc from 'cli-color';
import { dirname, resolve } from 'path';
import { SPLAT } from 'triple-beam';
import { TacoLabError } from './error/error';
const ansiStrip = require('cli-color/strip') as (input: string) => string;

const IS_WINDOWS = process.platform === 'win32';
const SUCCESS_CHAR = IS_WINDOWS ? '+' : '✔';
const WARNING_CHAR = IS_WINDOWS ? '!' : '⚠';

export const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

/**
 * Attempts to call JSON.stringify on an object, if it throws return the original value
 * @param value
 */
export function tryStringify(value: any) {
    if (typeof value === 'string'){
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return value;
    }
}

export function setupLoggers() {
  if (process.env.DEBUG) {
    logger.add(
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.printf((info) => {
          const segments = [info.message, ...(info[SPLAT] || [])].map(tryStringify);
          return `${ansiStrip(segments.join(' '))}`;
        }),
      })
    );
  } else if (process.env.IS_TACOLAB_CLI) {
    logger.add(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.printf((info) =>
          [info.message, ...(info[SPLAT] || [])]
            .filter((chunk) => typeof chunk === 'string')
            .join(' ')
        ),
      })
    );
  }
}

/**
 * Trace up the ancestry of objects that have a `parent` key, finding the
 * first instance of the provided key.
 */
export function getInheritedOption(options: any, key: string): any {
  let target = options;
  while (target) {
    if (key in target) {
      return target[key];
    }
    target = target.parent;
  }
}

/**
 * Search for recursively
 */
export function detectProjectRoot(cwd: string): string | null {
  let projectRootDir = cwd || process.cwd();
  while (!fs.existsSync(resolve(projectRootDir, './tacolab.json'))) {
    const parentDir = dirname(projectRootDir);
    if (parentDir === projectRootDir) {
      return null;
    }
    projectRootDir = parentDir;
  }
  return projectRootDir;
}

/**
 * Log an info statement with a green checkmark at the start of the line.
 */
export function logSuccess(message: string, type = 'info'): void {
  logger[type](clc.green.bold(`${SUCCESS_CHAR} `), message);
}

/**
 * Log an info statement with a green checkmark at the start of the line.
 */
export function logLabeledSuccess(label: string, message: string, type = 'info'): void {
  logger[type](clc.green.bold(`${SUCCESS_CHAR}  ${label}:`), message);
}

/**
 * Log an info statement with a gray bullet at the start of the line.
 */
export function logBullet(message: string, type = 'info'): void {
  logger[type](clc.cyan.bold('i '), message);
}

/**
 * Log an info statement with a gray bullet at the start of the line.
 */
export function logLabeledBullet(label: string, message: string, type = 'info'): void {
  logger[type](clc.cyan.bold(`i  ${label}:`), message);
}

/**
 * Log an info statement with a gray bullet at the start of the line.
 */
export function logWarning(message: string, type = 'warn'): void {
  logger[type](clc.yellow.bold(`${WARNING_CHAR} `), message);
}

/**
 * Log an info statement with a gray bullet at the start of the line.
 */
export function logLabeledWarning(label: string, message: string, type = 'warn'): void {
  logger[type](clc.yellow.bold(`${WARNING_CHAR}  ${label}:`), message);
}

/**
 * Return a promise that rejects with a TacoLabError.
 */
export function reject(message: string, options?: any): Promise<void> {
  return Promise.reject(new TacoLabError(message, options));
}