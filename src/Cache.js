/*
 * Cache - a simple caching mechanism.
 * Usage:
 *
 *  cache = new Cache({ size: cacheSize });
 *  cache.put(
 *    {list: "value", of: "value", keys: "value"},
 *    payload
 *  );
 *  obj = cache.get(
 *    {list: "value", of: "value", keys: "value"}
 *  );
 *
 * To prevent tight coupling between application and cache, specify the key
 * attributes on instantiation. This way, the application does not need to
 * know which attributes are used to determine whether to return a cached
 * object or not.
 *
 *  cache = new Cache({
 *    size: cacheSize,
 *    keyAttributes: ['key1', 'key2']
 *  });
 *  cache.put(
 *    {key1: "value", key2: "value", key3: "value"},
 *    payload
 *  );
 *  obj = cache.get(
 *    {key1: "value", key2: "value"}
 *  );
 * 
 * How it works:
 *
 * - The cache will store at most cacheSize values.
 * - Call 'put' to cache a value.
 * - Call 'get' to retrieve a value.
 * - The first argument to get and put tells the cache which value to
 *   retrieve.
 * - When you pass a sequence of keys on instantiation, the cache will only
 *   look at those keys regardles of the property set passed to the put and
 *   get methods.
 * - When you pass null instead of the sequence of keys, the cache will check
 *   use all keys passed.
 *
 * How it really works.
 *
 * The object has a lookup list tracking where keys are in the queue and an
 * associative array (called 'cache') linking key and cached data.
 * - When we add a value, we put the key into both lookup[] and cache{}.
 * - When we remove a value, we use lookup.shift() to get the first key off
 *   the list, then we delete that key and its mapped value from the
 *   associative array.
 * - We could be slightly more efficient with this - if the key we are adding into the cache already exists in the cache
 */
class Cache {
  constructor(props) {
    this.size = props.size;
    if (props.keyAttributes) {
      this.keyList = props.keyAttributes;
    }
    this.lookup = [];
    this.cache = {};
  }
  cacheKey(props) {
    var cacheKey = "";
    var keyList = (this.keyList)?(this.keyList):(Object.keys(props).sort());
    for (var i=0; i < keyList.length; i++) {
      if (props[keyList[i]] !== undefined) {
        cacheKey += "["+props[keyList[i]]+"]";
      } else {
        cacheKey += "[]";
      }
    }
    return cacheKey;
  }
  get length() { return this.lookup.length; }
  get(props) {
    return this.cache[this.cacheKey(props)];
  }
  put(props, payload) {
    const key = this.cacheKey(props);
    // trim the cache to length (but not shorter).
    this.trim(key);
    this.cache[key] = payload;
    const i = this.lookup.indexOf(key);
    if (i >= 0) {
      // if the entry exists already, we move it to the end of the queue.
      this.lookup.splice(i, 1);
    }
    this.lookup.push(key);
  }
  trim(key) {
    while (this.lookup.length > 0 && this.lookup.length >= this.size) {
      if (this.lookup.length === this.size) {
        const i = this.lookup.indexOf(key);
        if (i >= 0) {
          // We do not need to remove the item from the associative array.
          break;
        }
      }
      delete(this.cache[this.lookup.shift()])
      // var trimKey = this.lookup.shift();
      // console.log("trim", trimKey, this.cache[trimKey])
      // delete(this.cache[trimKey])
    }
  }
}

export default Cache;