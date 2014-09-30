
zee.js
======

zee.js is a port of zlib, a very useful compression library (used in gzip)
to JavaScript, by compiling the zlib C code with Emscripten.

zee.js is zlib licensed, just like zlib.


Usage
-----

Zee.compress and Zee.decompress are the relevant functions. See test.js
for an example.

There is also a worker version, zee-worker.js. See zee-client.js for
usage.
