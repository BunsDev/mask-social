'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Trans } from '@lingui/macro';
import type { SingletonModalRefCreator } from '@masknet/shared-base';
import { useSingletonModal } from '@masknet/shared-base-ui';
import { forwardRef, Fragment } from 'react';
import { useDisconnect } from 'wagmi';

import LogoutIcon from '@/assets/logout.svg';
import UserAddIcon from '@/assets/user-add.svg';
import { PlatformIcon } from '@/components/PlatformIcon.js';
import { SocialPlatform } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { LoginModalRef, LogoutModalRef } from '@/modals/controls.js';
import { useFarcasterStateStore } from '@/store/useFarcasterStore.js';

export const FarcasterStatusModal = forwardRef<SingletonModalRefCreator>(function FarcasterStatusModal(_, ref) {
    const { disconnect } = useDisconnect();
    const farcasterProfiles = useFarcasterStateStore((state) => state.profiles);
    const currentProfile = useFarcasterStateStore((state) => state.currentProfile);
    const [open, dispatch] = useSingletonModal(ref);
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[999]" onClose={() => dispatch?.close()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="transform rounded-[12px] bg-bgModal transition-all">
                                <div className="flex w-[260px] flex-col gap-[23px] rounded-[16px] p-[24px]">
                                    {farcasterProfiles.map(({ pfp, profileId, handle, displayName }) => (
                                        <div key={profileId} className="flex items-center justify-between gap-[8px]">
                                            <div className="flex h-[40px] w-[48px] items-start justify-start">
                                                <div className="relative h-[40px] w-[40px]">
                                                    <div className="absolute left-0 top-0 h-[40px] w-[40px] rounded-[99px] shadow backdrop-blur-lg">
                                                        <Image src={pfp} alt="avatar" width={40} height={36} />
                                                    </div>
                                                    <PlatformIcon
                                                        className="absolute left-[24px] top-[24px] h-[16px] w-[16px] rounded-[99px] border border-white shadow"
                                                        platform={SocialPlatform.Farcaster}
                                                        size={16}
                                                    />
                                                </div>
                                            </div>
                                            <div className="inline-flex h-[39px] shrink grow basis-0 flex-col items-start justify-center">
                                                <div className=" text-[15px] font-medium text-main">{displayName}</div>
                                                <div className=" text-[15px] font-normal text-lightSecond">
                                                    @{handle}
                                                </div>
                                            </div>
                                            {currentProfile && currentProfile.profileId === profileId ? (
                                                <div
                                                    className="h-[8px] w-[8px] rounded-[99px] bg-[#3DC233]"
                                                    style={{ filter: 'drop-shadow(0px 4px 10px #3DC233)' }}
                                                />
                                            ) : null}
                                        </div>
                                    ))}
                                    <button
                                        className="flex w-full items-center gap-[8px]"
                                        onClick={() => {
                                            disconnect();
                                            LoginModalRef.open({ current: SocialPlatform.Farcaster });
                                        }}
                                    >
                                        <UserAddIcon width={24} height={24} />
                                        <div className=" text-[17px] font-bold leading-[22px] text-main">
                                            <Trans>Change account</Trans>
                                        </div>
                                    </button>
                                    <button
                                        className="flex items-center gap-[8px]"
                                        onClick={() => LogoutModalRef.open({ platform: SocialPlatform.Farcaster })}
                                    >
                                        <LogoutIcon width={24} height={24} />
                                        <div className=" text-[17px] font-bold leading-[22px] text-[#f00]">
                                            <Trans>Log out</Trans>
                                        </div>
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
});
