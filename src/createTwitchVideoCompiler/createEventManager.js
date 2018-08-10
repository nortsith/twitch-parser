// @flow

import Observable, { type Observer } from 'zen-observable';

import { type TwitchClip } from './getClips';

type FetchingClipsEvent = $ReadOnly<{|
  name: 'fetchingClips',
|}>;

type PreparingVideosEvent = $ReadOnly<{|
  name: 'preparingVideos',
|}>;

type DownloadingClipEvent = $ReadOnly<{|
  name: 'downloadingClip',
  clip: TwitchClip,
|}>;

type TranscodingClipEvent = $ReadOnly<{|
  name: 'transcodingClip',
  clip: TwitchClip,
|}>;

type GeneratingCompilationEvent = $ReadOnly<{|
  name: 'generatingCompilation',
|}>;

type CompleteEvent = $ReadOnly<{|
  name: 'complete',
  clips: $ReadOnlyArray<TwitchClip>,
  elapsedTime: number,
|}>;

export type Event =
  | FetchingClipsEvent
  | PreparingVideosEvent
  | DownloadingClipEvent
  | TranscodingClipEvent
  | GeneratingCompilationEvent
  | CompleteEvent;

export type Events = Observable<Event>;

type EventManager = $ReadOnly<{|
  events: Events,
  send: (event: Event) => mixed,
|}>;

export default function createEventManager(): EventManager {
  const eventObservers: Set<Observer<Event>> = new Set();

  const events = new Observable((observer) => {
    eventObservers.add(observer);
    return () => {
      eventObservers.delete(observer);
    };
  });

  const send = (event: Event) => eventObservers.forEach((o) => o.next(event));

  return {
    events,
    send,
  };
}
