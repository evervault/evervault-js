/** @format */

const EventEmitter = require('events');

module.exports = (evervault) => {
  const formEmitter = new EventEmitter();
  return {
    handleForm: async function(form) {
      let currentInput = undefined;
      const inputs = form.querySelectorAll('input');
      let formPayload = {};
      for (let i = 0; i < inputs.length; i++) {
        currentInput = inputs[i];
        let { id, name, value } = currentInput;
        if (id || name) {
            if (currentInput.hasAttribute('data-encrypt')) {
                const encryptedValue = await evervault.encrypt(value);
                form[id || name].value = encryptedValue;
                formPayload[id || name] = encryptedValue;
            } else {
                form[id || name].value = value;
                formPayload[id || name] = value;
            }
        }
      }
      return formPayload;
    },

    register: function() {
      const forms = document.querySelectorAll('[data-evervault-form]');

      let form = undefined;
      for (let i = 0; i < forms.length; i++) {
        form = forms[i];
        form.onsubmit = async (e) => {
          e.preventDefault();
          const processedPayload = await this.handleForm(form);
          this.events.emit('form-ready', processedPayload);
          if (form.getAttribute('data-evervault-form') === 'auto') {
            form.submit();
          } else {
            return false;
          }
        };
      }
    },

    events: formEmitter,
  };
};