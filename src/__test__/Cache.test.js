/*
 * Cache.test.js
 */

import Cache from '../Cache';

var p1 = { any: "params", };
var p2 = { any: "other value"};
// 3 and 4 are the same, but different order; this isn't really testing much,
// but the test should always work because the cache sorts the keys.
var p3 = { more: 'keys', to: 'map', any: "params", };
var p4 = { to: 'map', any: "params", more: 'keys', };

// A cache of length zero will cache 1 value.
describe("size 0 cache (actually size 1); overwritten value.", ()=> {
  var cache = new Cache({size: 1});
  describe("1: put w/keyData: " + objToString(p1), () => {
    cache.put(p1, "v1");
    TH_cache2(cache, {
      wantKeys: ["[params]"],
      wantCached: [[p1, 'v1']],
    })
  });
  describe("2: overwrite a value: put w/keyData: " + objToString(p1), () => {
    cache.put(p1, "v2");
    TH_cache2(cache, {
      wantKeys: ["[params]"],
      wantCached: [[p1, 'v2']],
    })
  });
});

// Note that the keys are sorted alphabetically (keys, not values).
// this test might not matter - it depends on sorting rules.
describe("size 1 cache; key attributes are sorted", ()=> {
  var cache = new Cache({size: 1});
  describe("1: put w/keyData: " + objToString(p3), () => {
    cache.put(p3, "v1");
    TH_cache2(cache, {
      wantKeys: ["[params][keys][map]"],
      wantCached: [[p4, 'v1']],
    })
  });
  describe("2: put w/keyData: " + objToString(p4), () => {
    cache.put(p4, "v2");
    TH_cache2(cache, {
      wantKeys: ["[params][keys][map]"],
      wantCached: [[p3, 'v2']],
    })
  });
});

describe("size 2; make sure re-added items are not dropped prematurely", ()=> {
  var cache  = new Cache({size: 2});

  describe("1: put w/keyData: " + objToString(p1), () => {
    cache.put(p1, "v1");
    TH_cache2(cache, {
      wantKeys: ["[params]"],
      wantCached: [[p1, 'v1']],
    })
  });

  describe("2: put w/keyData: " + objToString(p2), () => {
    cache.put(p3, "v2");
    TH_cache2(cache, {
      wantKeys: ["[params]", "[params][keys][map]"],
      wantCached: [[p1, 'v1'], [p3, 'v2']],
    })
  });

  // replace p1 with a new cached value.
  describe("3: put w/keyData: " + objToString(p2), () => {
    cache.put(p1, "v3");
    TH_cache2(cache, {
      wantKeys: ["[params][keys][map]", "[params]"],
      wantCached: [[p1, 'v3'], [p3, 'v2']],
    })
  });

  // Add another entry, exceeding the cache size.
  // p3 should be dropped from the cache.
  describe("4: put w/keyData: " + objToString(p2), () => {
    cache.put(p2, "v4");
    TH_cache2(cache, {
      wantKeys: ["[params]", "[other value]"],
      wantCached: [[p1, 'v3'], [p2, 'v4'], [p3, undefined]],
    })
  });

  // Replace the last entry again - cache size is maxed.
  // p3 should be dropped from the cache.
  describe("4: put w/keyData: " + objToString(p2), () => {
    cache.put(p2, "v5");
    TH_cache2(cache, {
      wantKeys: ["[params]", "[other value]"],
      wantCached: [[p1, 'v3'], [p2, 'v5'], [p3, undefined]],
    })
  });
});

// Now let's test a cache that only looks at specific keys.
describe("key attributes (cache based on a subset of passed keys): any, map", ()=> {
  const p1 = { any: 'a1', map: 'm1'};
  const p2 = { any: 'a1' };
  const p3 = { any: 'a1', map: 'm1', other: 'o1'};
  const p4 = { map: 'm1', other: 'o1'};
  var cache  = new Cache({size: 10, keyAttributes:['any', 'map']});

  describe("1: put w/keyData: " + objToString(p1), () => {
    cache.put(p1, "v1");
    TH_cache2(cache, {
      wantKeys: ["[a1][m1]"],
      wantCached: [[p1, 'v1']],
    })
  });

  describe("2: put w/keyData: " + objToString(p2), () => {
    cache.put(p2, "v2");
    TH_cache2(cache, {
      wantKeys: ["[a1][m1]", "[a1][]"],
      wantCached: [[p1, 'v1'], [p2, 'v2']],
    })
  });

  describe("3: put w/keyData: " + objToString(p3), () => {
    cache.put(p3, "v3");
    TH_cache2(cache, {
      wantKeys: ["[a1][]", "[a1][m1]"],
      wantCached: [[p1, 'v3'], [p2, 'v2']],
    })
  });

  describe("4: put w/keyData: " + objToString(p4), () => {
    cache.put(p4, "v4");
    TH_cache2(cache, {
      wantKeys: ["[a1][]", "[a1][m1]", "[][m1]"],
      wantCached: [[p1, 'v3'], [p2, 'v2'], [p4, 'v4']],
    })
  });
});

function objToString(obj) {
  var rv = "{ ";
  var comma = "";
  for (var key in obj) {
    rv += comma+key+": "+obj[key]
    comma=", ";
  }
  return rv + " }";
}
function TH_cache2(cache, e) {
  // we have to pre-extract values because the test implementation.
  const storedKeys = cache.lookup.slice();
  const cachedValues = e.wantCached.map((tuple)=>{
    return [tuple[0], cache.get(tuple[0])];
  });
  test("keyset", ()=> { expect(storedKeys).toEqual(e.wantKeys) })
  test("cached values", ()=> { expect(cachedValues).toEqual(e.wantCached) })
}