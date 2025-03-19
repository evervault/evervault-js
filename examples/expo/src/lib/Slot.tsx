import {
  cloneElement,
  isValidElement,
  PropsWithChildren,
  ReactNode,
} from "react";
import { ViewProps } from "react-native";

export type SlotProps<P> = PropsWithChildren<P>;

export function Slot<P = ViewProps>({
  children,
  ...props
}: SlotProps<P>): ReactNode {
  if (!isValidElement(children)) {
    return children;
  } else {
    return cloneElement(children, props);
  }
}
