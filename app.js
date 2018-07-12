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

    this.size = 20;
    this.completed = 0;
    this.clipList = [];
    this.options = {
        directory: '',
        filename: ''
    };

    this.initialize = () => {
        this.getClips({
            limit: this.size,
            language: 'en',
            period: 'day',
            trending: false
        }, () => {
            this.createFolder();
            this.setDirectory('./videos/' + this.getFormattedDate());
        });
    };

    this.getClips = (config, callback) => {
        twitch.clientID = 'th6nyhyb09o3rn71ozhhemx5se9lsp';

        this.sendNotification({
            message: 'Getting top clips!',
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
                this.sendNotification({
                    message: 'Clips are ready!',
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
            title: 'Twitch Parser',
            message: config.message,
            icon: path.join(__dirname, 'icon.ico'),
            sound: false,
            wait: config.wait
        });

        if (typeof onClick === 'function') {
            notifier.on('click', function(notifierObject, options) {
                // Triggers if `wait: true` and user clicks notification
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
