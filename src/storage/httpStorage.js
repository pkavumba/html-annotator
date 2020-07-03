"use strict";

var util = require("../util");
var $ = util.$;
var _t = util.gettext;
var Promise = util.Promise;
var axios = require("axios");

var HttpStorage;
/**
 * class:: HttpStorage([options])
 *
 * HttpStorage is a storage component that talks to a remote JSON + HTTP API
 * that should be relatively easy to implement with any web application
 * framework.
 *
 * :param Object options: See :attr:`~annotator.storage.HttpStorage.options`.
 */
HttpStorage = exports.HttpStorage = function HttpStorage(options) {
    this.options = $.extend(true, {}, HttpStorage.options, options);
    this.onError = this.options.onError;
};

/**
 * function:: HttpStorage.prototype.create(annotation)
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
HttpStorage.prototype.create = function (annotation) {
    return this._apiRequest("create", annotation);
};

/**
 * function:: HttpStorage.prototype.update(annotation)
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
HttpStorage.prototype.update = function (annotation) {
    return this._apiRequest("update", annotation);
};

/**
 * function:: HttpStorage.prototype.delete(annotation)
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
HttpStorage.prototype["delete"] = function (annotation) {
    return this._apiRequest("destroy", annotation);
};

/**
 * function:: HttpStorage.prototype.query(queryObj)
 *
 * Searches for annotations matching the specified query.
 *
 * :param Object queryObj: An object describing the query.
 * :returns:
 *   A promise, resolves to an object containing query `results` and `meta`.
 * :rtype: Promise
 */
HttpStorage.prototype.query = function (queryObj) {
    return this._apiRequest("search", queryObj).then(function (obj) {
        var rows = obj.rows;
        delete obj.rows;
        return {
            results: rows,
            meta: obj,
        };
    });
};

/**
 * function:: HttpStorage.prototype.setHeader(name, value)
 *
 * Set a custom HTTP header to be sent with every request.
 *
 * **Examples**::
 *
 *     store.setHeader('X-My-Custom-Header', 'MyCustomValue')
 *
 * :param string name: The header name.
 * :param string value: The header value.
 */
HttpStorage.prototype.setHeader = function (key, value) {
    this.options.headers[key] = value;
};

HttpStorage.prototype.UUID = function () {
    return ("" + Math.random() + new Date().getTime()).slice(2);
}

HttpStorage.prototype.URI = function () {
    return window.location.href;
}

/*
 * Helper method to build an XHR request for a specified action and
 * object.
 *
 * :param String action: The action: "search", "create", "update" or "destroy".
 * :param obj: The data to be sent, either annotation object or query string.
 *
 * :returns: The request object.
 * :rtype: jqXHR
 */
HttpStorage.prototype._apiRequest = async function (action, obj) {
    var id = obj && obj.id;
    var url = this._urlFor(action, id);
    var method = this._methodFor(action);
    obj.uuid = this.UUID();
    //headers: this.options.headers,
    //console.log(url);
    var data;

    //console.log(obj);
    obj.uri = this.URI();
    obj.user = "hello";
    var params = {};
    if (method == "PUT" || method == "POST") {
        data = obj;
    } else {
        data = {};
    }
    if (action == 'search') {
        params = {
            'uri': obj.uri,
            'user': obj.user
        }
    }

    try {
        var res = await axios({
            method: method,
            url: url,
            data: data,
            params: params
        });
        //console.log("async", res.data);
    } catch (error) {
        //console.log(error.response);
        this._onError.apply(self, arguments);
    }

    return obj;
};

/*
 * Builds an options object suitable for use in a jQuery.ajax() call.
 *
 * :param String action: The action: "search", "create", "update" or "destroy".
 * :param obj: The data to be sent, either annotation object or query string.
 *
 * :returns: $.ajax() options.
 * :rtype: Object
 */
HttpStorage.prototype._apiRequestOptions = function (action, obj) {
    var method = this._methodFor(action);
    var self = this;

    var opts = {
        type: method,
        dataType: "json",
        error: function () {
            self._onError.apply(self, arguments);
        },
        headers: this.options.headers,
    };

    // If emulateHTTP is enabled, we send a POST and put the real method in an
    // HTTP request header.
    if (this.options.emulateHTTP && (method === "PUT" || method === "DELETE")) {
        opts.headers = $.extend(opts.headers, {
            "X-HTTP-Method-Override": method,
        });
        opts.type = "POST";
    }

    // Don't JSONify obj if making search request.
    if (action === "search") {
        opts = $.extend(opts, {
            data: obj,
        });
        return opts;
    }

    var data = obj && JSON.stringify(obj);

    // If emulateJSON is enabled, we send a form request (the correct
    // contentType will be set automatically by jQuery), and put the
    // JSON-encoded payload in the "json" key.
    if (this.options.emulateJSON) {
        opts.data = {
            json: data,
        };
        if (this.options.emulateHTTP) {
            opts.data._method = method;
        }
        return opts;
    }

    opts = $.extend(opts, {
        data: data,
        contentType: "application/json; charset=utf-8",
    });
    return opts;
};

