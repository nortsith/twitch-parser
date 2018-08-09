// @flow

// $FlowFixMe
import notifier from 'node-notifier';

type Config = {
	appId: string,
	iconPath: string,
};

type NotificationOptions = {
	title: string,
	message: string,
	wait?: boolean,
	onClick?: () => mixed,
	onTimeout?: () => mixed,
};

export default class Notifier {
	config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	notify(options: NotificationOptions) {
		const {
			title,
			message,
			wait,
			onClick,
			onTimeout
		} = options;

		notifier.notify({
			title,
			message,
			icon: this.config.iconPath,
			sound: false,
			appID: this.config.appId,
			wait,
		});

		if (onClick) {
			notifier.on('click', () => {
				onClick();
			});
		}

		if (onTimeout) {
			notifier.on('timeout', () => {
				onTimeout();
			});
		}
	}
}