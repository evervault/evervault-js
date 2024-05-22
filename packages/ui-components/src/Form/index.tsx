import {useEffect, useState} from "react";
import type {FormConfig, FormApiResponse, FormElement} from "./types";

type FieldRenderer = (name: string, options?: { value: string; label: string }[]) => JSX.Element;

const fieldRenderers: Record<string, FieldRenderer> = {
  input: (name: string) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <input type="text" name={name} id={name} />
    </div>
  ),
  textarea: (name: string) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <textarea name={name} id={name}></textarea>
    </div>
  ),
  select: (name: string, options?: { value: string; label: string }[]) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <select name={name} id={name}>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  ),
};


export function Form({config}: { config: FormConfig }) {
  const [formElements, setFormElements] = useState<FormElement[]>([]);

  useEffect(() => {
    async function makeRequest() {
      try {
        // const response = await fetch("https://api.evervault.com/forms", {
        //   headers: {
        //     'X-EVERVAULT-APP-ID': 'app_f4877d5d1d6a'
        //   }
        // });
        // console.log("response", response.status);
        const response: FormApiResponse = {
          "id": 14,
          "uuid": "form_1af0d91c566c",
          "appUuid": "app_f4877d5d1d6a",
          "elements": [
            {
              "elementName": "firstname",
              "elementType": "input"
            },
            {
              "elementName": "lastname",
              "elementType": "input"
            },
            {
              "elementName": "message",
              "elementType": "textarea"
            },
            {
              "elementName": "category",
              "elementType": "select",
              "options": [
                { "value": "option1", "label": "Option 1" },
                { "value": "option2", "label": "Option 2" },
                { "value": "option3", "label": "Option 3" }
              ]
            }
          ],
          "createdAt": "2024-04-18T16:07:59.411Z",
          "updatedAt": "2024-04-30T15:00:19.766Z",
          "deletedAt": null
        };

        setFormElements(response.elements);
      } catch (e) {
        console.error(e);
      }
    }
    void makeRequest();
  }, []);

  return (
    <div>
      <form id={config.formUuid} action={config.formSubmissionUrl}>
        {formElements.map((element) => {
          const renderField = fieldRenderers[element.elementType];
          return renderField ? renderField(element.elementName, element.options) : null;
        })}
        <div className={"button-container"}>
          <button type={"submit"}>Submit</button>
        </div>
      </form>
    </div>
  );
}