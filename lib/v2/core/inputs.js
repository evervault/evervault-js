/** @format */

const constructSource = require("../../utils/constructSource");
const calculateHeight = require("../../utils/calculateHeight");

module.exports = (config) => {
  return {
    generate: function (id, theme, styles) {
      document.getElementById(id).innerHTML = `<iframe src="${constructSource(
        config,
        theme,
        styles
      )}" id="ev-iframe" title="Payment details" frameborder="0" scrolling="0" height=${calculateHeight(
        theme,
        styles
      )}></iframe>`;

      return {
        getData: () =>
          new Promise((res, rej) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = ({ data }) => {
              channel.port1.close();
              return res(data);
            };

            document
              .getElementById("ev-iframe")
              .contentWindow.postMessage("message", "*", [channel.port2]);
          }),
        on: (event, fn) => {
          if (event === "change") {
            window.addEventListener(
              "message",
              (event) => {
                if (event.origin !== config.input.inputsUrl) return;
                fn(event.data);
              },
              false
            );
          }
        },
      };
    },
  };
};