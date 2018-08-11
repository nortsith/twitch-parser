// @flow

import childProcess, { type ChildProcess } from 'child_process';

type SpawnOptions = child_process$spawnOpts; // eslint-disable-line camelcase

function promiseFromChildProcess(child: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error);
    });
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with "${code}"`));
      }

      resolve();
    });
  });
}

export default class FfmpegHelper {
  command: string;

  constructor(command: string) {
    this.command = command;
  }

  spawn(args: Array<string>, options?: SpawnOptions): ChildProcess {
    return childProcess.spawn(this.command, args, options);
  }

  async transcodeVideo(
    inputPath: string,
    outputPath: string,
    fontPath: string,
    broadcaster: string,
    game: string,
  ): Promise<void> {
    const ffmpeg = this.spawn(
      // prettier-ignore
      [
        '-i', inputPath,
        '-vf', 'setdar=16/9',
        '-video_track_timescale', '60000',
        '-ac', '1',
        '-ar', '48000',
        '-preset', 'ultrafast',
        '-vf', `scale=1920:-1,
                drawtext=fontfile=${fontPath}: text=${broadcaster}: fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=40,
                drawtext=fontfile=${fontPath}: text=${game}: fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=100`,
        outputPath,
        '-y',
      ],
    );

    return promiseFromChildProcess(ffmpeg);
  }

  async concatVideos(videoPaths: Array<string>, outputPath: string): Promise<void> {
    const ffmpeg = this.spawn(
      // prettier-ignore
      [
        '-f', 'concat',
        '-safe', '0',
        '-protocol_whitelist', 'pipe,file',
        '-i', '-',
        '-c', 'copy',
        outputPath,
        '-y'
      ],
    );

    const list = videoPaths.map((f) => `file '${f}'`).join('\n');
    ffmpeg.stdin.write(list);
    ffmpeg.stdin.end();

    return promiseFromChildProcess(ffmpeg);
  }
}
