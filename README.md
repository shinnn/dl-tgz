# dl-tgz

[![NPM version](https://img.shields.io/npm/v/dl-tgz.svg)](https://www.npmjs.com/package/dl-tgz)
[![Build Status](https://travis-ci.org/shinnn/dl-tgz.svg?branch=master)](https://travis-ci.org/shinnn/dl-tgz)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/dl-tgz.svg)](https://coveralls.io/github/shinnn/dl-tgz?branch=master)

A [Node.js](https://nodejs.org/) module to download and extract a [gzipped](https://tools.ietf.org/html/rfc1952) [tar](https://www.gnu.org/software/tar/) (`tar.gz`) archive with the [Observable](https://tc39.github.io/proposal-observable/) API

```javascript
const {readdirSync} = require('fs');
const dlTar = require('dl-tgz');

const url = 'https://github.com/github/hub/releases/download/v2.2.9/hub-darwin-amd64-2.2.9.tgz';

dlTar(url, 'my/dir').subscribe({
  next({header, bytes}) {
    if (bytes !== header.size) {
      return;
    }

    console.log(`✓ ${header.name}`);
  },
  complete() {
    readdirSync('my/dir'); //=> [ 'LICENSE', 'README.md', 'bin', 'etc', ...]

    console.log('\nCompleted.')
  }
});
```

```
✓ bin/hub
✓ README.md
✓ LICENSE
✓ etc/README.md
✓ etc/hub.bash_completion.sh
✓ etc/hub.zsh_completion
✓ share/man/man1/hub.1
✓ install

Completed.
```

## Installation

[Use npm.](https://docs.npmjs.com/cli/install)

```
npm install dl-tgz
```

## API

```javascript
const dlTar = require('dl-tgz');
```

### dlTar(*tgzArchiveUrl*, *extractDir* [, *options*])

*tgzArchiveUrl*: `String`  
*extractDir*: `String` (a path where the archive will be extracted)  
*options*: `Object`  
Return: [`Observable`](https://github.com/tc39/proposal-observable#observable) ([zenparsing's implementation](https://github.com/zenparsing/zen-observable))

It works just like [dl-tar](https://github.com/shinnn/dl-tar), except that [`tarTransform` option](https://github.com/shinnn/dl-tar#tartransform) defaults to a [`zlib.Gunzip`](https://nodejs.org/api/zlib.html#zlib_class_zlib_gunzip) stream and unchangeable.

## License

Copyright (c) 2017 [Shinnosuke Watanabe](https://github.com/shinnn)

Licensed under [the MIT License](./LICENSE).
