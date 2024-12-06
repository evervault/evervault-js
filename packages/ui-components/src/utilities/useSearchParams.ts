export function useSearchParams() {
  const { location } = window;
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries(searchParams.entries());
}
