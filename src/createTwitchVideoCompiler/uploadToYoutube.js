// @flow

import fs from 'fs';
import { google } from 'googleapis';

export type Properties = {
  language: string,
  description: string,
  tags: Array<string>,
  title: string,
  privacy: string,
  videoPath: string,
};

export function createParameters(authorization: $FlowFixMe, properties: Properties) {
  // https://developers.google.com/youtube/v3/docs/videos/insert#parameters
  const parameters = {
    part: 'snippet,status',
    auth: authorization,
    media: { body: fs.createReadStream(properties.videoPath) },
    notifySubscribers: false,
    resource: {
      snippet: {
        categoryId: '20',
        defaultLanguage: properties.language,
        description: properties.description,
        tags: properties.tags,
        title: properties.title,
      },
      status: {
        privacyStatus: properties.privacy,
      },
    },
  };

  return parameters;
}

export default async function uploadToYoutube(
  authorization: $FlowFixMe,
  properties: Properties,
): Promise<void> {
  const parameters = createParameters(authorization, properties);

  console.log('Uploading video...');

  const service = google.youtube('v3');

  await service.videos.insert(parameters);
}
