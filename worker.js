importScripts('base64.js');

onmessage = function(msg) {
    var base64 = uint8ToBase64(msg.data);
    postMessage(base64);
}