/*
 * Builds the appropriate URL from the options for the action provided.
 *
 * :param String action:
 * :param id: The annotation id as a String or Number.
 *
 * :returns String: URL for the request.
 */
HttpStorage.prototype._urlFor = function (action, id) {
    if (typeof id === "undefined" || id === null) {
        id = "";
    }

    var url = "";
    if (
        typeof this.options.prefix !== "undefined" &&
        this.options.prefix !== null
    ) {
        url = this.options.prefix;
    }

    url += this.options.urls[action];
    // If there's an '{id}' in the URL, then fill in the ID.
    url = url.replace(/\{id\}/, id);
    return url + "/";
};

/*
 * Maps an action to an HTTP method.
 *
 * :param String action:
 * :returns String: Method for the request.
 */
HttpStorage.prototype._methodFor = function (action) {
    var table = {
        create: "POST",
        update: "PUT",
        destroy: "DELETE",
        search: "GET",
    };

    return table[action];
};

/*
 * jQuery.ajax() callback. Displays an error notification to the user if
 * the request failed.
 *
 * :param jqXHR: The jqXMLHttpRequest object.
 */
HttpStorage.prototype._onError = function (xhr) {
    if (typeof this.onError !== "function") {
        return;
    }

    var message;
    if (xhr.status === 400) {
        message = _t(
            "The annotation store did not understand the request! " + "(Error 400)"
        );
    } else if (xhr.status === 401) {
        message = _t(
            "You must be logged in to perform this operation! " + "(Error 401)"
        );
    } else if (xhr.status === 403) {
        message = _t(
            "You don't have permission to perform this operation! " + "(Error 403)"
        );
    } else if (xhr.status === 404) {
        message = _t("Could not connect to the annotation store! " + "(Error 404)");
    } else if (xhr.status === 500) {
        message = _t("Internal error in annotation store! " + "(Error 500)");
    } else {
        message = _t("Unknown error while speaking to annotation store!");
    }
    this.onError(message, xhr);
};

/**
 * attribute:: HttpStorage.options
 *
 * Available configuration options for HttpStorage. See below.
 */
HttpStorage.options = {
    /**
     * attribute:: HttpStorage.options.emulateHTTP
     *
     * Should the storage emulate HTTP methods like PUT and DELETE for
     * interaction with legacy web servers? Setting this to `true` will fake
     * HTTP `PUT` and `DELETE` requests with an HTTP `POST`, and will set the
     * request header `X-HTTP-Method-Override` with the name of the desired
     * method.
     *
     * **Default**: ``false``
     */
    emulateHTTP: false,

    /**
     * attribute:: HttpStorage.options.emulateJSON
     *
     * Should the storage emulate JSON POST/PUT payloads by sending its requests
     * as application/x-www-form-urlencoded with a single key, "json"
     *
     * **Default**: ``false``
     */
    emulateJSON: false,

    /**
     * attribute:: HttpStorage.options.headers
     *
     * A set of custom headers that will be sent with every request. See also
     * the setHeader method.
     *
     * **Default**: ``{}``
     */
    headers: {},

    /**
     * attribute:: HttpStorage.options.onError
     *
     * Callback, called if a remote request throws an error.
     */
    onError: function (message) {
        console.error("API request failed: " + message);
    },

    /**
     * attribute:: HttpStorage.options.prefix
     *
     * This is the API endpoint. If the server supports Cross Origin Resource
     * Sharing (CORS) a full URL can be used here.
     *
     * **Default**: ``'/store'``
     */
    prefix: "/store",

    /**
     * attribute:: HttpStorage.options.urls
     *
     * The server URLs for each available action. These URLs can be anything but
     * must respond to the appropriate HTTP method. The URLs are Level 1 URI
     * Templates as defined in RFC6570:
     *
     *    http://tools.ietf.org/html/rfc6570#section-1.2
     *
     *  **Default**::
     *
     *      {
     *          create: '/annotations',
     *          update: '/annotations/{id}',
     *          destroy: '/annotations/{id}',
     *          search: '/search'
     *      }
     */
    urls: {
        create: "/annotations",
        update: "/annotations/{id}",
        destroy: "/annotations/{id}",
        search: "/annotations/",
    },
};