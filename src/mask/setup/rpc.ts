import { serializer } from '@masknet/shared-base';
import { AsyncCall, type EventBasedChannel } from 'async-call-rpc/full';

import { addListener, postMessage } from '@/mask/setup/message.js';

const channel: EventBasedChannel = {
    on(listener) {
        return addListener('rpc', (message) => listener(message));
    },
    send(data) {
        postMessage('rpc', data);
    },
};

export const BackgroundWorker = AsyncCall<typeof import('../background-worker/service.js')>(
    {},
    { channel, log: true, serializer },
);
