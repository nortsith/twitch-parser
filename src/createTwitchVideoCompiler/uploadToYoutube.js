// @flow

import fs from 'fs';
import { google } from 'googleapis';

async function removeEmptyParameters(params) {
  const parameters = params;

  Object.keys(parameters).forEach((value) => {
    if (!parameters[value] || parameters[value] === 'undefined') {
      delete parameters[value];
    }
  });

  return parameters;
}

async function createResource(props) {
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

export default async function uploadToYoutube(
  authorization: {},
  properties: {
    language: string,
    description: string,
    tags: string,
    title: string,
    privacy: string,
    videoPath: string,
  },
): Promise<void> {
  const requestData = {
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
  };

  const service = google.youtube('v3');
  const parameters = await removeEmptyParameters(requestData.params);
  // $FlowFixMe
  parameters.auth = authorization;
  // $FlowFixMe
  parameters.media = { body: fs.createReadStream(requestData.mediaFilename) };
  // $FlowFixMe
  parameters.notifySubscribers = false;
  // $FlowFixMe
  parameters.resource = await createResource(requestData.properties);

  return new Promise((resolve, reject) => {
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
  });
}
