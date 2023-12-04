export function useSearchParams() {
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  return Object.fromEntries(searchParams.entries());
}
