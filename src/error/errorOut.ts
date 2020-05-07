import logError from './logError';
import { TacoLabError } from './error';

/**
 * Errors out by calling `process.exit` with an exit code of 2.
 * @param error an Error to be logged.
 */
export default (error: Error): void => {
  let tlError: TacoLabError;
  if (error instanceof TacoLabError) {
    tlError = error;
  } else {
    tlError = new TacoLabError('An unexpected error has occurred.', {
      original: error,
      exit: 2,
    });
  }

  logError(tlError);
  process.exitCode = tlError.exit || 2;
  setTimeout(() => {
    process.exit();
  }, 250);
}