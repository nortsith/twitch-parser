const express = require('express');
const app = express();
const serv = require('http').Server(app);
const twitch = require('twitch-api-v5');
const request = require('request');
const download = require('download-file');
const { exec } = require('child_process');
const notifier = require('node-notifier');
const path = require('path');

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server Started');

function TwitchParser () {
    const parser = this;

    this.size = 2;
    this.period = 'day',
    this.completed = 0;
    this.clipList = [];
    this.options = {
        directory: '',
        filename: ''
    };

    this.initialize = () => {
        this.registerApp();
        this.getClips({
            limit: this.size,
            language: 'en',
            period: this.period,
            trending: false
        }, () => {
            this.createFolder();
            this.setDirectory('./videos/' + this.getFormattedDate());
        });
    };

    this.registerApp = function () {
        exec('"' + __dirname + '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" -install ' +
            '"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\Twitch Parser.lnk" ' +
            '"' + __dirname + '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" twitch-parser');
    };

    this.getClips = (config, callback) => {
        twitch.clientID = 'th6nyhyb09o3rn71ozhhemx5se9lsp';

        let title = this.size > 1 && (this.size + ' clips') || 'clip';

        this.sendNotification({
            title: 'Getting top ' + title + ' of the ' + this.period + '!',
            message: 'This will take time depending on your download speed.',
            wait: false
        });

        twitch.clips.top(config, (error, result) => {
            if (error) {
              console.log(error);
            } else {
                callback();

                result.clips.forEach((clip, index) => {
                    this.setFileName(index.toString());
                    this.clipList.push(this.options.filename);
                    this.downloadClips(clip, index);
                });
            }
        });
    };

    this.downloadClips = (clip, index) => {
        download(this.generateDownloadUrl(clip), this.options, (error) => {
            this.completed += 1;

            if (this.completed === this.size) {
                let title = this.size > 1 && (this.size + ' clips') || 'clip';
                let be = this.size > 1 && ' are ' || ' is ';
                this.sendNotification({
                    title: 'Top ' + title + ' of the ' + this.period + be + 'ready!',
                    message: 'Click to show in folder.',
                    wait: true
                }, () => {
                    exec('start videos\\' + parser.getFormattedDate());
                    setTimeout(() => {
                        process.exit();
                    }, 2000);
                }, () => {
                    process.exit();
                });
            }
        });
    };

    this.sendNotification = (config, onClick, timeout) => {
        notifier.notify({
            title: config.title,
            message: config.message,
            icon: path.join(__dirname, 'icon.ico'),
            sound: false,
            appID: 'twitch-parser',
            wait: config.wait
        });

        if (typeof onClick === 'function') {
            notifier.on('click', function(notifierObject, options) {
                onClick();
            });
        };

        if (typeof timeout === 'function') {
            notifier.on('timeout', function(notifierObject, options) {
                timeout();
            });
        };
    };

    this.generateDownloadUrl = (clip) => {
        var videoUrl = 'https://clips-media-assets2.twitch.tv/';
        var videoId = clip.thumbnails.medium.split('tv/').pop().split('-preview').shift();
        var generatedUrl = videoUrl + videoId + '.mp4';

        return generatedUrl;
    };

    this.getFormattedDate = () => {
        var date = new Date();
        return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
    };

    this.createFolder = () => {
        exec('mkdir /videos' + this.getFormattedDate());
    };

    this.setDirectory = (path) => {
        this.options.directory = path;
    };

    this.setFileName = (name) => {
        this.options.filename = this.generateFileName(name);
    };

    this.generateFileName = (name) => {
        return name.split(' ').join('_') + '.mp4';
    };

    this.initialize();
};

var twitchParser = new TwitchParser;
