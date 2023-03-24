import { EventEmitter } from "events";

function Forms(evervault) {
  const formEmitter = new EventEmitter();
  return {
    handleForm: async function (form) {
      let currentInput = undefined;
      const inputs = form.querySelectorAll("input");
      let formPayload = {};
      for (let i = 0; i < inputs.length; i++) {
        currentInput = inputs[i];
        let { id, name, value } = currentInput;
        if (id || name) {
          if (currentInput.hasAttribute("data-encrypt")) {
            const encryptedValue = await evervault.encrypt(value);

            let input = document.createElement("input");
            input.type = "hidden";
            input.value = encryptedValue;
            input.setAttribute("data-evervault-created", "yes");

            if (id) {
              input.id = id.replace("ev-hidden-", "");
            }
            if (name) {
              input.name = name.replace("ev-hidden-", "");
            }
            form.appendChild(input);

            if (currentInput.id && currentInput.id.startsWith("ev-hidden-")) {
              currentInput.id = `ev-hidden-${id}`;
            }
            currentInput.name = "";

            form[id || name].value = encryptedValue;
            formPayload[
              id ? id.replace("ev-hidden-", "") : name.replace("ev-hidden-", "")
            ] = encryptedValue;
          } else {
            form[id || name].value = value;
            formPayload[id || name] = value;
          }
        }
      }
      return formPayload;
    },

    register: function () {
      const forms = document.querySelectorAll("[data-evervault-form]");

      let form = undefined;
      for (let i = 0; i < forms.length; i++) {
        form = forms[i];
        let prevOnSubmit = form.onsubmit;
        form.onsubmit = async (e) => {
          e.preventDefault();
          const processedPayload = await this.handleForm(form);
          this.events.emit("form-ready", processedPayload);
          if (form.getAttribute("data-evervault-form") === "auto") {
            prevOnSubmit ? prevOnSubmit() : form.submit();
          } else {
            return false;
          }
        };
      }
    },

    events: formEmitter,
  };
}

export default Forms;
