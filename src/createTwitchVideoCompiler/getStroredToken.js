// @flow

import fse from 'fs-extra';

import getNewToken from './getNewToken';

const TOKEN_DIR = `/.credentials/`;
const TOKEN_PATH = `${TOKEN_DIR}twitch-parser.json`;

export default async function(oauth2Client: $FlowFixMe): Promise<{}> {
  try {
    return await fse.readJson(TOKEN_PATH);
  } catch (err) {
    const token = await getNewToken(oauth2Client);
    await fse.outputJson(TOKEN_PATH, token);
    return token;
  }
}
