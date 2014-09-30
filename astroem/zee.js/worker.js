
onmessage = function(msg) {
  var start = Date.now();
  var data = Zee.decompress(new Uint8Array(msg.data.data));
  postMessage({
    filename: msg.data.filename,
    data: data,
    callbackID: msg.data.callbackID,
    time: Date.now() - start
  });
};

