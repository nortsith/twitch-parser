let express = require('express');
let app = express();
let serv = require('http').Server(app);
let twitch = require('twitch-api-v5');
let request = require('request');
let download = require('download-file');
const { exec } = require('child_process');
let size = 20;

var clipList = [];
var options = {
    directory: './videos',
    filename: ''
};

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server Started');

twitch.clientID = 'foawqf11szicd1l0x5z336np76po9ly';

twitch.clips.top({limit: size, language: 'tr', period: 'week', trending: true}, (error, result) => {
    if (error) {
        console.log(error);
    } else {
        result.clips.forEach((clip, index) => {
            var videoUrl = 'https://clips-media-assets2.twitch.tv/';
            var videoId = clip.thumbnails.medium.split('tv/').pop().split('-preview').shift();
            var generatedUrl = videoUrl + videoId + '.mp4';

            options.filename = clip.broadcast_id + '.mp4';

            clipList.push('videos/' + options.filename);

            console.log('Download started >', options.filename);

            download(generatedUrl, options, (error) => {
                if (index + 1 === size) {
                    console.log('Ending proccess!');

                    setTimeout(() => {
                        process.exit();
                    }, 2000);
                }
            });
        });
    }
});
