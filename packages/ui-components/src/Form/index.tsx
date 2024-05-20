import type { FormConfig } from "./types";
import {useEffect, useState} from "react";
import {useMessaging} from "../utilities/useMessaging";

export function Form({ config }: { config: FormConfig }) {
  const [data, setData] = useState<JSON | null>(null);

    useEffect(() => {
        async function makeRequest() {
            try {
                const response = await fetch("https://api.evervault.com/forms", {
                    headers: {
                        'X-EVERVAULT-APP-ID': 'app_f4877d5d1d6a'
                    }
                });
                console.log("response", response.status);
            } catch (e) {
                console.error(e);
            }
        }

        void makeRequest()
    }, ["http://localhost:3000/health"]);
  return (
      <div>
        <p>Rendering the Form</p>
      </div>
  )
}