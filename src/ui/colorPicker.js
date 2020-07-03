/*package annotator.ui.tags */
"use strict";

var util = require('../util');

var $ = util.$;
var _t = util.gettext;


/**
 * function:: editorExtension(editor)
 *
 * An extension for the :class:`~annotator.ui.editor.Editor` that allows
 * editing a set of space-delimited tags, retrieved from and saved to the
 * annotation's ``tags`` property.
 *
 * **Usage**::
 *
 *     app.include(annotator.ui.main, {
 *         viewerExtensions: [annotator.ui.tags.viewerExtension]
 *     })
 */
exports.editorExtension = function editorExtension(e) {
    // The input element added to the Annotator.Editor wrapped in jQuery.
    // Cached to save having to recreate it everytime the editor is displayed.
    var field = null;
    var input = null;

    function updateField(field, annotation) {
        var value = '';
        if (annotation.cssClass) {
            value = annotation.cssClass;
        }
        /*$.each(input, function (index, elem) {
            elem.checked = false;
            if (elem.id === value) {
                elem.checked = true;
            }
        });*/
    }

    function setAnnotationColor(field, annotation) {
        $.each(input, function (index, elem) {
            if (elem.checked) {
                annotation.cssClass = elem.value;
            }
        });
    }

    field = e.addField({
        type: 'radio',
        label: _t('hello'),
        load: updateField,
        submit: setAnnotationColor
    });

    input = $(field).find(':radio');
};