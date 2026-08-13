const chai = require('chai');
const sinon = require('sinon');

const assert = chai.assert;

[
    'called',
    'calledOnce',
    'calledWith',
    'calledWithExactly',
    'calledWithMatch',
    'callCount',
    'notCalled',
    'neverCalledWith'
].forEach(function (method) {
    assert[method] = sinon.assert[method].bind(sinon.assert);
});

module.exports = {assert: assert};
