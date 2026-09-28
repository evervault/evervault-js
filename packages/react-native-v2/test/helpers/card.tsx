import { render } from "@testing-library/react-native";
import { PropsWithChildren, ReactNode } from "react";
import { vi } from "vitest";
import { EvervaultProvider } from "../../src/EvervaultProvider";
import { Card, CardProps } from "../../src/Card/Root";

export function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

export async function renderCard(children: ReactNode, props: CardProps = {}) {
  const onChange = vi.fn();
  const screen = await render(
    <Card onChange={onChange} {...props}>
      {children}
    </Card>,
    { wrapper }
  );

  return { onChange, ...screen };
}

export function lastPayload(onChange: ReturnType<typeof vi.fn>) {
  return onChange.mock.lastCall?.[0];
}
