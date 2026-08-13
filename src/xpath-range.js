"use strict";

/*
 * Compatibility facade for xpath-range.
 *
 * xpath-range 1.x intentionally exposes a small functional API. Annotator's
 * public range objects predate that release and use BrowserRange,
 * NormalizedRange and SerializedRange instances. Keeping this adapter local
 * lets us use the maintained range resolver without changing annotation
 * serialization or plugin APIs.
 */
var xpathRange = require("xpath-range");
var xpathLibrary = require("simple-xpath-position");
var xpath = {
    fromNode: function (node, root) {
        if (node && node.jquery) {
            node = node[0];
        }
        return [xpathLibrary.fromNode(node, root)];
    },
    toNode: xpathLibrary.toNode
};

function textNodes(root) {
    var nodes = [];
    var walker = root.ownerDocument.createTreeWalker(
        root,
        4,
        null
    );
    var node = walker.nextNode();
    while (node !== null) {
        nodes.push(node);
        node = walker.nextNode();
    }
    return nodes;
}

function firstText(node) {
    while (node !== null && node.nodeType !== 3) {
        node = node.firstChild;
    }
    return node;
}

function lastText(node) {
    while (node !== null && node.nodeType !== 3) {
        node = node.lastChild;
    }
    return node;
}

function commonAncestor(start, end) {
    var ancestor = start.nodeType === 1 ? start : start.parentNode;
    var endParent = end.parentNode;
    while (ancestor !== null) {
        if (ancestor === end || ancestor === endParent ||
                (ancestor.contains && ancestor.contains(endParent))) {
            return ancestor;
        }
        ancestor = ancestor.parentNode;
    }
    return start.ownerDocument.body;
}

function normalizeDomRange(domRange) {
    var start = domRange.startContainer;
    var end = domRange.endContainer;
    var startOffset = domRange.startOffset;
    var endOffset = domRange.endOffset;

    if (start.nodeType !== 3) {
        if (startOffset < start.childNodes.length) {
            start = firstText(start.childNodes[startOffset]);
            startOffset = 0;
        } else {
            start = lastText(start.childNodes[startOffset - 1]);
            startOffset = start ? start.nodeValue.length : 0;
        }
    }
    if (end.nodeType !== 3) {
        if (endOffset > 0) {
            end = lastText(end.childNodes[endOffset - 1]);
            endOffset = end ? end.nodeValue.length : 0;
        } else {
            end = firstText(end.childNodes[0]);
            endOffset = 0;
        }
    }

    if (!start || !end) {
        return null;
    }

    if (start === end) {
        if (startOffset > 0 && startOffset < start.nodeValue.length) {
            start = start.splitText(startOffset);
            end = start;
            endOffset -= startOffset;
        }
        if (endOffset < end.nodeValue.length) {
            end.splitText(endOffset);
        }
    } else {
        if (startOffset > 0 && startOffset < start.nodeValue.length) {
            start = start.splitText(startOffset);
        } else if (startOffset >= start.nodeValue.length) {
            start = start.nextSibling || firstText(start.parentNode.nextSibling);
        }
        if (endOffset < end.nodeValue.length) {
            end.splitText(endOffset);
        }
    }

    if (!start || !end) {
        return null;
    }

    return new NormalizedRange({
        start: start,
        end: end,
        commonAncestor: commonAncestor(start, end)
    });
}

function relativePath(node, root) {
    return xpath.fromNode(node, root)[0];
}

function resolverPath(path, root) {
    // simple-xpath-position emits a leading slash for relative paths, while
    // its resolver expects the first path segment without that slash when the
    // context node is an Element.
    if (root && root.nodeType === 1 && path.charAt(0) === "/") {
        return path.slice(1);
    }
    return path;
}

function resolvePath(path, root) {
    var document = root.ownerDocument || root;
    var expression = path;
    if (root.nodeType === 1 && expression.charAt(0) === "/") {
        expression = "." + expression;
    }
    var result = document.evaluate(
        expression,
        root,
        null,
        9,
        null
    ).singleNodeValue;
    return result || xpath.toNode(resolverPath(path, root), root);
}

function rangeFromSerialized(serialized, root) {
    var document = root.ownerDocument || root;
    var startElement = resolvePath(serialized.start, root);
    var endElement = resolvePath(serialized.end, root);
    if (!startElement) {
        throw new Error("The start node was not found.");
    }
    if (!endElement) {
        throw new Error("The end node was not found.");
    }

    function boundary(element, offset, isEnd) {
        var nodes = textNodes(element);
        var remaining = offset;
        for (var i = 0; i < nodes.length; i++) {
            if (remaining < nodes[i].nodeValue.length ||
                    (isEnd && remaining === nodes[i].nodeValue.length)) {
                return {node: nodes[i], offset: remaining};
            }
            remaining -= nodes[i].nodeValue.length;
        }
        var last = nodes[nodes.length - 1];
        if (!last) {
            throw new Error("The requested text offset was not found.");
        }
        return {node: last, offset: last.nodeValue.length};
    }

    var start = boundary(startElement, serialized.startOffset, false);
    var end = boundary(endElement, serialized.endOffset, true);
    var range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range;
}

