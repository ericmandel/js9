
var zeeWorker = new Worker('zee-worker.js');

var zeeCallbacks = [];

zeeWorker.onmessage = function(msg) {
  zeeCallbacks[msg.data.callbackID](msg.data.data);
  console.log("zee'd " + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');
  zeeCallbacks[msg.data.callbackID] = null;
};

function requestZee(filename, data, callback) {
  zeeWorker.postMessage({
    filename: filename,
    data: new Uint8Array(data), // do not send over the underlying ArrayBuffer
    callbackID: zeeCallbacks.length
  });
  zeeCallbacks.push(callback);
}

