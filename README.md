# dl-tgz

[![npm version](https://img.shields.io/npm/v/dl-tgz.svg)](https://www.npmjs.com/package/dl-tgz)
[![Build Status](https://travis-ci.com/shinnn/dl-tgz.svg?branch=master)](https://travis-ci.com/shinnn/dl-tgz)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/dl-tgz.svg)](https://coveralls.io/github/shinnn/dl-tgz?branch=master)

A [Node.js](https://nodejs.org/) module to download and extract a [gzipped](https://tools.ietf.org/html/rfc1952) [tar](https://www.gnu.org/software/tar/) archive with the [Observable](https://tc39.github.io/proposal-observable/) API

```javascript
const {readdirSync} = require('fs');
const dlTgz = require('dl-tgz');

const url = 'https://****.org/my-archive.tar';
/* my-archive
   ├── LICENSE
   ├── README.md
   ├── INSTALL
   └── bin
       └── app.exe
*/

dlTgz(url, 'my/dir').subscribe({
  next({entry}) {
    if (entry.bytes !== entry.header.size) {
      return;
    }

    console.log(`✓ ${entry.header.name}`);
  },
  complete() {
    readdirSync('my/dir'); //=> ['INSTALL', LICENSE', 'README.md', 'bin']

    console.log('\nCompleted.')
  }
});
```

```
✓ bin/
✓ bin/app.exe
✓ README.md
✓ LICENSE
✓ install

Completed.
```

## Installation

[Use](https://docs.npmjs.com/cli/install) [npm](https://docs.npmjs.com/about-npm/).

```
npm install dl-tgz
```

## API

```javascript
const dlTgz = require('dl-tgz');
```

### dlTgz(*tarArchiveUrl*, *extractDir* [, *options*])

*tarArchiveUrl*: `string`  
*extractDir*: `string` (a path where the archive will be extracted)  
*options*: `Object`  
Return: [`Observable`](https://tc39.github.io/proposal-observable/#observable) ([zenparsing's implementation](https://github.com/zenparsing/zen-observable))

When the `Observable` is [subscribe](https://tc39.github.io/proposal-observable/#observable-prototype-subscribe)d, it starts to download a tgz archive, extract it and successively send extraction progress to its [`Observer`](https://github.com/tc39/proposal-observable#observer).

When the [`Subscription`](https://tc39.github.io/proposal-observable/#subscription-objects) is [unsubscribe](https://tc39.github.io/proposal-observable/#subscription-prototype-unsubscribe)d, it stops downloading and extracting.

#### Progress

Every progress object have two properties `entry` and `response`.

##### entry

Type: `Object {bytes: <number>, header: <Object>}`

`entry.header` is [a header of the entry](https://github.com/mafintosh/tar-stream#headers), and `entry.bytes` is the total size of currently extracted entry. `bytes` is always `0` if the entry is not a file but directory, link or symlink.

For example you can get the progress of each entry as a percentage by `(progress.entry.bytes / progress.entry.header.size || 0) * 100`.

```javascript
dlTgz('https://****.org/my-archive.tgz', 'my/dir')
.filter(progress => progress.entry.header.type === 'file')
.subscribe(progress => {
  console.log(`${(progress.entry.bytes / progress.entry.header.size * 100).toFixed(1)} %`);

  if (progress.entry.bytes === progress.entry.header.size) {
    console.log(`>> OK ${progress.entry.header.name}`);
  }
});
```

```
0.0 %
0.1 %
0.3 %
0.4 %
︙
99.6 %
99.8 %
99.9 %
100.0 %
>> OK bin/app.exe
0.0 %
0.1 %
0.2 %
0.3 %
︙
```

##### response

Type: `Object {bytes: <number>, headers: <Object>, url: <string>}`

`response.url` is the final redirected URL of the request, `response.headers` is a [response header object](https://nodejs.org/api/http.html#http_message_headers) derived from [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage), and `response.bytes` is a total content length of the downloaded archive. `content-length` header will be converted to `number` if it is `string`.

#### Options

You can pass options to [Request](https://github.com/request/request#requestoptions-callback) and [tar-fs](https://github.com/mafintosh/tar-fs)'s [`extract` method](https://github.com/mafintosh/tar-fs/blob/12968d9f650b07b418d348897cd922e2b27ec18c/index.js#L167). Note that:

* [`ignore` option](https://github.com/mafintosh/tar-fs/blob/b79d82a79c5e21f6187462d7daaba1fc03cdd1de/index.js#L236) is applied before [`map` option](https://github.com/mafintosh/tar-fs/blob/b79d82a79c5e21f6187462d7daaba1fc03cdd1de/index.js#L232) modifies filenames.
* [`strip` option](https://github.com/mafintosh/tar-fs/blob/12968d9f650b07b418d348897cd922e2b27ec18c/index.js#L47) defaults to `1`, not `0`. That means the top level directory is stripped off by default.
* [`fs`](https://github.com/mafintosh/tar-fs/blob/e59deed830fded0e4e5beb016d2df9c7054bb544/index.js#L65) option defaults to [graceful-fs](https://github.com/isaacs/node-graceful-fs) for more stability.

## License

[ISC License](./LICENSE) © 2017 - 2018 Shinnosuke Watanabe
