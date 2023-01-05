const runBrowserJsPolyfills = () => {
  const { JSDOM } = require('jsdom');
  const { window } = new JSDOM();
  const { File, Blob } = require('web-file-polyfill');
  global.window = window;
  global.window.fetch = fetch;
  global.window.crypto = globalThis.crypto;
  global.window.crypto.subtle = globalThis.crypto.subtle;
  global.window.crypto.subtle.generateKey = globalThis.crypto.subtle.generateKey;
  global.document = window.document;
  global.File = File;
  global.Blob = Blob;

  class FileReaderPolyfill {
    constructor() {
      this.readAsArrayBuffer = (file) => {
        this.result = Buffer.from([0x00]);
        this.onloadend({});
      }
    }
  }

  global.FileReader = FileReaderPolyfill;
}

module.exports = {
  runBrowserJsPolyfills
}