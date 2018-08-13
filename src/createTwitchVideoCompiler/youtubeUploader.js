/* eslint-disable */

import fs from 'fs';
import readline from 'readline';
import util from 'util';
import { google } from 'googleapis';
import { resolve } from 'url';

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
    const OAuth2 = google.auth.OAuth2;
    const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
    const TOKEN_DIR =
      (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
    const TOKEN_PATH = TOKEN_DIR + 'twitch-parser.json';

    fs.readFile(clientFilePath, function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }

      authorize(
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

      function authorize(credentials, requestData, callback) {
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, function(err, token) {
          if (err) {
            getNewToken(oauth2Client, requestData, callback);
          } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client, requestData);
          }
        });
      }
    });

    function getNewToken(oauth2Client, requestData, callback) {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url: ', authUrl);
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          storeToken(token);
          callback(oauth2Client, requestData);
        });
      });
    }

    function storeToken(token) {
      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }
      fs.writeFile(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to ' + TOKEN_PATH);
    }

    function removeEmptyParameters(params) {
      for (var p in params) {
        if (!params[p] || params[p] == 'undefined') {
          delete params[p];
        }
      }
      return params;
    }

    function createResource(properties) {
      var resource = {};
      var normalizedProps = properties;
      for (var p in properties) {
        var value = properties[p];
        if (p && p.substr(-2, 2) == '[]') {
          var adjustedName = p.replace('[]', '');
          if (value) {
            normalizedProps[adjustedName] = value.split(',');
          }
          delete normalizedProps[p];
        }
      }
      for (var p in normalizedProps) {
        if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
          var propArray = p.split('.');
          var ref = resource;
          for (var pa = 0; pa < propArray.length; pa++) {
            var key = propArray[pa];
            if (pa == propArray.length - 1) {
              ref[key] = normalizedProps[p];
            } else {
              ref = ref[key] = ref[key] || {};
            }
          }
        }
      }
      return resource;
    }

    function videosInsert(auth, requestData) {
      var service = google.youtube('v3');
      var parameters = removeEmptyParameters(requestData['params']);
      parameters['auth'] = auth;
      parameters['media'] = { body: fs.createReadStream(requestData['mediaFilename']) };
      parameters['notifySubscribers'] = false;
      parameters['resource'] = createResource(requestData['properties']);
      var req = service.videos.insert(parameters, function(err, data) {
        if (err) {
          console.log('The API returned an error: ' + err);
          reject();
        }
        if (data) {
          resolve();
        }
        process.exit();
      });

      var fileSize = fs.statSync(requestData['mediaFilename']).size;
      var id = setInterval(function() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Uploading...');
      }, 250);
    }
  });
}
