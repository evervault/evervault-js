import type { FormConfig } from "./types";

export function Form({ config }: { config: FormConfig }) {
  console.log(config);
  return (
      <div>
        <p>Rendering the Form</p>
      </div>
  )
}