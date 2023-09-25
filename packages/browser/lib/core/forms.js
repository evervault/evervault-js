/* eslint-disable */
import { EventEmitter } from "events";

/**
 * @deprecated Forms is no longer a supported Evervault product and this feature will be removed in a future version
 * @param {Evervault} evervault
 * */
function Forms(evervault) {
  const formEmitter = new EventEmitter();
  return {
    async handleForm(form) {
      let currentInput;
      const inputs = form.querySelectorAll("input");
      const formPayload = {};
      for (let i = 0; i < inputs.length; i++) {
        currentInput = inputs[i];
        const { id, name, value } = currentInput;
        if (id || name) {
          if (currentInput.hasAttribute("data-encrypt")) {
            const encryptedValue = await evervault.encrypt(value);

            const input = document.createElement("input");
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

            if (currentInput.id?.startsWith("ev-hidden-")) {
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

    register() {
      const forms = document.querySelectorAll("[data-evervault-form]");

      let form;

      if (forms.length != 0) {
        // Dear lord, there actually using forms
        // This should not fire at all, but if it does, Customers should be advised to uses Inputs, Relay or the SDK encrypt function
        // This notice is put in by Ciaran.
        console.error(
          "Evervault Forms is no longer a supported Evervault product. This feature is not to beused in production code and will be removed in a future version. Please contact Evervault support if you see this message."
        );
      }

      for (let i = 0; i < forms.length; i++) {
        form = forms[i];
        const prevOnSubmit = form.onsubmit;
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
