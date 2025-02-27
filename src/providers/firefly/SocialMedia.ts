import { t } from '@lingui/macro';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    EMPTY_LIST,
    type Pageable,
    type PageIndicator,
} from '@masknet/shared-base';
import { isZero } from '@masknet/web3-shared-base';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { farcasterClient } from '@/configs/farcasterClient.js';
import { SocialPlatform } from '@/constants/enum.js';
import { FIREFLY_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatFarcasterPostFromFirefly } from '@/helpers/formatFarcasterPostFromFirefly.js';
import { formatFarcasterProfileFromFirefly } from '@/helpers/formatFarcasterProfileFromFirefly.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import type {
    CastResponse,
    CastsResponse,
    CommentsResponse,
    NotificationResponse,
    ReactorsResponse,
    SearchCastsResponse,
    UploadMediaTokenResponse,
    UserResponse,
    UsersResponse,
} from '@/providers/types/Firefly.js';
import {
    type Notification,
    NotificationType,
    type Post,
    type PostType,
    type Profile,
    type Provider,
    type Reaction,
    SessionType,
} from '@/providers/types/SocialMedia.js';

// @ts-ignore
export class FireflySocialMedia implements Provider {
    get type() {
        return SessionType.Farcaster;
    }

    async createSession(signal?: AbortSignal): Promise<FarcasterSession> {
        throw new Error('Please use createSessionByGrantPermission() instead.');
    }

