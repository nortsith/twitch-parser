// @flow

import path from 'path';
// $FlowFixMe
import download from 'download-file';

export default function downloadFile(url: string, outputPath: string): Promise<void> {
  const { dir, base } = path.parse(outputPath);

  const options = {
    directory: dir,
    filename: base,
  };

  return new Promise((resolve, reject) => {
    download(url, options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
