// @flow

// $FlowFixMe
const twitch = require('twitch-api-v5');

export type TwitchClip = $ReadOnly < { |
	id: string,
	tracking_id: string,
	url: string,
	embed_url: string,
	embed_html: string,
	broadcaster: {
		id: string,
		name: string,
		display_name: string,
		channel_url: string,
		logo: string,
	},
	curator: {
		id: string,
		name: string,
		display_name: string,
		channel_url: string,
		logo: string,
	},
	vod: mixed,
	broadcast_id: string,
	game: string,
	language: string,
	title: string,
	views: number,
	duration: number,
	created_at: string,
	thumbnails: {
		medium: string,
		small: string,
		tiny: string,
	},
	|
} > ;

type Config = {
	limit: number,
	language: string,
	period: 'day',
	trending: boolean,
	game: string,
};

export default async function getClips(config: Config): Promise < Array < TwitchClip >> {
	return new Promise((resolve, reject) => {
		twitch.clientID = 'th6nyhyb09o3rn71ozhhemx5se9lsp';

		twitch.clips.top(config, (error, result) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result.clips);
		});
	});
}