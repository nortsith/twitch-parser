// @flow

declare module 'zen-observable' {
  declare export type Observer<T> = {
    next: (value: T) => void,
    error: (error: Error) => void,
    complete: () => void,
  };

  declare export type Subscription = {
    unsubscribe(): void,
    get closed(): boolean,
  };

  declare export type SubscriberFunction<T> = (observer: Observer<T>) => () => void | Subscription;

  declare export default class Observable<T> {
    constructor(subscriber: SubscriberFunction<T>): Observable<T>;

    subscribe(observer: Observer<T>): Subscription;

    subscribe(
      onNext: (value: T) => void,
      onError?: (error: Error) => void,
      onComplete?: Function,
    ): Subscription;
  }
}
