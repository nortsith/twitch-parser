// @flow

import os from 'os';
import path from 'path';
import opn from 'opn';

import Notifier from './Notifier';
import getConfiguration from './getConfiguration';
import createTwitchVideoCompiler from './createTwitchVideoCompiler';

const projectRoot = `${path.resolve(__dirname, '..')}/`;
const dataRoot = `${path.resolve(projectRoot, './data/')}/`;
const tempRoot = `${path.resolve(projectRoot, './tmp/')}/`;
const sourceRoot = `${path.resolve(__dirname)}/`;

function getFormattedDate() {
  const date = new Date();
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

async function main() {
  const configuration = await getConfiguration();

  const outputDirectory = path.join(
    projectRoot,
    './videos',
    getFormattedDate(),
    `${Object.values(configuration)
      .join('_')
      .replace(/__/g, '_')}`,
  );

  const notifier = new Notifier({
    appId: 'twitch-parser',
    iconPath: path.join(sourceRoot, 'icon.ico'),
  });

  const compiler = createTwitchVideoCompiler({
    ...configuration,
    ffmpegCommand:
      os.platform() === 'win32' ? path.resolve(projectRoot, './data/ffmpeg.exe') : 'ffmpeg',
    introVideoPath: path.join(dataRoot, './intro.mp4'),
    separatorVideoPath: path.join(dataRoot, './seperator.mp4'),
    outroVideoPath: path.join(dataRoot, './outro.mp4'),
    clipsDownloadPath: path.join(outputDirectory, './clips'),
    tempDirectory: tempRoot,
    outputDirectory,
  });

  compiler.events.subscribe((event) => {
    switch (event.name) {
      case 'fetchingClips': {
        const title = (configuration.size > 1 && `${configuration.size} clips`) || 'clip';

        notifier.notify({
          title: `Getting top ${title} of the ${configuration.period}!`,
          message: 'This will take time depending on your download speed.',
          wait: false,
        });
        break;
      }
      case 'preparingVideos': {
        console.log('Downloading and transcoding...');
        break;
      }
      case 'downloadingClip': {
        console.log(`Downloading ${event.clip.id}...`);
        break;
      }
      case 'transcodingClip': {
        console.log(`Transcoding ${event.clip.id}...`);
        break;
      }
      case 'generatingCompilation': {
        console.log('Download and transcode complete!');

        const title = (configuration.size > 1 && `${configuration.size} clips`) || 'clip';
        const be = (configuration.size > 1 && ' are ') || ' is ';

        notifier.notify({
          title: `Top ${title} of the ${configuration.period}${be}downloaded!`,
          message: 'Generating final video. This will take a while.',
          wait: true,
        });

        console.log('Merging...');
        break;
      }
      case 'complete': {
        console.log('Done!');

        notifier.notify({
          title: 'Completed!',
          message: 'Final video is generated. Click to open folder.',
          wait: true,
          onClick: () => {
            opn(outputDirectory);

            setTimeout(() => {
              process.exit();
            }, 2000);
          },
          onTimeout: () => {
            process.exit();
          },
        });

        break;
      }
      default: {
        console.log(`Unknown event ${event.name}`);
        break;
      }
    }
  });

  await compiler.compile();
}

main();
