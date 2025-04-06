import Store from 'electron-store';

declare module 'electron-store' {
  interface Store<T> {
    get<K extends keyof T>(key: K): T[K];
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    clear(): void;
    store: T;
  }
} 