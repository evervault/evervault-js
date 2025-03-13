import {
  Component,
  LegacyRef,
  MutableRefObject,
  PropsWithChildren,
  RefCallback,
} from "react";

// Taken from https://github.com/gregberge/react-merge-refs
export function mergeRefs<T = any>(
  ...refs: Array<MutableRefObject<T> | LegacyRef<T> | undefined | null>
): RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{ onError?(error: Error): void }>
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
