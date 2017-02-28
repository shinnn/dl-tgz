'use strict';

const {createServer} = require('http');
const {createGzip} = require('zlib');

const dlTgz = require('.');
const {pack} = require('tar-stream');
const readUtf8File = require('read-utf8-file');
const rmfr = require('rmfr');
const test = require('tape');

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/x-tar');

  const tar = pack();
  tar.entry({name: 'dir/file.txt'}, 'Hi');
  tar.finalize();

  if (req.url === '/non-gzipped') {
    tar.pipe(res);
    return;
  }

  res.setHeader('content-encoding', 'gzip');
  tar.pipe(createGzip()).pipe(res);
}).listen(3018, () => test('dlTgz()', async t => {
  t.plan(11);

  await rmfr('tmp').catch(t.fail);

  dlTgz('http://localhost:3018/', 'tmp').subscribe({
    next({entry, response}) {
      t.strictEqual(entry.bytes, 2, 'should send download progress to the subscription.');

      t.strictEqual(
        entry.header.name,
        'file.txt',
        'should send entry headers to the subscription.'
      );

      t.ok(
        Number.isSafeInteger(response.bytes),
        'should send total donwload bytes to the subscription.'
      );

      t.strictEqual(
        response.headers['content-encoding'],
        'gzip',
        'should send response headers to the subscription.'
      );
    },
    async complete() {
      t.strictEqual(
        await readUtf8File('tmp/file.txt'),
        'Hi',
        'should download a tar.gz and extract it to the disk.'
      );
    }
  });

  dlTgz('http://localhost:3018/', 'tmp', {
    strip: 0,
    map(header) {
      header.name = `hello/${header.name}`;
      return header;
    }
  }).subscribe({
    async complete() {
      t.strictEqual(
        await readUtf8File('tmp/hello/dir/file.txt'),
        'Hi',
        'should support tar-fs options.'
      );
    }
  });

  const fail = t.fail.bind(t, 'Unexpectedly succeeded.');

  dlTgz('http://localhost:3018/non-gzipped', '__').subscribe({
    complete: fail,
    error: err => t.strictEqual(
      err.toString(),
      'Error: incorrect header check',
      'should fail when the downloaded content is not gzipped.'
    )
  });

  dlTgz(Math.sign, '__').subscribe({
    complete: fail,
    error: err => t.strictEqual(
      err.toString(),
      'TypeError: Expected a URL of tar archive, but got [Function: sign].',
      'should fail when the URL is not a string.'
    )
  });

  dlTgz('http://localhost:3018/', [0]).subscribe({
    complete: fail,
    error: err => t.strictEqual(
      err.toString(),
      'TypeError: Expected a path where downloaded tar archive will be extracted, but got [ 0 ].',
      'should fail when the destination path is not a string.'
    )
  });

  dlTgz('http://localhost:3018/', '__', {tarTransform: createGzip()}).subscribe({
    complete: fail,
    error: err => t.strictEqual(
      err.toString(),
      'TypeError: dl-tgz doesn\'t support `tarTransform` option.',
      'should fail when `tarTransform` option is a stream.'
    )
  });

  dlTgz('http://localhost:3018/', '__', new Set()).subscribe({
    complete: fail,
    error: err => t.strictEqual(
      err.toString(),
      'TypeError: Expected an object to specify `dl-tar` options, but got Set {}.',
      'should fail when the third parameter takes a non-plain object.'
    )
  });
}).on('end', () => server.close()));
