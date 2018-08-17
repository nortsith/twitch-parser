// @flow

import { createParameters, type Properties } from './uploadToYoutube';

jest.mock('googleapis', () => ({
  google: {},
}));

jest.mock('fs', () => ({
  createReadStream: () => null,
}));

test('createParameters', () => {
  const authorization = null;
  const properties: Properties = {
    language: 'en',
    description: 'desc',
    tags: ['tagOne', 'tagTwo'],
    title: 'title',
    privacy: 'private',
    videoPath: 'test',
  };

  const parameters = createParameters(authorization, properties);

  expect(parameters).toMatchSnapshot();
});
