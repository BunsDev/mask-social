'use client';

import { t, Trans } from '@lingui/macro';
import { compact, first, flatten } from 'lodash-es';
import { usePathname } from 'next/navigation.js';
import { memo, useMemo } from 'react';

import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import MirrorIcon from '@/assets/mirror.svg';
import SparkIcon from '@/assets/spark.svg';
import { ThreadBody } from '@/components/Posts/ThreadBody.js';
import { SocialPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface FeedActionType {
    post: Post;
    isThread?: boolean;
}

export const FeedActionType = memo<FeedActionType>(function FeedActionType({ post, isThread }) {
    const currentProfile = useCurrentProfile(post.source);
    const isComment = post.type === 'Comment';
    const showThread = isComment || !post.comments?.length;

    const pathname = usePathname();
    const isPostPage = isRoutePathname(pathname, '/post');

    const combined =
        [post.mirrors?.length ?? 0, post.reactions?.length ?? 0, post.comments?.length ?? 0].filter((x) => x > 0)
            .length > 1;

    const combinedDescription = useMemo(() => {
        if (!combined) return;
        const actions = compact([
            post.mirrors?.length ? t`mirrored` : undefined,
            post.reactions?.length ? t`liked` : undefined,
            post.comments?.length ? t`commented` : undefined,
        ]);

        return (
            <span className="flex items-center space-x-1">
                {actions.map((action, index) => (
                    <span key={index} className="space-x-1">
                        <span>{action}</span>
                        {index < actions.length - 2 && <span>, </span>}
                        {index === actions.length - 2 && <span>{t`and`}</span>}
                    </span>
                ))}
            </span>
        );
    }, [combined, post]);

    const profilesDescription = useMemo(() => {
        const profiles = compact(flatten([post.mirrors, post.reactions, post.comments?.map((x) => x.author)])).filter(
            (profile, index, self) => index === self.findIndex((t) => t.profileId === profile.profileId),
        );

        const firstProfile = first(profiles);
        if (!firstProfile) return;

        return profiles.length > 1 ? (
            <Link href={getProfileUrl(firstProfile)}>
                <Trans>{firstProfile.displayName} and others</Trans>
            </Link>
        ) : (
            firstProfile.displayName
        );
    }, [post]);

    return (
        <div
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
            }}
        >
            {combined && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-[15px] text-secondary">
                    <SparkIcon width={16} height={16} />
                    <span className="flex items-center space-x-1">
                        <strong>{profilesDescription}</strong> <span>{combinedDescription}</span>
                    </span>
                </div>
            ) : null}
            {post.type === 'Mirror' && post.reporter && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-[15px] text-secondary">
                    <MirrorIcon width={16} height={16} />
                    <Link href={getProfileUrl(post.reporter)}>
                        {isSameProfile(post.reporter, currentProfile) ? (
                            <Trans>
                                <strong>You</strong> mirrored
                            </Trans>
                        ) : (
                            <Trans>
                                <strong>{post.reporter.displayName}</strong> mirrored
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}
            {post.mirrors?.length && !isComment && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-[15px] text-secondary">
                    <MirrorIcon width={16} height={16} />
                    <Link href={getProfileUrl(first(post.mirrors)!)}>
                        {post.mirrors.some((profile) => isSameProfile(profile, currentProfile)) ? (
                            post.source === SocialPlatform.Farcaster ? (
                                post.mirrors.length < 2 ? (
                                    <Trans>
                                        <strong>You</strong> recasted
                                    </Trans>
                                ) : post.mirrors.length === 2 ? (
                                    <Trans>
                                        <strong>You</strong> and{' '}
                                        {
                                            post.mirrors.find((profile) => !isSameProfile(profile, currentProfile))
                                                ?.displayName
                                        }{' '}
                                        recasted
                                    </Trans>
                                ) : (
                                    <Trans>
                                        <strong>You</strong> and {post.mirrors.length - 1} others recasted
                                    </Trans>
                                )
                            ) : (
                                <Trans>
                                    <strong>You</strong> mirrored
                                </Trans>
                            )
                        ) : post.source === SocialPlatform.Farcaster ? (
                            <Trans>
                                <strong>{first(post.mirrors)?.displayName}</strong> recasted
                            </Trans>
                        ) : (
                            <Trans>
                                <strong>{first(post.mirrors)?.displayName}</strong> mirrored
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}
            {post.reactions?.length && !isComment && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-[15px] text-secondary">
                    {post.hasLiked ? <LikedIcon width={17} height={16} /> : <LikeIcon width={17} height={16} />}
                    <Link href={getProfileUrl(first(post.reactions)!)}>
                        {post.reactions.some((profile) => isSameProfile(profile, currentProfile)) ? (
                            <Trans>
                                <strong>You</strong> liked
                            </Trans>
                        ) : (
                            <Trans>
                                <strong>{first(post.reactions)?.displayName}</strong> liked
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}

            {showThread && post.root && !isThread ? <ThreadBody post={post.root} /> : null}
            {showThread && post.commentOn && !isThread ? <ThreadBody post={post.commentOn} /> : null}
        </div>
    );
});
