import { KeyType } from '@/constants/enum.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { digestLink } from '@/services/digestLink.js';

const digestLinkRedis = memoizeWithRedis(digestLink, {
    key: KeyType.DigestLink,
    resolver: (link) => link,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const link = searchParams.get('link');
    if (!link) return Response.json({ error: 'Missing link' }, { status: 400 });

    if (
        [
            /opensea.io\/assets\/(0x[\dA-Fa-f]{40})\/(\d+)/,
            /opensea.io\/assets\/(\w+)\/(0x[\dA-Fa-f]{40})\/(\d+)/,
            /rarible.com\/token\/(0x[\dA-Fa-f]{40}):(\d+)/,
            /zora.co\/collections\/(0x[\dA-Fa-f]{40})\/\d+$/,
        ].some((x) => x.test(decodeURIComponent(link)))
    ) {
        // For the time being, we do not support og information capture for links in opensea. The simplehash api will be used instead.
        return Response.json({ error: 'Unsupported' }, { status: 400 });
    }

    const response = await digestLinkRedis(decodeURIComponent(link), request.signal);
    if (!response) return Response.json({ error: 'Unable to request link' }, { status: 500 });

    return Response.json(response);
}