function serializeNode(node, root, isEnd, ignoreSelector) {
    var parent = node.parentNode;
    if (ignoreSelector) {
        while (parent && parent.matches && parent.matches(ignoreSelector)) {
            parent = parent.parentNode;
        }
    }
    var nodes = textNodes(parent);
    var offset = 0;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] === node) {
            break;
        }
        offset += nodes[i].nodeValue.length;
    }
    if (isEnd) {
        offset += node.nodeValue.length;
    }
    return {
        path: relativePath(parent, root),
        offset: offset
    };
}

function NormalizedRange(obj) {
    this.commonAncestor = obj.commonAncestor;
    this.start = obj.start;
    this.end = obj.end;
}

NormalizedRange.prototype.normalize = function () {
    return this;
};

NormalizedRange.prototype.textNodes = function () {
    var nodes = textNodes(this.commonAncestor);
    var start = nodes.indexOf(this.start);
    var end = nodes.indexOf(this.end);
    if (start < 0 || end < 0 || end < start) {
        return [];
    }
    return nodes.slice(start, end + 1);
};

NormalizedRange.prototype.text = function () {
    return this.textNodes().map(function (node) {
        return node.nodeValue;
    }).join("");
};

NormalizedRange.prototype.limit = function (bounds) {
    var nodes = this.textNodes().filter(function (node) {
        return node.parentNode === bounds || bounds.contains(node.parentNode);
    });
    if (!nodes.length) {
        return null;
    }
    this.start = nodes[0];
    this.end = nodes[nodes.length - 1];
    this.commonAncestor = commonAncestor(this.start, this.end);
    return this;
};

NormalizedRange.prototype.serialize = function (root, ignoreSelector) {
    var start = serializeNode(this.start, root, false, ignoreSelector);
    var end = serializeNode(this.end, root, true, ignoreSelector);
    return {
        start: start.path,
        startOffset: start.offset,
        end: end.path,
        endOffset: end.offset
    };
};

function BrowserRange(range) {
    this.commonAncestorContainer = range.commonAncestorContainer;
    this.startContainer = range.startContainer;
    this.startOffset = range.startOffset;
    this.endContainer = range.endContainer;
    this.endOffset = range.endOffset;
}

BrowserRange.prototype.normalize = function (root) {
    var document = this.startContainer.ownerDocument;
    var range = document.createRange();
    range.setStart(this.startContainer, this.startOffset);
    range.setEnd(this.endContainer, this.endOffset);
    var normalized = normalizeDomRange(range);
    if (normalized && root) {
        return normalized.limit(root);
    }
    return normalized;
};

BrowserRange.prototype.serialize = function (root, ignoreSelector) {
    var normalized = this.normalize(root);
    return normalized && normalized.serialize(root, ignoreSelector);
};

function SerializedRange(range) {
    this.start = range.start;
    this.startOffset = range.startOffset;
    this.end = range.end;
    this.endOffset = range.endOffset;
}

SerializedRange.prototype.normalize = function (root) {
    try {
        var range = rangeFromSerialized(this, root);
        return normalizeDomRange(range);
    } catch (error) {
        throw new RangeError("normalize", error.message, error);
    }
};

SerializedRange.prototype.serialize = function (root, ignoreSelector) {
    var normalized = this.normalize(root);
    return normalized && normalized.serialize(root, ignoreSelector);
};

SerializedRange.prototype.toObject = function () {
    return {
        start: this.start,
        startOffset: this.startOffset,
        end: this.end,
        endOffset: this.endOffset
    };
};

function RangeError(type, message, parent) {
    Error.call(this, message);
    this.name = "RangeError";
    this.type = type;
    this.message = message;
    this.parent = parent || null;
}
RangeError.prototype = Object.create(Error.prototype);
RangeError.prototype.constructor = RangeError;

var Range = {
    RangeError: RangeError,
    BrowserRange: BrowserRange,
    NormalizedRange: NormalizedRange,
    SerializedRange: SerializedRange,
    sniff: function (range) {
        if (range && range.commonAncestorContainer) {
            return new BrowserRange(range);
        }
        if (range && typeof range.start === "string") {
            return new SerializedRange(range);
        }
        if (range && range.start && typeof range.start === "object") {
            return new NormalizedRange(range);
        }
        throw new RangeError("unknown", "Could not sniff range type");
    }
};

module.exports = {
    Range: Range,
    fromRange: xpathRange.fromRange,
    toRange: xpathRange.toRange,
    xpath: xpath
};
