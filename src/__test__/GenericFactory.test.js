/*
 * # Name: GenericFactory.test.js
 *
 * # Strategy
 *
 * - Test list() to return an instance of listClass.
 * - Test get() to return an instance of itemClass.
 * - Test create() to return an instance of itemClass.
 * - Test that items are cached:
 *   - list() caches in the listCache.
 *   - get() caches in the itemCache.
 *   - create() doesn't currently cache.
 *   - We only need to know *that* they are cached.
 *   - The Cache class is already tested: number of cached entries, trimming
 *     the number of enteries, etc does not need to be tested here.
 *
 * # Approach
 *
 * This test uses a test-function approach - that is, it defines a test
 * function and uses that function multiple to run many test cases.
 *
 * The Jest test utility doesn't handle this as well as it might: It gives you
 * a partial stack trace telling you where something went wrong, but the stack
 * trace points to a line inside the test function. It does not tell you which
 * line called that function.
 * 
 */

import GenericFactory from '../GenericFactory';
import Cache from '../Cache';

class Item {
    constructor(props) {
        this.gotProps = {};
        this.gotProps.constructor = props;
    }
    get(props) { this.gotProps.get = props; return this; }
    create(props) { this.gotProps.create = props; return this; }
}
class ItemList {
    constructor(props) {
        this.gotProps = {};
        this.gotProps.constructor = props;
    }
    get(props) { this.gotProps.get = props; return this; }
}

class TestFactory extends GenericFactory {
    constructor() {
        super({
            itemClass: Item,
            itemCache: new Cache({size: 2}),
            listClass: ItemList,
            listCache: new Cache({size: 1}),
        });
    }
}

const testFactory = new TestFactory;

function testMethodCall(props) {
    return () => {
        // clone the attributes we are sending - just to be sure the factor isn't
        // affecting change to the thing we are passing in.
        const wantProps = Object.assign({}, props.sendProps);
        var got = props.factory[props.method](props.sendProps);
        test("type of thingy returned", () => {
            expect(got).toBeInstanceOf(props.wantClass);
        });
        describe("sent the right properties", () => {
            // The factory calls the constructor with the argument list given
            // to it, then calls the get method
            //      instance = new Class(props);
            //      return instance.get();
            test("constructor", ()=>{
                expect(got.gotProps.constructor).toEqual(wantProps);
            });
            test(props.method, ()=>{
                expect(got.gotProps[props.method]).toEqual(undefined);
            });
        });
        if (props.cache) {
        describe("cached the result", () => {
            // The factory calls the constructor with the argument list given
            // to it, then calls the get method
            //      instance = new Class(props);
            //      return instance.get();
            const fromCache = props.cache.get(wantProps);
            test("is cached", ()=>{
                if (props.shouldCache) {
                    expect(fromCache).toBe(got);
                } else {
                    expect(fromCache).not.toBe(got);
                }
            });
        });
        }
    }
}

describe("get list", testMethodCall({
    factory: testFactory,
    cache: testFactory.listCache,
    method: 'list',
    sendProps: { list: 'attributes' },
    wantClass: ItemList,
    shouldCache: true
}));

describe("get item", testMethodCall({
    factory: testFactory,
    cache: testFactory.itemCache,
    method: 'get',
    sendProps: { item: 'attributes' },
    wantClass: Item,
    shouldCache: true
}));

describe("create item", testMethodCall({
    factory: testFactory,
    cache: testFactory.itemCache,
    method: 'create',
    sendProps: { item: 'attributes' },
    wantClass: Item,
    shouldCache: false
}));