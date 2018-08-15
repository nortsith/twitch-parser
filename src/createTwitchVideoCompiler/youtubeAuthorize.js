// @flow

import fse from 'fs-extra';
import readline from 'readline';
import { google } from 'googleapis';

const { OAuth2 } = google.auth;
const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const TOKEN_DIR = `/.credentials/`;
const TOKEN_PATH = `${TOKEN_DIR}twitch-parser.json`;

type Content = {
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

async function getNewToken(oauth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url: ', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();

      oauth2Client.getToken(code, (err, token) => {
        const client = oauth2Client;

        if (err) {
          console.log('Error while trying to retrieve access token', err);
          reject();
          return;
        }

        client.credentials = token;

        resolve(token);
      });
    });
  });
}

async function getStoredToken(oauth2Client) {
  try {
    return await fse.readJson(TOKEN_PATH);
  } catch (err) {
    const token = await getNewToken(oauth2Client);
    await fse.outputJson(TOKEN_PATH, token);
    return token;
  }
}

async function getClientFile(clientFilePath): Promise<Content | false> {
  try {
    return await fse.readJson(clientFilePath);
  } catch (err) {
    console.log(err);
    return false;
  }
}

export default async function youtubeAuthorize(): Promise<Content> {
  const content = await getClientFile('./client_secret.json');

  if (content === false) {
    throw new Error();
  }

  const clientSecret = content.installed.client_secret;
  const clientId = content.installed.client_id;
  const redirectUrl = content.installed.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  const token = await getStoredToken(oauth2Client);

  oauth2Client.credentials = token;

  return oauth2Client;
}
