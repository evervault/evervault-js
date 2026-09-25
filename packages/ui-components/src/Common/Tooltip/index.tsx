export function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="tooltip" ev-tooltip="">
      {children}
    </span>
  );
}
