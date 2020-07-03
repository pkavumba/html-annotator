/*package annotator.storage */

"use strict";

var util = require("./util");
var $ = util.$;
var _t = util.gettext;
var Promise = util.Promise;



var HttpStorage = require("./storage/httpStorage").HttpStorage;
var LocalStorage = require("./storage/localStorage").LocalStorage;

exports.HttpStorage = HttpStorage;
exports.LocalStorage = this.LocalStorage;

// id returns an identifier unique within this session
var id = (function () {
    var counter;
    counter = -1;
    return function () {
        return (counter += 1);
    };
})();

/**
 * function:: debug()
 *
 * A storage component that can be used to print details of the annotation
 * persistence processes to the console when developing other parts of
 * Annotator.
 *
 * Use as an extension module::
 *
 *     app.include(annotator.storage.debug);
 *
 */
exports.debug = function () {
    function trace(action, annotation) {
        var copyAnno = JSON.parse(JSON.stringify(annotation));
        console.debug("annotator.storage.debug: " + action, copyAnno);
    }

    return {
        create: function (annotation) {
            annotation.id = id();
            trace("create", annotation);
            return annotation;
        },

        update: function (annotation) {
            trace("update", annotation);
            return annotation;
        },

        delete: function (annotation) {
            trace("destroy", annotation);
            return annotation;
        },

        query: function (queryObj) {
            trace("query", queryObj);
            return {
                results: [],
                meta: {
                    total: 0,
                },
            };
        },

        configure: function (registry) {
            registry.registerUtility(this, "storage");
        },
    };
};

/**
 * function:: noop()
 *
 * A no-op storage component. It swallows all calls and does the bare minimum
 * needed. Needless to say, it does not provide any real persistence.
 *
 * Use as a extension module::
 *
 *     app.include(annotator.storage.noop);
 *
 */
exports.noop = function () {
    return {
        create: function (annotation) {
            if (typeof annotation.id === "undefined" || annotation.id === null) {
                annotation.id = id();
            }
            return annotation;
        },

        update: function (annotation) {
            return annotation;
        },

        delete: function (annotation) {
            return annotation;
        },

        query: function () {
            return {
                results: [],
            };
        },

        configure: function (registry) {
            registry.registerUtility(this, "storage");
        },
    };
};



/**
 * function:: http([options])
 *
 * A module which configures an instance of
 * :class:`annotator.storage.HttpStorage` as the storage component.
 *
 * :param Object options:
 *   Configuration options. For available options see
 *   :attr:`~annotator.storage.HttpStorage.options`.
 */
exports.http = function http(options) {
    // This gets overridden on app start
    var notify = function () {};

    if (typeof options === "undefined" || options === null) {
        options = {};
    }

    // Use the notifier unless an onError handler has been set.
    options.onError =
        options.onError ||
        function (msg, xhr) {
            console.error(msg, xhr);
            notify(msg, "error");
        };

    var storage = new HttpStorage(options);

    return {
        configure: function (registry) {
            registry.registerUtility(storage, "storage");
        },

        start: function (app) {
            //console.log(app)
            notify = app.notify;
        },
    };
};


/**
 * function:: http([options])
 *
 * A module which configures an instance of
 * :class:`annotator.storage.HttpStorage` as the storage component.
 *
 * :param Object options:
 *   Configuration options. For available options see
 *   :attr:`~annotator.storage.HttpStorage.options`.
 */
exports.localStore = function localStore(options) {
    // This gets overridden on app start
    var notify = function () {};

    if (typeof options === "undefined" || options === null) {
        options = {};
    }

    // Use the notifier unless an onError handler has been set.
    options.onError =
        options.onError ||
        function (msg, xhr) {
            console.error(msg, xhr);
            notify(msg, "error");
        };

    var storage = new LocalStorage(options);

    return {
        configure: function (registry) {
            registry.registerUtility(storage, "storage");
        },

        start: function (app) {
            //console.log(app)
            notify = app.notify;
        },
    };
};

/**
 * class:: StorageAdapter(store, runHook)
 *
 * StorageAdapter wraps a concrete implementation of the Storage interface, and
 * ensures that the appropriate hooks are fired when annotations are created,
 * updated, deleted, etc.
 *
 * :param store: The Store implementation which manages persistence
 * :param Function runHook: A function which can be used to run lifecycle hooks
 */
function StorageAdapter(store, runHook) {
    this.store = store;
    this.runHook = runHook;
}

