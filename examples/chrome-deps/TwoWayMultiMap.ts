import { Map, Set } from "immutable";

export class TwoWayMultiMap<K, V> {
  private keyToValues: Map<K, Set<V>>;
  private valueToKeys: Map<V, Set<K>>;

  constructor() {
    this.keyToValues = Map<K, Set<V>>();
    this.valueToKeys = Map<V, Set<K>>();
  }

  set(key: K, value: V, reset = false): void {
    let values = this.keyToValues.get(key, Set<V>());
    if (reset) {
      values.clear();
    }
    values = values.add(value);
    this.keyToValues = this.keyToValues.set(key, values);

    let keys = this.valueToKeys.get(value, Set<K>());
    keys = keys.add(key);
    this.valueToKeys = this.valueToKeys.set(value, keys);
  }

  getKeys(value: V): Set<K> | undefined {
    return this.valueToKeys.get(value);
  }

  getValues(key: K): Set<V> | undefined {
    return this.keyToValues.get(key);
  }

  hasKey(key: K): boolean {
    return this.keyToValues.has(key);
  }

  hasValue(value: V): boolean {
    return this.valueToKeys.has(value);
  }

  hasSomething(): boolean {
    return this.keyToValues.size > 0;
  }

  getSomething(): [K, Set<V>] | undefined {
    if (this.keyToValues.size === 0) {
      return undefined;
    }

    const [key, values] = this.keyToValues.first(undefined);

    if (key === undefined || values === undefined || values.isEmpty()) {
      return undefined;
    }

    return [key, values];
  }

  get(keyOrValue: K | V): Set<V> | Set<K> | undefined {
    return this.keyToValues.get(keyOrValue as K) ?? this.valueToKeys.get(keyOrValue as V);
  }

  includes(array: Array<K | V>, item: K | V): boolean {
    const set = this.get(item);
    if (set === undefined) {
      return false;
    }
    for (const elem of array) {
      if (set.includes(elem as K & V)) {
        return true;
      }
    }
    return false;
  }
}

// Usage
// let map = new TwoWayMultiMap<string, number>();
// map.set('one', 1);
// map.set('one', 2);
// console.log(map.getValues('one')); // Set {1, 2}
// console.log(map.getKeys(1)); // Set {'one'}
// console.log(map.hasKey('one')); // true
// console.log(map.hasValue(1)); // true
// console.log(map.hasSomething()); // true
// console.log(map.getSomething()); // ['one', Set {1, 2}]
