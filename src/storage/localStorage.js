"use strict";

var util = require("../util");
var $ = util.$;
var Offline = require("./util.js"); //local store util

var LocalStorage;
/**
 * class:: LocalStorage([options])
 *
 * LocalStorage is a storage component that talks to a remote JSON + HTTP API
 * that should be relatively easy to implement with any web application
 * framework.
 *
 * :param Object options: See :attr:`~annotator.storage.LocalStorage.options`.
 */
LocalStorage = exports.LocalStorage = function LocalStorage(options) {
    this.options = $.extend(true, {}, LocalStorage.options, options);
    this.onError = this.options.onError;
    this.store = new Offline.LocalStore();
};

/**
 * function:: LocalStorage.prototype.create(annotation)
 *
 * Create an annotation.
 *
 * **Examples**::
 *
 *     store.create({text: "my new annotation comment"})
 *     // => Results in an HTTP POST request to the server containing the
 *     //    annotation as serialised JSON.
 *
 * :param Object annotation: An annotation.
 * :returns: The request object.
 * :rtype: Promise
 */
LocalStorage.prototype.create = function (annotation) {

    try {
        annotation.uri = this.URI();
        annotation = this.addAnnotation(annotation);
        this.cache[annotation.id] = annotation;
    } catch (error) {
        this.onError(error);
    }
    //this.trace('create', annotation);
    return annotation;
};

LocalStorage.prototype.trace = function (action, annotation) {
    var copyAnno = JSON.parse(JSON.stringify(annotation));
    // console.debug("annotator.storage.debug: " + action, copyAnno);
}

/**
 * function:: LocalStorage.prototype.update(annotation)
 *
 * Update an annotation.
 *
 * **Examples**::
 *
 *     store.update({id: "blah", text: "updated annotation comment"})
 *     // => Results in an HTTP PUT request to the server containing the
 *     //    annotation as serialised JSON.
 *
 * :param Object annotation: An annotation. Must contain an `id`.
 * :returns: The request object.
 * :rtype: Promise
 */
LocalStorage.prototype.update = function (annotation) {
    //this.trace('update', annotation);
    try {
        annotation = this.updateStoredAnnotation(annotation)
    } catch (error) {
        this.onError(error);
    }
    return annotation;
};

/**
 * function:: LocalStorage.prototype.delete(annotation)
 *
 * Delete an annotation.
 *
 * **Examples**::
 *
 *     store.delete({id: "blah"})
 *     // => Results in an HTTP DELETE request to the server.
 *
 * :param Object annotation: An annotation. Must contain an `id`.
 * :returns: The request object.
 * :rtype: Promise
 */
LocalStorage.prototype["delete"] = function (annotation) {
    //this.trace('destroy', annotation);
    try {
        annotation = this.removeStoredAnnotation(annotation);
    } catch (error) {
        this.onError(error)
    }
    return annotation;
};

/**
 * function:: LocalStorage.prototype.query(queryObj)
 *
 * Searches for annotations matching the specified query.
 *
 * :param Object queryObj: An object describing the query.
 * :returns:
 *   A promise, resolves to an object containing query `results` and `meta`.
 * :rtype: Promise
 */
LocalStorage.prototype.query = function (queryObj) {
    //this.trace('query', queryObj);
    var results = []
    try {
        results = this.loadAnnotationsFromStore();
    } catch (error) {
        this.onError(error);
    }
    return {
        results: results,
        meta: {
            total: results.length
        }
    };
};


LocalStorage.prototype.UUID = function () {
    return ("" + Math.random() + new Date().getTime()).slice(2);
}


LocalStorage.prototype.ANNOTATION_PREFIX = "annotation.";
LocalStorage.prototype.cache = {};
LocalStorage.prototype.URI = function () {
    return window.location.href;
}



LocalStorage.prototype.getUniqueKey = function (annotation) {
    annotation.uuid = annotation.uuid ? annotation.uuid : this.UUID()
    return annotation.uuid
}

LocalStorage.prototype.shouldLoadAnnotation = function (annotation) {
    return true
}

LocalStorage.prototype.keyForAnnotation = function (annotation) {
    return this.getUniqueKey(annotation)
}

LocalStorage.prototype.keyForStore = function (annotation) {
    return this.ANNOTATION_PREFIX + this.keyForAnnotation(annotation)
}

LocalStorage.prototype.removeStoredAnnotation = function (annotation) {
    var uuid = this.keyForAnnotation(annotation)
    var key = this.keyForStore(annotation)
    this.store.remove(key)
    delete this.cache[uuid]
    return annotation
}

LocalStorage.prototype.updateStoredAnnotation = function (annotation) {
    var uuid = this.keyForAnnotation(annotation)
    var key = this.keyForStore(annotation)

    var local = this.cache[uuid]

    this.store.set(key, annotation, 3600)
    return annotation
}

LocalStorage.prototype.addAnnotation = function (annotation) {
    var uuid = this.keyForAnnotation(annotation)
    var key = this.keyForStore(annotation)
    var k = this.store.set(key, annotation, 3600);
    return annotation;
}

LocalStorage.prototype.loadAnnotationsFromStore = function () {
    var current = []
    var annotations = this.store.all(this.ANNOTATION_PREFIX)

    for (let annotation of annotations) {
        if (annotation && annotation.hasOwnProperty('uri') && annotation.uri === this.URI()) {
            this.cache[annotation.id] = annotation
            current.push(annotation)
        }
    }
    //console.log('store length', current.length)
    return current;

}