/**
 * function:: StorageAdapter.prototype.create(obj)
 *
 * Creates and returns a new annotation object.
 *
 * Runs the 'beforeAnnotationCreated' hook to allow the new annotation to be
 * initialized or its creation prevented.
 *
 * Runs the 'annotationCreated' hook when the new annotation has been created
 * by the store.
 *
 * **Examples**:
 *
 * ::
 *
 *     registry.on('beforeAnnotationCreated', function (annotation) {
 *         annotation.myProperty = 'This is a custom property';
 *     });
 *     registry.create({}); // Resolves to {myProperty: "This is a…"}
 *
 *
 * :param Object annotation: An object from which to create an annotation.
 * :returns Promise: Resolves to annotation object when stored.
 */
StorageAdapter.prototype.create = function (obj) {
    if (typeof obj === "undefined" || obj === null) {
        obj = {};
    }
    return this._cycle(
        obj,
        "create",
        "beforeAnnotationCreated",
        "annotationCreated"
    );
};

/**
 * function:: StorageAdapter.prototype.update(obj)
 *
 * Updates an annotation.
 *
 * Runs the 'beforeAnnotationUpdated' hook to allow an annotation to be
 * modified before being passed to the store, or for an update to be prevented.
 *
 * Runs the 'annotationUpdated' hook when the annotation has been updated by
 * the store.
 *
 * **Examples**:
 *
 * ::
 *
 *     annotation = {tags: 'apples oranges pears'};
 *     registry.on('beforeAnnotationUpdated', function (annotation) {
 *         // validate or modify a property.
 *         annotation.tags = annotation.tags.split(' ')
 *     });
 *     registry.update(annotation)
 *     // => Resolves to {tags: ["apples", "oranges", "pears"]}
 *
 * :param Object annotation: An annotation object to update.
 * :returns Promise: Resolves to annotation object when stored.
 */
StorageAdapter.prototype.update = function (obj) {
    if (typeof obj.uuid === "undefined" || obj.uuid === null) {
        throw new TypeError("annotation must have an id for update()");
    }
    return this._cycle(
        obj,
        "update",
        "beforeAnnotationUpdated",
        "annotationUpdated"
    );
};

/**
 * function:: StorageAdapter.prototype.delete(obj)
 *
 * Deletes the annotation.
 *
 * Runs the 'beforeAnnotationDeleted' hook to allow an annotation to be
 * modified before being passed to the store, or for the a deletion to be
 * prevented.
 *
 * Runs the 'annotationDeleted' hook when the annotation has been deleted by
 * the store.
 *
 * :param Object annotation: An annotation object to delete.
 * :returns Promise: Resolves to annotation object when deleted.
 */
StorageAdapter.prototype["delete"] = function (obj) {
    if (typeof obj.uuid === "undefined" || obj.uuid === null) {
        throw new TypeError("annotation must have an id for delete()");
    }
    return this._cycle(
        obj,
        "delete",
        "beforeAnnotationDeleted",
        "annotationDeleted"
    );
};

/**
 * function:: StorageAdapter.prototype.query(query)
 *
 * Queries the store
 *
 * :param Object query:
 *   A query. This may be interpreted differently by different stores.
 *
 * :returns Promise: Resolves to the store return value.
 */
StorageAdapter.prototype.query = function (query) {
    //console.log('running')
    return Promise.resolve(this.store.query(query));
};

/**
 * function:: StorageAdapter.prototype.load(query)
 *
 * Load and draw annotations from a given query.
 *
 * Runs the 'load' hook to allow modules to respond to annotations being loaded.
 *
 * :param Object query:
 *   A query. This may be interpreted differently by different stores.
 *
 * :returns Promise: Resolves when loading is complete.
 */
StorageAdapter.prototype.load = function (query) {
    var self = this;
    //console.log("loading");
    return this.query(query).then(function (data) {
        self.runHook("annotationsLoaded", [data.results]);
    });
};

// Cycle a store event, keeping track of the annotation object and updating it
// as necessary.
StorageAdapter.prototype._cycle = function (
    obj,
    storeFunc,
    beforeEvent,
    afterEvent
) {
    var self = this;
    return this.runHook(beforeEvent, [obj])
        .then(function () {
            var safeCopy = $.extend(true, {}, obj);
            delete safeCopy._local;

            // We use Promise.resolve() to coerce the result of the store
            // function, which can be either a value or a promise, to a promise.
            var result = self.store[storeFunc](safeCopy);
            return Promise.resolve(result);
        })
        .then(function (ret) {
            // Empty obj without changing identity
            for (var k in obj) {
                if (obj && obj.hasOwnProperty(k)) {
                    if (k !== "_local") {
                        delete obj[k];
                    }
                }
            }

            // Update with store return value
            $.extend(obj, ret);
            self.runHook(afterEvent, [obj]);
            return obj;
        });
};

exports.StorageAdapter = StorageAdapter;