    async discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new Error('Method not implemented.');
    }

    async getPostById(postId: string): Promise<Post> {
        const session = farcasterClient.getSession();
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast', { hash: postId, fid: session?.profileId });
        const { data: cast } = await fetchJSON<CastResponse>(url, {
            method: 'GET',
        });

        return formatFarcasterPostFromFirefly(cast);
    }

    async getProfileById(profileId: string): Promise<Profile> {
        const session = farcasterClient.getSession();
        const { data: user } = await fetchJSON<UserResponse>(
            urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/profile', {
                fid: profileId,
                sourceFid: session?.profileId,
            }),
            {
                method: 'GET',
            },
        );

        return formatFarcasterProfileFromFirefly(user);
    }

    async getPostsByParentPostId(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new Error('Method not implemented.');
    }

    async getFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/followers', {
            fid: profileId,
            size: 10,
            cursor: indicator?.id,
        });
        const {
            data: { list, next_cursor },
        } = await fetchJSON<UsersResponse>(url, {
            method: 'GET',
        });
        const data = list.map(formatFarcasterProfileFromFirefly);

        return createPageable(data, createIndicator(indicator), createNextIndicator(indicator, next_cursor));
    }

    async getFollowings(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/followings', {
            fid: profileId,
            size: 10,
            cursor: indicator?.id,
        });
        const {
            data: { list, next_cursor },
        } = await fetchJSON<UsersResponse>(url, {
            method: 'GET',
        });
        const data = list.map(formatFarcasterProfileFromFirefly);

        return createPageable(data, createIndicator(indicator), createNextIndicator(indicator, next_cursor));
    }

    async getCommentsById(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        // TODO: pass fid
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/comments', {
            hash: postId,
            size: 25,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        });

        const {
            data: { comments, cursor },
        } = await fetchJSON<CommentsResponse>(url, {
            method: 'GET',
        });

        return createPageable(
            comments.map((item) => formatFarcasterPostFromFirefly(item)),
            indicator ?? createIndicator(indicator),
            cursor ? createNextIndicator(indicator, cursor) : undefined,
        );
    }

    async getPostsByProfileId(profileId: string, indicator?: PageIndicator) {
        const session = farcasterClient.getSession();
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/user/timeline/farcaster');
        const {
            data: { casts, cursor },
        } = await fetchJSON<CastsResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                fids: [profileId],
                size: 25,
                sourceFid: session?.profileId,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
            }),
        });
        const data = casts.map((cast) => formatFarcasterPostFromFirefly(cast));
        return createPageable(
            data,
            createIndicator(indicator),
            cursor ? createNextIndicator(indicator, cursor) : undefined,
        );
    }

    async getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
        const session = farcasterClient.getSessionRequired();
        const profileId = session.profileId;
        if (!profileId) throw new Error(t`Login required`);
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/notifications', {
            fid: profileId,
            sourceFid: profileId,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        });
        const { data } = await fetchJSON<NotificationResponse>(url, { method: 'GET' });

        const result = data.notifications.map<Notification | undefined>((notification) => {
            const notificationId = `${profileId}_${notification.timestamp}_${notification.notificationType}`;
            const user = notification.user ? [formatFarcasterProfileFromFirefly(notification.user)] : EMPTY_LIST;
            const post = notification.cast ? formatFarcasterPostFromFirefly(notification.cast) : undefined;
            const timestamp = notification.timestamp ? new Date(notification.timestamp).getTime() : undefined;
            if (notification.notificationType === 1) {
                return {
                    source: SocialPlatform.Farcaster,
                    notificationId,
                    type: NotificationType.Reaction,
                    reactors: user,
                    post,
                    timestamp,
                };
            } else if (notification.notificationType === 2) {
                return {
                    source: SocialPlatform.Farcaster,
                    notificationId,
                    type: NotificationType.Mirror,
                    mirrors: user,
                    post,
                    timestamp,
                };
            } else if (notification.notificationType === 3) {
                const commentOn = notification.cast?.parentCast
                    ? formatFarcasterPostFromFirefly(notification.cast.parentCast)
                    : undefined;
                return {
                    source: SocialPlatform.Farcaster,
                    notificationId,
                    type: NotificationType.Comment,
                    comment: post
                        ? {
                              ...post,
                              commentOn,
                          }
                        : undefined,
                    post: commentOn,
                    timestamp,
                };
            } else if (notification.notificationType === 4) {
                return {
                    source: SocialPlatform.Farcaster,
                    notificationId,
                    type: NotificationType.Follow,
                    followers: user,
                };
            } else if (notification.notificationType === 5) {
                return {
                    source: SocialPlatform.Farcaster,
                    notificationId,
                    type: NotificationType.Mention,
                    post,
                    timestamp,
                };
            }
            return;
        });
        return createPageable(
            compact(result),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async discoverPostsById(
        profileId: string,
        indicator?: PageIndicator | undefined,
    ): Promise<Pageable<Post, PageIndicator>> {
        const session = farcasterClient.getSessionRequired();
        // TODO: replace to prod url
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/timeline/farcaster_for_fid');

        const {
            data: { casts, cursor },
        } = await fetchJSON<CastsResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: profileId,
                size: 25,
                needRootParentHash: true,
                sourceFid: session?.profileId,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
            }),
        });

        const data = casts.map(formatFarcasterPostFromFirefly);
        return createPageable(
            data,
            indicator ?? createIndicator(),
            cursor ? createNextIndicator(indicator, cursor) : undefined,
        );
    }

    async getLikeReactors(postId: string, indicator?: PageIndicator) {
        const session = farcasterClient.getSession();
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/likes', {
            castHash: postId,
            size: 15,
            sourceFid: session?.profileId,
            cursor: indicator?.id,
        });
        const {
            data: { items, nextCursor },
        } = await fetchJSON<ReactorsResponse>(url, {
            method: 'GET',
        });

        const data = items.map(formatFarcasterProfileFromFirefly);
        return createPageable(data, createIndicator(indicator), createNextIndicator(indicator, nextCursor));
    }

    async getMirrorReactors(postId: string, indicator?: PageIndicator) {
        const session = farcasterClient.getSession();
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/recasters', {
            castHash: postId,
            size: 15,
            sourceFid: session?.profileId,
            cursor: indicator?.id,
        });
        const {
            data: { items, nextCursor },
        } = await fetchJSON<ReactorsResponse>(url, {
            method: 'GET',
        });

        const data = items.map(formatFarcasterProfileFromFirefly);
        return createPageable(data, createIndicator(indicator), createNextIndicator(indicator, nextCursor));
    }

    async publishPost(post: Post): Promise<Post> {
        throw new Error('Method not implemented.');
    }

    async upvotePost(postId: string): Promise<Reaction> {
        throw new Error('Method not implemented.');
    }

    async unvotePost(postId: string) {
        throw new Error('Method not implemented.');
    }

    async commentPost(postId: string, comment: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    async mirrorPost(postId: string): Promise<Post> {
        throw new Error('Method not implemented.');
    }

    async unmirrorPost(postId: string) {
        throw new Error('Method not implemented.');
    }

    async follow(profileId: string) {
        throw new Error('Method not implemented.');
    }

    async unfollow(profileId: string) {
        throw new Error('Method not implemented.');
    }

    searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
        throw new Error(t`Method not implemented.`);
    }

    async searchPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/search', {
            keyword: q,
            limit: 25,
        });
        const { data: casts } = await fetchJSON<SearchCastsResponse>(url, {
            method: 'GET',
        });
        const data = casts.map((cast) => ({
            type: (cast.parent_hash ? 'Comment' : 'Post') as PostType,
            source: SocialPlatform.Farcaster,
            postId: cast.hash,
            parentPostId: cast.parent_hash,
            timestamp: Number(cast.created_at),
            author: formatFarcasterProfileFromFirefly(cast.author),
            metadata: {
                locale: '',
                content: {
                    content: cast.text,
                },
            },
            stats: {
                comments: Number(cast.replyCount),
                mirrors: cast.recastCount,
                quotes: cast.recastCount,
                reactions: cast.likeCount,
            },
        }));
        return createPageable(data, createIndicator(indicator), createNextIndicator(indicator, ''));
    }

    async getUploadMediaToken(token: string) {
        if (!token) throw new Error('Need to login with Lens');
        const url = urlcat(FIREFLY_ROOT_URL, '/v1/lens/public_uploadMediaToken');
        const res = await fetchJSON<UploadMediaTokenResponse>(url, {
            headers: {
                'x-access-token': token,
            },
        });

        return res.data;
    }
}

export const FireflySocialMediaProvider = new FireflySocialMedia();
