ESBUILD := node_modules/.bin/esbuild
TERSER := node_modules/.bin/terser

# Check that the user has run 'npm install'
ifeq ($(shell which $(ESBUILD) >/dev/null 2>&1; echo $$?), 1)
$(error The 'esbuild' command was not found. Please ensure you have run 'npm install' before running make.)
endif

SRC := $(shell find src -type f -name '*.js')

all: annotator
annotator: pkg/html.annotator.min.js

pkg/%.min.js: pkg/%.js
	@echo Writing $@
	@{ tools/preamble; $(TERSER) $<; } >$@

pkg/html.annotator.js: browser.js $(SRC)
	@echo Writing $@
	@mkdir -p pkg/ .deps/
	@$(ESBUILD) $< --bundle --platform=browser --format=iife --global-name=annotator --loader:.css=text --outfile=$@
	@printf '%s: %s\n' '$@' '$<' >.deps/annotator.d

clean:
	rm -rf .deps pkg

test:
	npm test

develop:
	npm run serve

#doc:
#	cd doc && $(MAKE) html

#apidoc: $(patsubst src/%.js,doc/api/%.rst,$(SRC))

#doc/api/%.rst: src/%.js
#	@mkdir -p $(@D)
#	tools/apidoc $< $@

-include .deps/*.d

.PHONY: all annotator clean test develop doc
