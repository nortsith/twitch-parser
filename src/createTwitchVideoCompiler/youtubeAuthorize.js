// @flow

import fs from 'fs';
import fse from 'fs-extra';
import opn from 'opn';
import inquirer from 'inquirer';
import { google } from 'googleapis';

const { OAuth2 } = google.auth;

type ClientSecretData = {
  installed: {
    client_id: string,
    project_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret: string,
    redirect_uris: Array<string>,
  },
};

export default async function youtubeAuthorize() {
  const content: ClientSecretData = await fse.readJson('./client_secret.json');

  const clientSecret = content.installed.client_secret;
  const clientId = content.installed.client_id;
  const redirectUrl = content.installed.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  const tokenCachePath = './.credentials/twitch-parser.json';

  if (fs.existsSync(tokenCachePath)) {
    const tokens = await fse.readJson(tokenCachePath);

    oauth2Client.setCredentials(tokens);

    return oauth2Client;
  }

  const authUrl = await oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      // 'https://www.googleapis.com/auth/youtube.force-ssl'
      'https://www.googleapis.com/auth/youtube.upload',
    ],
  });

  opn(authUrl);

  const auth = await inquirer.prompt({
    message: `Enter the code from that page here:`,
    type: 'input',
    name: 'accessToken',
  });

  const { tokens } = await oauth2Client.getToken(auth.accessToken);

  await fse.outputJson(tokenCachePath, tokens);

  oauth2Client.setCredentials(tokens);

  return oauth2Client;
}
