import { Map } from "immutable";

export class TwoWayMap<K, V> {
  private keyToValue: Map<K, V>;
  private valueToKey: Map<V, K>;

  constructor() {
    this.keyToValue = Map<K, V>();
    this.valueToKey = Map<V, K>();
  }

  set(key: K, value: V): void {
    if (this.keyToValue.has(key) || this.valueToKey.has(value)) {
      throw new Error("This key or value is already in the map.");
    }
    this.keyToValue = this.keyToValue.set(key, value);
    this.valueToKey = this.valueToKey.set(value, key);
  }

  get(keyOrValue: K | V): K | V | undefined {
    return this.keyToValue.get(keyOrValue as K) ?? this.valueToKey.get(keyOrValue as V);
  }

  has(keyOrValue: K | V): boolean {
    return this.keyToValue.has(keyOrValue as K) || this.valueToKey.has(keyOrValue as V);
  }

  hasSomething(): boolean {
    return this.keyToValue.size > 0;
  }

  getSomething(): [K, V] | undefined {
    if (this.keyToValue.size === 0) {
      return undefined;
    }

    const [key, value] = this.keyToValue.first(undefined);

    if (key === undefined || value === undefined) {
      return undefined;
    }

    return [key, value];
  }

  getKey(value: V): K | undefined {
    return this.valueToKey.get(value);
  }

  getValue(key: K): V | undefined {
    return this.keyToValue.get(key);
  }

  hasKey(key: K): boolean {
    return this.keyToValue.has(key);
  }

  hasValue(value: V): boolean {
    return this.valueToKey.has(value);
  }
}

// Usage
// let map = new TwoWayMap<string, number>();
// map.set('one', 1);
// console.log(map.get('one')); // 1
// console.log(map.get(1)); // 'one'
// console.log(map.has('one')); // true
// console.log(map.has(1)); // true
// console.log(map.hasSomething()); // true
// console.log(map.getSomething()); // ['one', 1]
