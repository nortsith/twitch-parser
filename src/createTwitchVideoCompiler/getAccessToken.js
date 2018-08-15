// @flow

import inquirer from 'inquirer';

export default async function getAccessToken(url: string) {
  console.log('Authorize this app by visiting this url: ', url);

  return inquirer.prompt({
    message: `Enter the code from that page here:`,
    type: 'input',
    name: 'accessToken',
  });
}
