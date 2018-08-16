// @flow

import inquirer from 'inquirer';
import opn from 'opn';

export default async function getAccessToken(url: string) {
  opn(url);

  return inquirer.prompt({
    message: `Enter the code from that page here:`,
    type: 'input',
    name: 'accessToken',
  });
}
