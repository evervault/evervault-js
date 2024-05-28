import {useEffect, useState} from "react";
import {useMessaging} from "../utilities/useMessaging";
import type {FormConfig, FormApiResponse, FormElement} from "./types";
import type {EvervaultFrameHostMessages, FormFrameClientMessages} from "types";

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
  const messages = useMessaging<
    EvervaultFrameHostMessages,
    FormFrameClientMessages
  >();

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formJson: { [key: string]: string } = {};

    formData.forEach((value, key) => {
      formJson[key] = value as string;
    });

    try {
      const response = await fetch(config.formSubmissionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formJson)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      await response.json();
      messages.send("EV_SUBMITTED")
    } catch (error) {
      messages.send("EV_ERROR");
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <form id={config.formUuid} onSubmit={handleSubmit}>
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