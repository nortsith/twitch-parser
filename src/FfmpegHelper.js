// @flow

import child_process, { type ChildProcess } from 'child_process';
import fse from 'fs-extra';

function promiseFromChildProcess(childProcess: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    childProcess.on('error', (error) => {
      reject(error);
    });
    childProcess.on('exit', (code) => {
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

  spawn(args: Array<string>, options?: child_process$spawnOpts): ChildProcess {
    return child_process.spawn(this.command, args, options);
  }

  async transcodeVideo(inputPath: string, outputPath: string): Promise<void> {
    const ffmpeg = this.spawn(
      // prettier-ignore
      [
        '-i', inputPath,
        '-vf', 'setdar=16/9',
        '-video_track_timescale', '60000',
        '-ac', '1',
        '-ar', '48000',
        '-preset', 'ultrafast',
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
