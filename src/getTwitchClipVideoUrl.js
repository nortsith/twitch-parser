// @flow

import url from 'url';

import { type TwitchClip } from './getClips';

const baseUrl = 'https://clips-media-assets2.twitch.tv/';

export default function getTwitchClipVideoUrl(clip: TwitchClip): string {
  const videoId = clip.thumbnails.medium
    .split('tv/')
    .pop()
    .split('-preview')
    .shift();

  const videoUrl = new url.URL(`${videoId}.mp4`, baseUrl).href;

  return videoUrl;
}
