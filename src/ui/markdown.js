/*package annotator.ui.markdown */
"use strict";

var util = require('../util');
var MarkdownIt = require('markdown-it');

var _t = util.gettext;
var defaultMarkdown = new MarkdownIt({
    html: false,
    linkify: true
});

function getRenderer() {
    if (typeof global.showdown !== 'undefined') {
        if (global.showdown && typeof global.showdown.Converter === 'function') {
            var converter = new global.showdown.Converter();
            return converter.makeHtml.bind(converter);
        }
        return null;
    }

    if (typeof global.markdownit !== 'undefined') {
        if (!global.markdownit) {
            return null;
        }
        var parser = typeof global.markdownit === 'function' ?
            global.markdownit() : global.markdownit;
        return parser.render.bind(parser);
    }

    return defaultMarkdown.render.bind(defaultMarkdown);
}


/**
 * function:: render(annotation)
 *
 * Render an annotation to HTML, converting annotation text from Markdown.
 * Applications may provide a global Showdown or markdown-it instance to
 * customize the parser; markdown-it is used by default.
 *
 * :returns: Rendered HTML.
 * :rtype: String
 */
var render = exports.render = function render(annotation) {
    var convert = util.escapeHtml;
    var renderer = getRenderer();

    if (renderer) {
        convert = renderer;
    }

    if (annotation.text) {
        return convert(annotation.text);
    } else {
        return "<i>" + _t('No comment') + "</i>";
    }
};


/**
 * function:: viewerExtension(viewer)
 *
 * An extension for the :class:`~annotator.ui.viewer.Viewer`. Allows the viewer
 * to interpret annotation text as `Markdown`_ and uses the `Showdown`_ library
 * if present in the page to render annotations with Markdown text as HTML.
 *
 * .. _Markdown: https://daringfireball.net/projects/markdown/
 * .. _markdown-it: https://github.com/markdown-it/markdown-it
 *
 * **Usage**::
 *
 *     app.include(annotator.ui.main, {
 *         viewerExtensions: [annotator.ui.markdown.viewerExtension]
 *     });
 */
exports.viewerExtension = function viewerExtension(viewer) {
    if (!getRenderer()) {
        console.warn(_t("To use the Markdown plugin, you must " +
            "include a Markdown parser into the page first."));
    }

    viewer.setRenderer(render);
};
