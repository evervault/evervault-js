import { UIComponent } from "./UIComponent";
import EncryptionProvider from "./EncryptionProvider";

export default function App() {
  return (
    <EncryptionProvider>
      <UIComponent />
    </EncryptionProvider>
  );
}
