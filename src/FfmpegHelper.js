// @flow

import child_process from 'child_process';
// $FlowFixMe
import fse from 'fs-extra';

export default class FfmpegHelper {
	command: string;

	constructor(command: string) {
		this.command = command;
	}

	async transcodeVideo(inputPath: string, outputPath: string): Promise < void > {
		return new Promise((resolve, reject) => {
			child_process.exec(
				this.command +
				' -i ' +
				inputPath +
				' -vf setdar=16/9 -video_track_timescale 60000 -ac 1 -ar 48000 -preset ultrafast ' +
				// '-vf "[in]drawtext=fontfile=misc/segoeuil.ttf: text=\'twitch.tv/' + parser.clipList[index].broadcaster.name +
				// '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=40,' +
				// 'drawtext=fontfile=misc/segoeuil.ttf: text=' + parser.clipList[index].game.replace(':', '') +
				// '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=100" ' +
				outputPath +
				' -y',
				(error, stdout, stderr) => {
					if (error) {
						reject(error);
						return;
					}

					resolve();
				},
			);
		});
	}

	async concatVideos(
		videoPaths: Array < string > ,
		outputPath: string,
		tempListPath: string,
	): Promise < void > {
		const listPath = tempListPath;

		await fse.writeFile(listPath, videoPaths.map((f) => `file '${f}'`).join('\n'));

		return new Promise((resolve, reject) => {
			child_process.exec(
				this.command + ' -f concat -safe 0 -i ' + listPath + ' -c copy ' + outputPath + ' -y',
				(error, stdout, stderr) => {
					if (error) {
						reject(error);
						return;
					}
					resolve();
				},
			);
		});
	}
}