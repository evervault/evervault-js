import { ReactNode } from "react";

export function Overlay({
  enabled,
  children,
  onCancel,
}: {
  enabled: boolean;
  children: ReactNode;
  onCancel: () => void;
}) {
  if (!enabled) return children;

  return (
    <div ev-overlay="" className="overlay">
      <div className="overlayWindow">
        <button className="overlayClose" onClick={onCancel}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M18 6L6 18M6 6l12 12"
            />
          </svg>
          Cancel
        </button>
        {children}
      </div>
    </div>
  );
}
