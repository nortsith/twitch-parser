import getAccessToken from './getAccessToken';

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

export default async function(oauth2Client) {
  const authUrl = await oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  const auth = await getAccessToken(authUrl);

  return new Promise((resolve, reject) => {
    oauth2Client.getToken(auth.accessToken, (err, token) => {
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
}
