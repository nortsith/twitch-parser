// @flow

import os from 'os';
import child_process from 'child_process';
import path from 'path';
// $FlowFixMe
import fse from 'fs-extra';
// $FlowFixMe
import opn from 'opn';

import FfmpegHelper from './FfmpegHelper';
import Notifier from './Notifier';
import downloadFile from './downloadFile';
import getClips from './getClips';
import getTwitchClipVideoUrl from './getTwitchClipVideoUrl';

const projectRoot = path.resolve(__dirname, '..') + '/';
const dataRoot = path.resolve(projectRoot, './data/') + '/';
const tempRoot = path.resolve(projectRoot, './tmp/') + '/';
const sourceRoot = path.resolve(__dirname) + '/';

function getFormattedDate() {
	const date = new Date();
	return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
}

async function main() {
	const ffmpegCommand =
		os.platform() === 'win32' ? path.resolve(projectRoot, './data/ffmpeg.exe') : 'ffmpeg';
	const ffmpegHelper = new FfmpegHelper(ffmpegCommand);

	const notifier = new Notifier({
		appId: 'twitch-parser',
		iconPath: path.join(sourceRoot, 'icon.ico'),
	});

	const configuration = {
		size: 5,
		period: 'day',
		language: 'tr',
		trending: false,
		game: '',
	};

	let title = (configuration.size > 1 && configuration.size + ' clips') || 'clip';

	notifier.notify({
		title: 'Getting top ' + title + ' of the ' + configuration.period + '!',
		message: 'This will take time depending on your download speed.',
		wait: false,
	});

	const clips = await getClips({
		limit: configuration.size,
		language: configuration.language,
		period: configuration.period,
		trending: configuration.trending,
		game: configuration.game,
	});

	const downloadDirectory = path.join(
		projectRoot,
		'./videos',
		getFormattedDate(),
		`output_${configuration.size}_${configuration.period}_${configuration.language}`,
	);

	console.log('Downloading and transcoding...');

	await fse.ensureDir(tempRoot);

	const transcodedVideos = await Promise.all(
		clips.map(async (clip, index) => {
			// Download
			console.log(`Downloading ${clip.id}...`);

			const url = getTwitchClipVideoUrl(clip);
			const downloadPath = path.join(downloadDirectory, `./${clip.id}.mp4`);
			if (!(await fse.exists(downloadPath))) {
				await downloadFile(url, downloadPath);
			}

			// Transcode
			console.log(`Transcoding ${clip.id}...`);

			const outputPath = path.join(tempRoot, `./${clip.id}_transcoded.mp4`);
			if (!(await fse.exists(outputPath))) {
				await ffmpegHelper.transcodeVideo(downloadPath, outputPath);
			}

			return {
				clip,
				path: outputPath,
			};
		}),
	);

	console.log('Download and transcode complete!');

	let be = (configuration.size > 1 && ' are ') || ' is ';

	notifier.notify({
		title: 'Top ' + title + ' of the ' + configuration.period + be + 'downloaded!',
		message: 'Generating final video. This will take a while.',
		wait: true,
	});

	const files = [path.join(dataRoot, './intro.mp4')];

	transcodedVideos.forEach((tv, index) => {
		if (index > 0) {
			files.push(path.join(dataRoot, './seperator.mp4'));
		}

		files.push(tv.path);
	});

	files.push(path.join(dataRoot, './outro.mp4'));

	const outputPath = path.join(downloadDirectory, './output.mp4');

	console.log('Merging...');

	await ffmpegHelper.concatVideos(files, outputPath, path.join(projectRoot, './tmp/mylist.txt'));

	console.log('Done!');

	notifier.notify({
		title: 'Completed!',
		message: 'Final video is generated. Click to open folder.',
		wait: true,
		onClick: () => {
			opn(downloadDirectory);

			setTimeout(() => {
				process.exit();
			}, 2000);
		},
		onTimeout: () => {
			process.exit();
		},
	});
}

main();