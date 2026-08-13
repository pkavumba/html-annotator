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
2. [Custom Plugins](#2-writing-plugins)
3. [Development](#3-development)
4. [Chrome extension](#4-chrome-extension)
5. [Demo](#5-demo)
6. [License](#6-license)

## 1. Usage

### NPM

```
npm install html-annotator
```

### CDN

Currently html-annotator is not hosted on any CDN. You can download the prebuilt files from `pkg` file and include them in your html file as follows:

```
<script src="pkg/html.annotator.js"></script>
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

## 2. Writing plugins

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

Development uses Node.js 22.22.2 or newer.

Install the pinned dependency tree with:

```sh
npm ci
```

Run the test suite (288 tests) and lint checks with:

```sh
npm test
npm run lint
```

Build the distributable browser bundles with:

```sh
npm run build
```

Start the local development server at <http://localhost:4000>:

```sh
npm run serve
```

The complete local verification command is `npm run check`.

## 4. Chrome extension

The repository includes a modern Manifest V3 Chrome extension package in
`extensions/chrome`. Install the library dependencies first, then install and
build the extension package:

```sh
npm ci
npm run install:chrome
npm run build:chrome
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**,
and select `extensions/chrome`. Click the toolbar action on a webpage to enable
annotation. The extension stores annotations in `chrome.storage.local`, scoped
to each page URL.

The generated `extensions/chrome/dist` directory is intentionally ignored by
Git. Re-run `npm run build:chrome` after changing the extension or library.

## Reporting a bug

Please report bugs using the `GitHub issue tracker`. Please be sure to use the
search facility to see if anyone else has reported the same bug -- don't submit
duplicates.

Please endeavour to follow `good practice for reporting bugs` when you submit
an issue.

## 5. Demo

Open the `demo.html` file for a demo

## 6. License

MIT
