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
  select: (name: string, options?: { value: string }[]) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <select name={name} id={name}>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>{option.value}</option>
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forms/${config.formUuid}`);
        const {targetElements}: FormApiResponse = await response.json() as FormApiResponse;
        setFormElements(targetElements);
      } catch (e) {
        console.error(e);
      }
    }
    void makeRequest();
  }, [config.formUuid]);

  return (
    <div>
      <form id={config.formUuid} action={config.formSubmissionUrl}>
        {formElements?.map((element) => {
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