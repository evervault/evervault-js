/** @format */

module.exports = () => {

  return {
    generate: function (config, id) {
      document.getElementById(id).innerHTML = `<iframe src="${config.input.inputsUrl}" id="ev-iframe" title="iframe" frameborder="0" scrolling="0"></iframe>`;

      return {
        getData: () => new Promise((res, rej) => {
          const channel = new MessageChannel();

          channel.port1.onmessage = ({ data }) => {
            channel.port1.close();
            (async () => {
              return res(data);
            })();
          };

          document.getElementById("ev-iframe").contentWindow.postMessage("message", "*", [channel.port2]);
        }),
        on: (event, fn) => {
          if (event === 'change') {
            window.addEventListener("message", (event) => {
              if (event.origin !== config.input.inputsUrl)
                return;

              (async () => {
                fn(event.data);
              })();
            }, false);
          }
        }
      };
    },
  };
};
