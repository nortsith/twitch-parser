// @flow

import inquirer from 'inquirer';

export default async function getConfiguration() {
  const questions = [
    {
      message: 'How many clips do you want to get?',
      type: 'input',
      name: 'size',
      validate: (name) => {
        const number = parseInt(name, 10);

        if (Number.isNaN(number)) return false;
        if (number < 1) return false;

        return true;
      },
      default: '5',
    },
    {
      message: 'Please select a period.',
      type: 'list',
      name: 'period',
      choices: ['day', 'week', 'month', 'all'],
    },
    {
      message: 'Please specify a language. (optional)',
      type: 'input',
      name: 'language',
    },
    {
      message: 'Do you want to get trending clips?',
      type: 'confirm',
      name: 'trending',
    },
    {
      message: 'Please specify a game. (optional)',
      type: 'input',
      name: 'game',
    },
    {
      message: 'Please specify a channel. (optional)',
      type: 'input',
      name: 'channel',
    },
  ];

  return inquirer.prompt(questions);
}
