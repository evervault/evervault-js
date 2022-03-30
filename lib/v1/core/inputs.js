/** @format */

module.exports = (config) => {
  return {
    generate: function (id) {
      document.getElementById(
        id
      ).innerHTML = `<iframe src="${config.input.inputsUrl}/?team=${config.teamId}" id="ev-iframe" title="iframe" frameborder="0" scrolling="0"></iframe>`;

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
