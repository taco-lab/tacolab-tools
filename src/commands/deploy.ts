import * as fs from 'fs';
import * as clc from 'cli-color';
import * as path from 'path';
import { Command } from '../command';
import * as logger from '../logger';
import { configstore } from '../configstore';
import * as utils from '../utils';
import * as ora from 'ora';
import * as prompt from '../prompt';
import { TacoLabError } from '../error/error';
import { API } from '../api';
import * as requireAuth from '../middlewares/requireAuth';
import * as requireValidTopping from '../middlewares/requireValidTopping';
import * as requireConfig from '../middlewares/requireConfig';
import { Snowball } from '../snowball';
import * as gitP from 'simple-git/promise';
import { SimpleGit, StatusResult } from 'simple-git/promise';
import { execSync } from 'child_process';

module.exports = new Command('deploy')
  .description('deploy code and assets to a TacoLab topping')
  .before(requireAuth)
  .before(requireConfig)
  .before(requireValidTopping)
  .action(async (snowball: Snowball) => {
    if (!snowball.config || !snowball.topping || !snowball.projectRoot) return;
    let label = snowball.topping.name;

    logger.info(clc.bold(`\n=== Deploying to '${label}'...\n`));
    label = `[${label}]`;

    utils.logLabeledBullet(label, 'beginning deploy...');

    // Fetch deploy key
    const spinner = ora('Requesting deploy authorization...').start();
    const res = await API.request('POST', `/projects/${snowball.config.project_id}/toppings/${snowball.topping.id}/deploy`);

    // Check error codes
    // if (res && res.error === 'WAIT_BEFORE_NEXT_DEPLOY') {
    //   spinner.stop();
    //   utils.logLabeledWarning(label, 'please wait few seconds before deploy again\n');
    //   return;
    // }

    // If no key --> failure
    if (!res || !res.token_name || !res.token_key || !res.repository_url || !res.user_email) {
      spinner.stop();
      logger.debug('>> Received invalid deployment response');
      logger.debug(JSON.stringify(res));
      throw new TacoLabError('An error occured during deployment. Please try again later');
    }

    spinner.stop();
    utils.logLabeledSuccess(label, 'deploy authorization granted!');
    spinner.text = 'Packing files...';
    spinner.start();

    const git_dir_name = '.tacolab-deploy';
    const git_dir_path = path.join(snowball.projectRoot, git_dir_name, '/');
    // const deploy_key_path = path.join(git_dir_path, '.deploy-key');
    try {
      logger.debug(`Deleting old ${git_dir_name} directory`);
      execSync(`rm -rf ${git_dir_path}`);

      logger.debug('Initializing git repository')
      const git: SimpleGit = gitP(snowball.projectRoot);
      git.silent(false);
      git.env('GIT_DIR', git_dir_name);
      git.env('GIT_WORK_TREE', snowball.projectRoot);
      git.env('EMAIL', res.user_email);
      git.env('GIT_TRACE', 'true');
      await git.init();

      logger.debug(`Adding tacolab remote: ${res.repository_url}`);
      const repo_parts = res.repository_url.split('://', 2);
      await git.addRemote('tacolab', `${repo_parts[0]}://tacolab:${res.token_key}@${repo_parts[1]}`);

      // logger.debug(`Writing deploy key into ${deploy_key_path}`);
      // fs.writeFileSync(deploy_key_path, res.key);
      // fs.chmodSync(deploy_key_path, 660);

      logger.debug('Tracking files');
      await git.add('.')
      await git.reset([
        path.join(process.cwd(), 'tacolab-debug.log'),
        path.join(process.cwd(), 'tacolab.json'),
        path.join(process.cwd(), '.tacolab-deploy/')
      ]);

      logger.debug('Commiting files');
      await git.commit(`cli-deploy-${new Date().toISOString()}`);

      spinner.text = 'Uploading files...';
      logger.debug('Pushing commit to git server');
      // git.env('GIT_SSH_COMMAND', `ssh -i ${deploy_key_path}`);
      await git.push('tacolab', 'master', {
        '--force': true
      });

      logger.debug('Deleting initialized git repository');
      execSync(`rm -rf ${git_dir_path}`);

      logger.debug('Revoking deploy token');
      await API.request('POST', `/projects/${snowball.config.project_id}/toppings/${snowball.topping.id}/deploy/revoke`, {
        name: res.token_name
      });

      spinner.text = 'Restarting topping...';
      await API.request('PATCH', `/projects/${snowball.config.project_id}/toppings/${snowball.topping.id}/instance/restart`);

      // OK!
      logger.debug('Deploy complete!');
      spinner.stop();
      utils.logLabeledSuccess(label, 'deploy complete!\n');

      utils.logSuccess('Deploy complete!');
      utils.logBullet('If topping was running, it is restarting to apply new version.');
    } catch (error) {
      spinner.stop();
      execSync(`rm -rf ${git_dir_path}`);
      throw error;
    }
  });