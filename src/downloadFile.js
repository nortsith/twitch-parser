// @flow

import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

export default async function downloadFile(url: string, outputPath: string): Promise<void> {
  const writeStream = fs.createWriteStream(outputPath);

  const response = await fetch(url);

  response.body.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on('error', (error) => reject(error));
    writeStream.on('close', () => resolve());
  });
}
