const express = require('express');
const app = express();
const serv = require('http').Server(app);
const twitch = require('twitch-api-v5');
const request = require('request');
const download = require('download-file');
const { exec } = require('child_process');

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server Started');

function TwitchParser () {
    this.size = 5;
    this.clipList = [];
    this.options = {
        directory: '',
        filename: ''
    };

    this.initialize = () => {
        this.getClips({
            limit: this.size,
            language: 'en',
            period: 'week',
            trending: false
        }, () => {
            this.createFolder();
            this.setDirectory('./videos/' + this.getFormattedDate());
        });
    };

    this.getClips = (config, callback) => {
        twitch.clientID = 'foawqf11szicd1l0x5z336np76po9ly';

        console.log('Sending request!');

        twitch.clips.top(config, (error, result) => {
            if (error) {
              console.log(error);
            } else {
                console.log('Success!');

                callback();

                result.clips.forEach((clip, index) => {
                    this.setFileName(clip.title);
                    this.clipList.push(this.options.filename);
                    this.downloadClips(clip, index);
                });
            }
        });
    };

    this.downloadClips = (clip, index) => {
        console.log('Download started >', this.options.filename);

        download(this.generateDownloadUrl(clip), this.options, (error) => {
            console.log('Download completed >', this.clipList[index]);

            if (index + 1 === this.size) {
                console.log('All videos are downloaded!');

                exec('start videos\\' + this.getFormattedDate());

                setTimeout(() => {
                    process.exit();
                }, 2000);
            }
        });
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
