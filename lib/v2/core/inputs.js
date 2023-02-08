/** @format */

const constructSource = require("../../utils/constructSource");
const calculateHeight = require("../../utils/calculateHeight");

module.exports = (config) => {
  return {
    generate: function (id, settings) {
      document.getElementById(id).innerHTML = `<iframe src="${constructSource(
        config,
        settings
      )}" id="ev-iframe" title="Payment details" frameborder="0" scrolling="0" height=${calculateHeight(
        settings
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
                if (event.origin !== config.input.inputsOrigin) return;
                fn(event.data);
              },
              false
            );
          }
        },
        setLabels: (labels) =>
          new Promise((res, rej) => {
            const channel = new MessageChannel();

            document
              .getElementById("ev-iframe")
              .contentWindow.postMessage(labels, "*", [channel.port2]);
          }),
      };
    },
  };
};
