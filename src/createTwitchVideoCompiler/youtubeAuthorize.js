import { google } from 'googleapis';

import getStoredToken from './getStroredToken';
import getClientFile from './getClientFile';

const { OAuth2 } = google.auth;

export default async function youtubeAuthorize() {
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
