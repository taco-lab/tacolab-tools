import * as inquirer from 'inquirer';
import { TacoLabError } from './error/error';

/**
 * Question type for inquirer. See
 * https://www.npmjs.com/package/inquirer#question
 */
export type Question = inquirer.Question;

/**
 * prompt is used to prompt the user for values. Specifically, any `name` of a
 * provided question will be checked against the `options` object. If `name`
 * exists as a key in `options`, it will *not* be prompted for. If `options`
 * contatins `nonInteractive = true`, then any `question.name` that does not
 * have a value in `options` will cause an error to be returned. Once the values
 * are queried, the values for them are put onto the `options` object, and the
 * answers are returned.
 * @param options The options object passed through by Command.
 * @param questions `Question`s to ask the user.
 * @return The answers, keyed by the `name` of the `Question`.
 */
export async function prompt(options: { [key: string]: any }, questions: any[]): Promise<any> {
    // Ask only missing questions
    const prompts = [];
    for (const question of questions) {
        if (question.name && options[question.name] === undefined) {
            prompts.push(question);
        }
    }

    if (prompts.length && options.nonInteractive) {
        const missingOptions = prompts.map((question: Question) => question.name).join(', ');
        throw new TacoLabError(
            `Missing required options (${missingOptions}) while running in non-interactive mode`,
            {
                children: prompts,
                exit: 1,
            }
        );
    }

    // Ask questions
    return await inquirer.prompt(prompts);
}

/**
 * Quick version of `prompt` to ask a single question.
 * @param question The question (of life, of taco, the universe, and everything).
 * @return The value as returned by `inquirer` for that quesiton.
 */
export async function promptOnce(question: any): Promise<any> {
  question.name = question.name || 'question';
  const answers = await prompt({}, [question]);
  return answers[question.name];
}