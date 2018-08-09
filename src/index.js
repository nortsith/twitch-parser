const express = require('express');
const app = express();
const serv = require('http').Server(app);
const twitch = require('twitch-api-v5');
const request = require('request');
const download = require('download-file');
const { exec } = require('child_process');
const notifier = require('node-notifier');
const path = require('path');
const ffmpeg = require('ffmpeg');

const projectRoot = path.resolve(__dirname, '..');
const clientRoot = path.join(projectRoot, './client/');
const sourceRoot = path.resolve(__dirname);

app.get('/', function(req, res) {
  res.sendFile(path.join(clientRoot, './index.html'));
});
app.use('/client', express.static(clientRoot));

serv.listen(process.env.PORT || 2000);
console.log('Server Started');

function TwitchParser() {
  const parser = this;

  parser.configuration = {
    size: 5,
    period: 'day',
    language: 'tr',
    trending: false,
    game: '',
  };

  parser.elapsedTime = 0;
  parser.completed = 0;
  parser.transcoded = 0;
  parser.clipList = [];
  parser.options = {
    directory: '',
    filename: '',
  };

  parser.initialize = () => {
    parser.registerApp();
    parser.getClips(
      {
        limit: parser.configuration.size,
        language: parser.configuration.language,
        period: parser.configuration.period,
        trending: parser.configuration.trending,
        game: parser.configuration.game,
      },
      () => {
        parser.createFolder();
        parser.setDirectory(
          './videos/' +
            parser.getFormattedDate() +
            '/' +
            parser.options.directory +
            '/output_' +
            parser.configuration.size +
            '_' +
            parser.configuration.period +
            '_' +
            parser.configuration.language,
        );
      },
    );
  };

  parser.registerApp = function() {
    exec(
      '"' +
        projectRoot +
        '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" -install ' +
        '"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs\\Twitch Parser.lnk" ' +
        '"' +
        projectRoot +
        '\\node_modules\\node-notifier\\vendor\\snoreToast\\SnoreToast.exe" twitch-parser',
    );
  };

  parser.getClips = (config, callback) => {
    twitch.clientID = 'th6nyhyb09o3rn71ozhhemx5se9lsp';

    let title = (parser.configuration.size > 1 && parser.configuration.size + ' clips') || 'clip';

    parser.sendNotification({
      title: 'Getting top ' + title + ' of the ' + parser.configuration.period + '!',
      message: 'This will take time depending on your download speed.',
      wait: false,
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

        let title =
          (parser.configuration.size > 1 && parser.configuration.size + ' clips') || 'clip';
        let be = (parser.configuration.size > 1 && ' are ') || ' is ';

        parser.sendNotification({
          title: 'Top ' + title + ' of the ' + parser.configuration.period + be + 'downloaded!',
          message: 'Generating final video. This will take a while.',
          wait: true,
        });

        parser.transcodeClip(parser.transcoded);
      }
    });
  };

  parser.transcodeClip = (index) => {
    parser.log('Transcoding ' + parser.transcoded + '.mp4...');

    var transcoder = exec(
      'ffmpeg -i ' +
        projectRoot +
        parser.options.directory +
        '/' +
        parser.transcoded +
        '.mp4 -vf setdar=16/9 -video_track_timescale 60000 -ac 1 -ar 48000 -preset ultrafast ' +
        // '-vf "[in]drawtext=fontfile=misc/segoeuil.ttf: text=\'twitch.tv/' + parser.clipList[index].broadcaster.name +
        // '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=40,' +
        // 'drawtext=fontfile=misc/segoeuil.ttf: text=' + parser.clipList[index].game.replace(':', '') +
        // '\': fontcolor=black: fontsize=20: box=1: boxcolor=white@0.9: boxborderw=10: x=(w-text_w)-10: y=100" ' +
        parser.transcoded +
        '_tmp.mp4 -y',
      {
        cwd: './tmp',
      },
    );

    transcoder.on('close', () => {
      parser.log('Transcoding ' + index + '.mp4 completed!');

      exec('rm ' + index + '.mp4', {
        cwd: parser.options.directory,
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

    var merge = exec(
      'ffmpeg -f concat -i mylist.txt -c copy ' +
        projectRoot +
        parser.options.directory +
        '/output.mp4 -y',
      {
        cwd: './tmp',
      },
    );

    merge.on('close', () => {
      parser.log('Merge completed!');

      var description = exec(
        '@echo This video is generated by node.js application! > description.txt' +
          '& @echo. >> description.txt' +
          '& @echo --Details-- >> description.txt' +
          '& @echo Clips: ' +
          parser.configuration.size +
          ', >> description.txt' +
          '& @echo Period: ' +
          parser.configuration.period +
          ', >> description.txt' +
          '& @echo Language: ' +
          parser.configuration.language +
          ', >> description.txt' +
          '& @echo Trending: ' +
          parser.configuration.trending +
          ', >> description.txt' +
          '& @echo Game: ' +
          ((parser.configuration.game == '' && 'Not Specified') || parser.configuration.game) +
          ', >> description.txt' +
          '& @echo Generated in ' +
          (parser.elapsedTime / 60).toFixed(0) +
          ':' +
          (parser.elapsedTime % 60).toFixed(0) +
          ' minutes. >> description.txt' +
          '& @echo. >> description.txt' +
          '& @echo --References-- >> description.txt',
        {
          cwd: parser.options.directory,
        },
      );

      description.on('close', () => {
        var details = '';

        parser.clipList.forEach((clip, index) => {
          details +=
            (index == 0 ? '' : '& ') +
            '@echo --' +
            (index + 1) +
            '. Clip-- >> description.txt' +
            '& @echo ^| Title           : ' +
            clip.title +
            ', >> description.txt' +
            '& @echo ^| Game            : ' +
            clip.game +
            ', >> description.txt' +
            '& @echo ^| Views           : ' +
            clip.views +
            ', >> description.txt' +
            '& @echo ^| Streamer        : ' +
            clip.broadcaster.display_name +
            ', >> description.txt' +
            '& @echo ^| Streamer Channel: ' +
            clip.broadcaster.channel_url +
            ', >> description.txt' +
            '& @echo ^| Curator         : ' +
            clip.curator.display_name +
            ', >> description.txt' +
            '& @echo ^| Curator Channel : ' +
            clip.curator.channel_url +
            ' >> description.txt' +
            '& @echo. >> description.txt';
        });

        exec(details, {
          cwd: parser.options.directory,
        });

        console.log(
          'Elapsed time',
          (parser.elapsedTime / 60).toFixed(0) +
            ':' +
            (parser.elapsedTime % 60).toFixed(0) +
            ' minutes.',
        );

        exec('rm *.mp4', {
          cwd: './tmp',
        });

        exec('rm *.txt', {
          cwd: './tmp',
        });

        parser.sendNotification(
          {
            title: 'Completed!',
            message: 'Final video is generated. Click to open folder.',
            wait: true,
          },
          () => {
            exec('start videos\\' + parser.getFormattedDate());

            setTimeout(() => {
              process.exit();
            }, 2000);
          },
          () => {
            process.exit();
          },
        );
      });
    });
  };

  parser.createList = (callback) => {
    var intro = exec("@echo file 'misc/intro.mp4' > mylist.txt", {
      cwd: './tmp',
    });

    intro.on('close', () => {
      var list = exec(
        "(for %i in (*.mp4) do @echo file '%i' & @echo file 'misc/seperator.mp4') >> mylist.txt",
        {
          cwd: './tmp',
        },
      );

      list.on('close', () => {
        exec("@echo file 'misc/outro.mp4' >> mylist.txt", {
          cwd: './tmp',
        });

        callback();
      });
    });
  };

  parser.sendNotification = (config, onClick, timeout) => {
    notifier.notify({
      title: config.title,
      message: config.message,
      icon: path.join(sourceRoot, 'icon.ico'),
      sound: false,
      appID: 'twitch-parser',
      wait: config.wait,
    });

    if (typeof onClick === 'function') {
      notifier.on('click', function(notifierObject, options) {
        onClick();
      });
    }

    if (typeof timeout === 'function') {
      notifier.on('timeout', function(notifierObject, options) {
        timeout();
      });
    }
  };

  parser.generateDownloadUrl = (clip) => {
    var videoUrl = 'https://clips-media-assets2.twitch.tv/';
    var videoId = clip.thumbnails.medium
      .split('tv/')
      .pop()
      .split('-preview')
      .shift();
    var generatedUrl = videoUrl + videoId + '.mp4';

    return generatedUrl;
  };

  parser.getFormattedDate = () => {
    var date = new Date();
    return date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
  };

  parser.createFolder = () => {
    exec(
      'mkdir /videos' +
        parser.getFormattedDate() +
        '/' +
        parser.options.directory +
        '/output_' +
        parser.configuration.size +
        '_' +
        parser.configuration.period +
        '_' +
        parser.configuration.language,
    );
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

  parser.timer = setInterval(() => {
    parser.elapsedTime++;
  }, 1000);

  parser.initialize();
}

var twitchParser = new TwitchParser();
