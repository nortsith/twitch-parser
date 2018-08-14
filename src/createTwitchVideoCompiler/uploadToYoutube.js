// @flow

import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';

export default async function youtubeUploader(
  clientFilePath: string,
  properties: {
    language: string,
    description: string,
    tags: string,
    title: string,
    privacy: string,
    videoPath: string,
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { OAuth2 } = google.auth;
    const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
    // $FlowFixMe
    const TOKEN_DIR = `${process.env.HOME ||
      // $FlowFixMe
      process.env.HOMEPATH ||
      // $FlowFixMe
      process.env.USERPROFILE}/.credentials/`;
    const TOKEN_PATH = `${TOKEN_DIR}twitch-parser.json`;

    function storeToken(token) {
      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
      fs.writeFile(TOKEN_PATH, JSON.stringify(token));
      console.log(`Token stored to ${TOKEN_PATH}`);
    }

    function getNewToken(oauth2Client, requestData, callback) {
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
            return;
          }

          client.credentials = token;

          storeToken(token);

          callback(client, requestData);
        });
      });
    }

    function removeEmptyParameters(params) {
      const parameters = params;

      Object.keys(parameters).forEach((value) => {
        if (!parameters[value] || parameters[value] === 'undefined') {
          delete parameters[value];
        }
      });

      return parameters;
    }

    function createResource(props) {
      const resource = {};
      const normalizedProps = props;

      Object.keys(props).forEach((p) => {
        const value = props[p];
        if (p && p.substr(-2, 2) === '[]') {
          const adjustedName = p.replace('[]', '');
          if (value) {
            normalizedProps[adjustedName] = value.split(',');
          }
          delete normalizedProps[p];
        }
      });

      Object.keys(normalizedProps).forEach((p) => {
        if (Object.prototype.hasOwnProperty.call(normalizedProps, p) && normalizedProps[p]) {
          const propArray = p.split('.');
          let ref = resource;
          for (let pa = 0; pa < propArray.length; pa += 1) {
            const key = propArray[pa];
            if (pa === propArray.length - 1) {
              ref[key] = normalizedProps[p];
            } else {
              ref[key] = ref[key] || {};
              ref = ref[key];
            }
          }
        }
      });

      return resource;
    }

    function videosInsert(auth, requestData) {
      const service = google.youtube('v3');
      const parameters = removeEmptyParameters(requestData.params);
      // $FlowFixMe
      parameters.auth = auth;
      // $FlowFixMe
      parameters.media = { body: fs.createReadStream(requestData.mediaFilename) };
      // $FlowFixMe
      parameters.notifySubscribers = false;
      // $FlowFixMe
      parameters.resource = createResource(requestData.properties);
      service.videos.insert(parameters, (err, data) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          reject();
        }
        if (data) {
          resolve();
        }
        process.exit();
      });

      console.log('Uploading...');
    }

    fs.readFile(clientFilePath, (err, content) => {
      function authorize(credentials, requestData, callback) {
        const clientSecret = credentials.installed.client_secret;
        const clientId = credentials.installed.client_id;
        const redirectUrl = credentials.installed.redirect_uris[0];
        const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (error, token) => {
          if (error) {
            getNewToken(oauth2Client, requestData, callback);
          } else {
            // $FlowFixMe
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client, requestData);
          }
        });
      }

      if (err) {
        // $FlowFixMe
        console.log(`Error loading client secret file: ${err}`);
        return;
      }

      authorize(
        // $FlowFixMe
        JSON.parse(content),
        {
          params: { part: 'snippet,status' },
          properties: {
            'snippet.categoryId': '20',
            'snippet.defaultLanguage': properties.language,
            'snippet.description': properties.description,
            'snippet.tags[]': properties.tags,
            'snippet.title': properties.title,
            'status.embeddable': '',
            'status.license': '',
            'status.privacyStatus': properties.privacy,
            'status.publicStatsViewable': '',
          },
          mediaFilename: properties.videoPath,
        },
        videosInsert,
      );
    });
  });
}
