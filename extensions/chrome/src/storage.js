function storageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (values) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(Array.isArray(values[key]) ? values[key] : []);
    });
  });
}

function storageSet(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function pageUri() {
  return globalThis.location.href;
}

function keyFor(uri, prefix) {
  return `${prefix}:${encodeURIComponent(uri)}`;
}

function newId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function chromeStorage(options = {}) {
  const prefix = options.prefix || "html-annotator";

  function read(uri) {
    return storageGet(keyFor(uri, prefix));
  }

  function write(uri, annotations) {
    return storageSet(keyFor(uri, prefix), annotations);
  }

  return {
    create(annotation) {
      const saved = {
        ...annotation,
        id: annotation.id ?? newId(),
        uri: annotation.uri || pageUri(),
      };

      return read(saved.uri).then((annotations) =>
        write(saved.uri, annotations.concat(saved)).then(() => saved),
      );
    },

    update(annotation) {
      const uri = annotation.uri || pageUri();
      const saved = { ...annotation, uri };

      return read(uri).then((annotations) => {
        const index = annotations.findIndex((item) => item.id === saved.id);
        if (index === -1) {
          annotations.push(saved);
        } else {
          annotations[index] = saved;
        }
        return write(uri, annotations).then(() => saved);
      });
    },

    delete(annotation) {
      const uri = annotation.uri || pageUri();

      return read(uri).then((annotations) => {
        const remaining = annotations.filter(
          (item) => item.id !== annotation.id,
        );
        return write(uri, remaining).then(() => annotation);
      });
    },

    query(query = {}) {
      const uri = query.uri || pageUri();
      return read(uri).then((results) => ({
        results,
        meta: { total: results.length },
      }));
    },

    configure(registry) {
      registry.registerUtility(this, "storage");
    },
  };
}
