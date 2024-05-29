import {useEffect, useLayoutEffect, useState} from "react";
import { resize } from "../utilities/resize";
import {useMessaging} from "../utilities/useMessaging";
import type {FormConfig, FormApiResponse, FormElement} from "./types";
import type {EvervaultFrameHostMessages, FormFrameClientMessages} from "types";

type InputRenderer = (name: string, type: string, required: boolean) => JSX.Element;
type TextareaRenderer = (name: string, required: boolean) => JSX.Element;
type SelectRenderer = (name: string, options: { value: string }[]) => JSX.Element;
type FieldRenderer = InputRenderer | TextareaRenderer | SelectRenderer;

const fieldRenderers: Record<string, FieldRenderer> = {
  input: (name: string, type: string, required: boolean) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <input type={type} name={name} id={name} required={required}/>
    </div>
  ),
  textarea: (name: string, required: boolean) => (
    <div key={name}>
      <label htmlFor={name}>{name}</label>
      <textarea name={name} id={name} required={required}></textarea>
    </div>
  ),
  select: (name: string, options: { value: string }[]) => (
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

export function Form({config}: { config: FormConfig }): JSX.Element {
  const [formElements, setFormElements] = useState<FormElement[]>([]);

  const messages = useMessaging<
    EvervaultFrameHostMessages,
    FormFrameClientMessages
  >();

  useLayoutEffect(resize);

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
    const formJson: Record<string, string> = {};

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
      // eslint-disable-next-line
      await response.json();
      messages.send("EV_SUBMITTED")
    } catch (error) {
      messages.send("EV_ERROR");
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <form id={config.formUuid} onSubmit={(event) => { void handleSubmit(event); }}>
        {formElements?.map((element) => {
          if (element.elementType === "input") {
            const renderField = fieldRenderers.input as InputRenderer;
            return renderField(element.elementName, element.type ? element.type : "text", element.required);
          }

          if (element.elementType === "textarea") {
            const renderField = fieldRenderers.textarea as TextareaRenderer;
            return renderField(element.elementName, element.required);
          }

          if (element.elementType === "select") {
            const renderField = fieldRenderers.select as SelectRenderer;
            return renderField(element.elementName, element.options ?? []);
          }

          return null
        })}
        <div className={"button-container"}>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}
