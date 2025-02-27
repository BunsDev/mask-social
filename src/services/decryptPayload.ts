import type { AESCryptoKey } from '@masknet/base';
import {
    decrypt as lib_decrypt,
    DecryptError,
    DecryptErrorReasons,
    DecryptProgressKind,
    parsePayload,
    type PayloadParseResult,
    TwitterDecoder,
} from '@masknet/encryption';
import { decodeArrayBuffer, encodeArrayBuffer } from '@masknet/kit';
import type { TypedMessage } from '@masknet/typed-message';

import type { EncryptedPayload } from '@/helpers/getEncryptedPayload.js';

const cache = new Map<string, AESCryptoKey>();

async function parsePayloadText(encoded: string) {
    let payload = TwitterDecoder(
        'https://mask.io/?PostData_v1=' +
            encodeURI(encoded).replaceAll(/@$/g, '%40').replaceAll('%2F', '/').replaceAll('%3D', '='),
    ).unwrapOr('');
    if (typeof payload === 'string') {
        payload = payload.replaceAll('%20', '+');
    }
    return (await parsePayload(payload)).unwrapOr(null);
}

function toUint8Array(data: Record<number, number> | Uint8Array) {
    if (data instanceof Uint8Array) return data;
    const hasLength = 'length' in data;
    const length = Object.keys(data).length;
    const size = hasLength ? length - 1 : length;
    const u8 = new Uint8Array(hasLength ? length - 1 : length);
    u8.set({
        ...data,
        length: size,
    });

    return u8;
}

async function parsePayloadBinary(encoded: string | Uint8Array) {
    const buffer =
        typeof encoded === 'string'
            ? new Uint8Array(decodeArrayBuffer(decodeURIComponent(encoded)))
            : toUint8Array(encoded);
    return (await parsePayload(buffer)).unwrapOr(null);
}

async function decrypt(cacheKey: string, payload: PayloadParseResult.Payload): Promise<TypedMessage | DecryptError> {
    const decryptProgress = lib_decrypt(
        { message: payload },
        {
            async getPostKeyCache() {
                return cache.get(cacheKey) ?? null;
            },
            async setPostKeyCache(key) {
                cache.set(cacheKey, key);
            },
            async hasLocalKeyOf() {
                return false;
            },
            async decryptByLocalKey() {
                throw new Error('not implemented.');
            },
            async queryAuthorPublicKey() {
                return null;
            },
            async queryPostKey_version40() {
                return null;
            },
            async *queryPostKey_version39() {
                throw new Error('not implemented.');
            },
            async *queryPostKey_version38() {
                throw new Error('not implemented.');
            },
            async *queryPostKey_version37() {
                throw new Error('not implemented.');
            },
            async deriveAESKey() {
                throw new Error('not implemented.');
            },
        },
    );
    for await (const progress of decryptProgress) {
        if (progress.type === DecryptProgressKind.Success) return progress.content;
        if (progress.type === DecryptProgressKind.Error) return progress;
    }
    throw new TypeError('unreachable');
}

export type DecryptResult = [DecryptError | null, boolean, TypedMessage | null];

export async function decryptPayload([data, version]: EncryptedPayload): Promise<DecryptResult> {
    const getResult = async () => {
        if (version !== '1' && version !== '2') return false;

        const payload =
            version === '1' && typeof data === 'string' ? await parsePayloadText(data) : await parsePayloadBinary(data);
        if (!payload) return false;

        if (payload.encryption.isOk() && payload.encryption.value.type === 'E2E')
            return new DecryptError(DecryptErrorReasons.PrivateKeyNotFound, undefined);

        return decrypt(typeof data === 'string' ? data : encodeArrayBuffer(data), payload);
    };

    const result = await getResult();

    if (typeof result === 'boolean')
        return [new DecryptError(DecryptErrorReasons.PayloadBroken, undefined), false, null];
    if (result instanceof DecryptError)
        return [result, result.message === DecryptErrorReasons.PrivateKeyNotFound, null];
    return [null, false, result];
}
