import { ReactNode } from "react";

export function Error({ children }: { children: ReactNode }) {
  return <div className="error">{children}</div>;
}
