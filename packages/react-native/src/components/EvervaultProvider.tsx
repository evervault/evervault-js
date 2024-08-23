import { ReactNode, useEffect } from 'react';
import { init } from '../sdk';

interface EvervaultProps {
  appUuid: string;
  teamUuid: string;
  children: ReactNode;
}

const EvervaultProvider = ({ teamUuid, appUuid, children }: EvervaultProps) => {
  useEffect(() => {
    async function initEvervault() {
      try {
        await init(teamUuid, appUuid);
      } catch (error) {
        throw new Error(`Failed to initialize the Evervault SDK ${error}`);
      }
    }

    if (!teamUuid || !appUuid) {
      throw new Error(
        'Evervault Error: teamUuid and appUuid are required to initialise the Evervault SDK'
      );
    }

    initEvervault();
  }, [teamUuid, appUuid]);

  return children;
};

export default EvervaultProvider;
