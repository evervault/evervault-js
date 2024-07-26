import EventManager from './eventManager';
import { EvervaultFrame } from './evervaultFrame';
import type EvervaultClient from '../main';
import type {
    ThreeDSFrameClientMessages,
    ThreeDSFrameHostMessages,
    ThreeDSOptions,
    SelectorType,
} from 'types';

interface ThreeDSEvents {
    ready: () => void;
    error: () => void;
    change: (payload: any) => void;
    complete: (payload: any) => void;
};

export default class ThreeDS {
    #options: ThreeDSOptions;
    #frame: EvervaultFrame<ThreeDSFrameClientMessages, ThreeDSFrameHostMessages>;
    
    #events = new EventManager<ThreeDSEvents>();

    constructor(client: EvervaultClient, options?: ThreeDSOptions) {
        this.#options = options ?? {};
        this.#frame = new EvervaultFrame(client, 'ThreeDS');

        this.#frame.on('EV_CHANGE', (payload) => {
            this.#events.dispatch('change', payload);
        });

        this.#frame.on('EV_COMPLETE', (payload) => {
            this.#events.dispatch('complete', payload);
        });

        this.#frame.on('EV_FRAME_READY', () => {
            this.#events.dispatch('ready');
        });
    }

    // TODO: Implement theme handling if required??
    get config() {
        return {
            //theme: this.#options.theme,
            config: {
                //autoFocus: this.#options.autoFocus,
                //translations: this.#options.translations,
                //hiddenFields: (this.#options.hiddenFields ?? [])?.join(','),
                //fields: this.#options.fields,
                //acceptedBrands: this.#options.acceptedBrands,
            },
        };
    }

    mount(selector: SelectorType) {
        this.#frame.mount(selector, {
            ...this.config,
            onError: () => {
                this.#events.dispatch('error');
            },
        });

        return this;
    }

    unmount() {
        this.#frame.unmount();
        return this;
    }

    on<T extends keyof ThreeDSEvents>(event: T, callback: ThreeDSEvents[T]) {
        return this.#events.on(event, callback);
    }
}