const express = require('express');
const app = express();
const serv = require('http').Server(app);
const twitch = require('twitch-api-v5');
const request = require('request');
const download = require('download-file');
const {
	exec
} = require('child_process');
const notifier = require('node-notifier');
const path = require('path');
const ffmpeg = require('ffmpeg');

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server Started');

function TwitchParser() {
	const parser = this;

	parser.configuration = {
		size: 10,
		period: 'day',
		language: 'en',
		trending: false,
		game: ''
	};

	parser.completed = 0;
	parser.transcoded = 0;
	parser.clipList = [];
	parser.options = {
		directory: '',
		filename: ''
	};

	parser.initialize = () => {
		parser.registerApp();
		parser.getClips({
			limit: parser.configuration.size,
			language: parser.configuration.language,
			period: parser.configuration.period,
			trending: parser.configuration.trending,
			game: parser.configuration.game
		}, () => {
			parser.createFolder();
			parser.setDirectory('./videos/' + parser.getFormattedDate());
		});
	};

	parser.registerApp = function () {
		exec('"' + __dirname + '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" -install ' +
			'"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\Twitch Parser.lnk" ' +
			'"' + __dirname + '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" twitch-parser');
	};

	parser.getClips = (config, callback) => {
		twitch.clientID = 'th6nyhyb09o3rn71ozhhemx5se9lsp';

		let title = parser.configuration.size > 1 && (parser.configuration.size + ' clips') || 'clip';

		parser.sendNotification({
			title: 'Getting top ' + title + ' of the ' + parser.configuration.period + '!',
			message: 'This will take time depending on your download speed.',
			wait: false
		});

		twitch.clips.top(config, (error, result) => {
			if (error) {
				parser.log(error);
			} else {
				callback();
				parser.log('Downloading...');

				result.clips.forEach((clip, index) => {
					parser.clipList.push(clip);
					parser.setFileName(index.toString());
					parser.downloadClips(clip, index);
				});
			}
		});
	};

	parser.downloadClips = (clip, index) => {
		download(parser.generateDownloadUrl(clip), parser.options, (error) => {
			parser.completed += 1;

			if (parser.completed === parser.configuration.size) {
				parser.log('Download complete!');

				let title = parser.configuration.size > 1 && (parser.configuration.size + ' clips') || 'clip';
				let be = parser.configuration.size > 1 && ' are ' || ' is ';

				parser.sendNotification({
					title: 'Top ' + title + ' of the ' + parser.configuration.period + be + 'downloaded!',
					message: 'Generating final video. This will take a while.',
					wait: true
				});

				parser.transcodeClip(parser.transcoded);
			}
		});
	};

	parser.transcodeClip = (index) => {
		parser.log('Transcoding ' + parser.transcoded + '.mp4...');

		var transcoder = exec('ffmpeg -i ' + __dirname + parser.options.directory + '/' + parser.transcoded +
			'.mp4 -vf setdar=16/9 -video_track_timescale 60000 -ac 1 -ar 48000 -preset ultrafast ' +
			// '-vf "[in]drawtext=fontfile=misc/segoeuil.ttf: text=\'twitch.tv/' + parser.clipList[index].broadcaster.name +
			// '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=40,' +
			// 'drawtext=fontfile=misc/segoeuil.ttf: text=' + parser.clipList[index].game.replace(':', '') +
			// '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=100" ' +
			parser.transcoded +
			'_tmp.mp4 -y', {
				cwd: './tmp'
			});

		transcoder.on('close', () => {
			parser.log('Transcoding ' + index + '.mp4 completed!');

			exec('rm ' + index + '.mp4', {
				cwd: parser.options.directory
			});

			parser.transcoded += 1;

			if (parser.transcoded < parser.configuration.size) {
				parser.transcodeClip(parser.transcoded);
			}

			if (parser.transcoded === parser.configuration.size) {
				parser.log('Transcode completed!');
				parser.createList(parser.mergeClips);
			}
		});
	};

	parser.mergeClips = () => {
		parser.log('Merging...');

		var merge = exec('ffmpeg -f concat -i mylist.txt -c copy ' + __dirname +
			parser.options.directory + '/output_' +
			parser.configuration.size + '_' + parser.configuration.period + '_' +
			parser.configuration.language + '.mp4 -y', {
				cwd: './tmp'
			}
		);

		merge.on('close', () => {
			parser.log('Merge completed!');

			exec('rm *.mp4', {
				cwd: './tmp'
			});

			exec('rm *.txt', {
				cwd: './tmp'
			});

			parser.sendNotification({
				title: 'Completed!',
				message: 'Final video is generated. Click to open folder.',
				wait: true
			}, () => {
				exec('start videos\\' + parser.getFormattedDate());

				setTimeout(() => {
					process.exit();
				}, 2000)
			}, () => {
				process.exit();
			});
		});
	};

	parser.createList = (callback) => {
		var intro = exec('@echo file \'misc/intro.mp4\' > mylist.txt', {
			cwd: './tmp'
		});

		intro.on('close', () => {
			var list = exec('(for %i in (*.mp4) do @echo file \'%i\' & @echo file \'misc/seperator.mp4\') >> mylist.txt', {
				cwd: './tmp'
			});

			list.on('close', () => {
				callback();
			});
		});

	};

	parser.sendNotification = (config, onClick, timeout) => {
		notifier.notify({
			title: config.title,
			message: config.message,
			icon: path.join(__dirname, 'icon.ico'),
			sound: false,
			appID: 'twitch-parser',
			wait: config.wait
		});

		if (typeof onClick === 'function') {
			notifier.on('click', function (notifierObject, options) {
				onClick();
			});
		};

		if (typeof timeout === 'function') {
			notifier.on('timeout', function (notifierObject, options) {
				timeout();
			});
		};
	};

	parser.generateDownloadUrl = (clip) => {
		var videoUrl = 'https://clips-media-assets2.twitch.tv/';
		var videoId = clip.thumbnails.medium.split('tv/').pop().split('-preview').shift();
		var generatedUrl = videoUrl + videoId + '.mp4';

		return generatedUrl;
	};

	parser.getFormattedDate = () => {
		var date = new Date();
		return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
	};

	parser.createFolder = () => {
		exec('mkdir /videos' + parser.getFormattedDate());
	};

	parser.setDirectory = (path) => {
		parser.options.directory = path;
	};

	parser.setFileName = (name) => {
		parser.options.filename = parser.generateFileName(name);
	};

	parser.generateFileName = (name) => {
		return name.split(' ').join('_') + '.mp4';
	};

	parser.log = (message) => {
		console.clear();
		console.log(message);
	};

	parser.initialize();
};

var twitchParser = new TwitchParser;