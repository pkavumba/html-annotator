const sinon = require('sinon');
const FakeXMLHttpRequest = require('fake-xml-http-request');

global.sinon = sinon;
global.sinon.sandbox = {
    create: sinon.createSandbox
};

global.sinon.useFakeXMLHttpRequest = function () {
    const originalGlobal = global.XMLHttpRequest;
    const originalWindow = window.XMLHttpRequest;
    const controller = {
        onCreate: null,
        restore: function () {
            global.XMLHttpRequest = originalGlobal;
            window.XMLHttpRequest = originalWindow;
        }
    };

    function XMLHttpRequest() {
        const request = new FakeXMLHttpRequest();
        if (typeof controller.onCreate === 'function') {
            controller.onCreate(request);
        }
        return request;
    }

    XMLHttpRequest.prototype = FakeXMLHttpRequest.prototype;
    global.XMLHttpRequest = XMLHttpRequest;
    window.XMLHttpRequest = XMLHttpRequest;
    return controller;
};

// The old test suite relied on Karma loading this file before every spec.
// Keep the same browser globals while running the suite under Vitest/jsdom.
global.window.scrollTo = function () {};
delete window.ontouchstart;
Object.defineProperty(window, 'confirm', {
    configurable: true,
    writable: true,
    value: function () { return false; }
});
Object.defineProperty(global, 'getSelection', {
    configurable: true,
    writable: true,
    value: window.getSelection.bind(window)
});
