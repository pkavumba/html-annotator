# HTML-Annotator

HTML-Annotator is derived from [Annotator](http://annotatorjs.org/) which ended development in 2015. HTML-Annotator is a JavaScript library for annotating HTML pages. It provides a set of tools for annotating content in webpages.

Components within Annotator provide:

- user interface: components to create, edit, and display annotations in a
  browser.
- persistence: local and http storage components help you save your annotations.
- authorization and identity: integrate Annotator with your application's login
  and permissions systems.

# Table of Contents

1. [Usage](#1-usage)
2. [Custom Plugins](#2-plugins)
3. [Development](#3-development)
4. [LICENSE](#4-license)

## 1. Usage

```
npm install html-annotator
```

### Basic Usage

```
import annotator from "html-annotator";
const elem = document.getElementById("content");
const app = new annotator.App()
.include(annotator.ui.main, {element: elem})
app.start()
```

This will enable annotations but the annotations won't be persisted.

### Adding local storage persistence

Additional functionality is provided through plugins. Plugins are added using the `app.include()` method.

Local storage is supported through the inbuilt plugin localStore.

```
import annotator from "html-annotator";
const elem = document.getElementById("content");
const app = new annotator.App()
.include(annotator.ui.main, {element: elem})
.include(annotator.storage.localStore);
app.start().then(() => {
app.annotations.load({
uri: window.location.href //load saved annotations
});
});
```

### Add color picker for the highlighter

```
import annotator from "html-annotator";
const elem = document.getElementById("content");
const app = new annotator.App()
.include(annotator.ui.main, {
element: elem,
editorExtensions: [annotator.ui.colorPicker.editorExtension]
})
.include(annotator.storage.localStore);
app.start().then(() => {
app.annotations.load({
uri: window.location.href
});
});
```

## 2. Writing a plugins

A plugin is a JS Object that implements certain callback methods.

Here is a simple plugin that prints debug info when the app starts and gets destroyed

```
function helloWord(){
   return {
      start(app){
         console.debug('app started');
      },
      destroy(){
         console.debug('app destroyed');
      }
   }
}
```

This is a list of module hooks, when they are called, and what arguments they receive.

- `annotationsLoaded(annotations)`
  Called when annotations are retrieved from storage using `load()`.
- `beforeAnnotationCreated(annotation)`
  Called immediately before an annotation is created. Modules may use this hook to modify the annotation before it is saved.
- `annotationCreated(annotation)`
  Called when a new annotation is created.
- `beforeAnnotationUpdated(annotation)`
  Called immediately before an annotation is updated. Modules may use this hook to modify the annotation before it is saved.
- `annotationUpdated(annotation)`
  Called when an annotation is updated.
- `beforeAnnotationDeleted(annotation)`
  Called immediately before an annotation is deleted. Use if you need to conditionally cancel deletion, for example.
- `annotationDeleted(annotation)`
  Called when an annotation is deleted.

## 3. Development

```

npm install

```

### Compiles and hot-reloads for development

```

npm run serve

```

## Reporting a bug

Please report bugs using the `GitHub issue tracker`. Please be sure to use the
search facility to see if anyone else has reported the same bug -- don't submit
duplicates.

Please endeavour to follow `good practice for reporting bugs` when you submit
an issue.

## 4. LiCENSE

MIT
