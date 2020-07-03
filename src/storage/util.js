// Helper methods for working with localStorage. Adds support for storing
// objects as serialized JSON, setting expiry times on stored keys and catching
// exceptions.
//
// Caught execeptions can be listened for by subscribing to the "error" event
// which will recieve the error object.
//
// Examples
//
//   store = new Store()
//
//   store.set("name", "Aron")
//   store.get("name") //=> Aron
//   store.remove("name")
//
// Returns a new instance of Store.
function Store() {
    // Internal: Prefix for all keys stored by the store.
    this.KEY_PREFIX = "annotator.offline/";

    // Internal: Delimeter used to seperate the cache time from the value.
    this.CACHE_DELIMITER = "--cache--";

    // Internal: Reference to the global localStorage object.
    this.localStorage = window.localStorage;
}

// Public: Checks to see if the current browser supports local storage.
//
// Examples
//
//   store = new Store if Store.isSupported()
//
// Returns true if the browser supports local storage.
Store.prototype.isSupported = function () {
    try {
        return typeof (Storage) ? true : false;
    } catch (e) {
        return false;
    }
}

// Public: Get the current time as a unix timestamp in
// milliseconds.
//
// Examples
//
//   Store.now() //=> 1325099398242
//
// Returns the current time in milliseconds.
Store.prototype.now = function () {
    return new Date().getTime();
}

// Public: Extracts all the values stored under the KEY_PREFIX. An additional
// partial key can be provided that will be added to the prefix.
//
// partial - A partial database key (default: "").
//
// Examples
//
//   values = store.all()
//   some   = store.all("user") // All keys beginning with "user"
//
// Returns an array of extracted keys.
Store.prototype.all = function (partial) {
    if (!partial) {
        partial = "";
    }
    var values = []
    var prefix = this.prefixed(partial)
    for (var key in this.localStorage) {
        if (this.localStorage.hasOwnProperty(key)) {
            if (key.indexOf(prefix) == 0) {
                value = this.get(key.slice(this.KEY_PREFIX.length))
                values.push(value)
            }
        }
    }
    return values
};

// Public: Gets a key from localStorage. Checks the expiry of
// the key when set, if expired returns null.
//
// key - The key String to lookup.
//
// Examples
//
//   store.set("api-key", "12345")
//   store.get("api-key") //=> "12345"
//   store.get("non-existant") //=> null
//
// Returns the stored value or null if not found.
Store.prototype.get = function (key) {
    var value = this.localStorage.getItem(this.prefixed(key));
    /*if (value) {
        value = this.checkCache(value);
    }*/
    if (!value) {
        this.remove(key);
    }
    return JSON.parse(value)
};

// Public: Sets a value for the key provided. An optional "expires" time in
// milliseconds can be provided, the key will not be accessble via //get() after
// this time.
//
// All values will be serialized with JSON.stringify() so ensure that they
// do not have recursive properties before passing them to //set().
//
// key   - A key string to set.
// value - A value to set.
// time  - Expiry time in milliseconds (default: null).
//
// Examples
//
//   store.set("key", 12345)
//   store.set("temporary", {user: 1}, 3000)
//   store.get("temporary") //=> {user: 1}
//   setTimeout ->
//     store.get("temporary") //=> null
//   , 3000
//
// Returns itself.
Store.prototype.set = function (key, value, time) {
    value = JSON.stringify(value);
    if (time) {
        try {
            this.localStorage.setItem(this.prefixed(key), value);
        } catch (error) {
            this.publish('error', [error, this]);
        }

    }
    return this;
}

// Public: Removes the key from the localStorage.
//
// key - The key to remove.
//
// Examples
//
//   store.set("name", "Aron")
//   store.remove("key")
//   store.get("name") //=> null
//
// Returns itself.
Store.prototype.remove = function (key) {
    this.localStorage.removeItem(this.prefixed(key));
    return this;
}

// Public: Removes all keys in local storage with the prefix.
//
// Examples
//
//   store.clear()
//
// Returns itself.
Store.prototype.clear = function () {
    var localStorage = this.localStorage;
    for (key of localStorage) {
        if (key.indexOf(this.KEY_PREFIX) == 0) {
            localStorage.removeItem(key);
        }
    }

    return this;
}

// Internal: Applies the KEY_PREFIX to the provided key. This is used to
// namespace keys in localStorage.
//
// key - A user provided key to prefix.
//
// Examples
//
//   store.prefixed("name") //=> "annotator.readmill/name"
//
// Returns a prefixed key.
Store.prototype.prefixed = function (key) {
    return this.KEY_PREFIX + key;
}

// Internal: Checks the expiry period (if any) of a value extracted from
// localStorage. Returns the value if it is still valid, otherwise returns
// null.
//
// param - comment
//
// Examples
//
//   store.checkCache("1325099398242--cache--\"expired\") //=> null
//   store.checkCache("1325199398242--cache--\"valid\") //=> "valid"
//
// Returns extracted value or null if expired.
Store.prototype.checkCache = function (value) {
    if (value.indexOf(this.CACHE_DELIMITER) > -1) {
        // If the expiry time has passed then return null.
        cached = value.split(this.CACHE_DELIMITER)
        value = this.now() > cached.shift() ? cached.shift() : null
    } else {
        cached.join(this.CACHE_DELIMITER)
    }
    return value
}
exports.LocalStore = Store;