import {useEffect, useLayoutEffect, useState } from "react";
import { resize } from "../utilities/resize";
import usStates from "../utilities/usStates";
import {useMessaging} from "../utilities/useMessaging";
import type {FormConfig, FormApiResponse, FormElement} from "./types";
import type {EvervaultFrameHostMessages, FormFrameClientMessages} from "types";

type InputRenderer = (name: string, type: string, required: boolean) => JSX.Element;
type TextareaRenderer = (name: string, required: boolean) => JSX.Element;
type FieldRenderer = InputRenderer | TextareaRenderer;

const SelectRenderer = ({ name, options }: { name: string, options: { value: string }[]}): JSX.Element => {
  const [selectedField, setSelectedField] = useState(options[0]?.value || "");

  return (
    <div className="field-container">
      <select name={name} value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
        {options.map((option, i) => (
          <option key={i} value={option.value}>{option.value}</option>
        ))}
      </select>
    </div>
  );
};


const fieldRenderers: Record<string, FieldRenderer> = {
  input: (name: string, type: string, required: boolean) => (
    <div key={name} className="field-container">
      <input type={type} name={name.toLocaleLowerCase()} id={name} placeholder={`${name} ${required ? "*" : "" }`} required={required}/>
    </div>
  ),
  textarea: (name: string, required: boolean) => (
    <div key={name} className="field-container">
      <textarea name={name.toLocaleLowerCase()} id={name} required={required} placeholder={`${name} ${required ? "*" : "" }`}></textarea>
    </div>
  )
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
        {formElements?.map((element, i) => {
          if (element.elementType === "input") {
            const renderField = fieldRenderers.input as InputRenderer;
            return renderField(element.elementName, element.type ? element.type : "text", element.required);
          }

          if (element.elementType === "textarea") {
            const renderField = fieldRenderers.textarea as TextareaRenderer;
            return renderField(element.elementName, element.required);
          }

          if (element.elementType === "select") {
            return <SelectRenderer name={`select-${i}`} key={element.elementName} options={element.options ?? []} />;
          }

          if (element.elementType === "select-states") {
            return <SelectRenderer name={`select-states-${i}`} key={element.elementName} options={usStates ?? []} />;
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
