/*
 * GenericFactory.js
 *
 * The goal of this mixin is to provide factory functions to serve database CR
 * (create, retrieve) functionality, with caching.
 *
 * This mixin has 2 jobs:
 *
 * 1. Deliever get and create paramters to the API object provided to it.
 * 2. Deliver the value returned by the API (likely a promise) to the caller.
 * 3. Cache the value returned based attributes provided.
 *
 * On construction accept these things:
 * - An item class and a list class.
 * - A cache item for the item class and a cache item for the list
 *   class.
 *
 * Usage:
 *
 *     class ItemClass { implements(get, update, delete) {}}
 *     class ListClass { implements(get) {}}
 *     itemCache = new Cache({ size: 10 });
 *     listCache = new Cache({ size: 1 });
 *     class Factory extends GenericFactory {
 *        constructor() {
 *            super({
 *                objClass: ItemClass,
 *                objCache: itemCache,
 *                listClass: ListClass,
 *                listCache: listCache,
 *            });
 *        }
 *     }
 * 
 *     itemFactory = new Factory();
 * 
 *     // Get a list of items - maybe a list of clients.
 *     itemList = itemFactory.list();
 *     // We accept properties for the getter methods.
 *     // We might want a list of clients with unpaid invoices.
 *     itemList = itemFactory.list({ APIconstraint: 1, APIArgument: 2 });
 * 
 *     // Get the item with itemId=42.
 *     item = itemFactory.get({ itemId: 42 });
 * 
 *     // Create an item using a prototype item to be sent to the API.
 *     item = item.create(prototypeForNewItem);
 * 
 * # Cache Interface Requriements:
 *
 * The Cache must implement get and put methods that accept a JavaScript
 * object as the cache key:
 *
 *     props = { key: keyValue };
 *     cache.put(props, value);
 *     value = cache.get(props);
 *
 * # This is Experimental
 * 
 * This is still in the experimental stage. Syntax and
 * implementation are subject to change. This will also be subjected to
 * rigorous testing to prove it works.
 *
 */
class GenericFactory {
    /*
     * factory = new GenericFactory(props);
     *
     * Pass in the item and list classes and their cache objects.
     */
    constructor(props) {
        this.itemClass = props.itemClass;
        this.itemCache = props.itemCache;
        this.listClass = props.listClass;
        this.listCache = props.listCache;
    }

    /*
     * list(props)
     *
     * Pass in the attributes the API will use (if any) to get the list you
     * want.
     */
    list(props) {
        // get and return a list of items.
        var rList = this.listCache.get(props);
        if (!rList) {
            var item = new this.listClass(props);
            rList = item.get();
            this.listCache.put(props, rList);
        }
        return rList;
    }

    /*
     * get(props)
     * 
     * Pass in the attributes the API will use to aquire your specific item.
     */
    get(props) {
        // get and return a specific item.
        var value = this.itemCache.get(props);
        if (!value) {
            var item = new this.itemClass(props);
            value = item.get();
            // value may well be a promise; we don't care.
            this.itemCache.put(props, value);
            // We assume that the item in the cache is (===) the item we return.
            // When we are asked for this item again, any changes the app has made
            // to the item we return now should be changed in the item we return
            // later. If this isn't the case, we need the item to be observable
            // and we need to observe changes.
        }
        return value;
    }

    /*
     * create(props)
     * 
     * Pass in the attributes required by the API to create a new item.
     */
    create(props) {
        var item = new this.itemClass(props);
        // We aren't caching data on create.
        return item.create();
    }
}

export default GenericFactory;