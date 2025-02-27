import { t } from '@lingui/macro';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';

import CollectIcon from '@/assets/collect.svg';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { useCustomSnackbar } from '@/hooks/useCustomSnackbar.js';

interface CollectProps {
    count?: number;
    disabled?: boolean;
    collected?: boolean;
}
export const Collect = memo<CollectProps>(function Collect({ count, disabled = false, collected }) {
    const enqueueSnackbar = useCustomSnackbar();

    const handleClick = useCallback(() => {
        enqueueSnackbar(t`Collect Action is not supported yet.`, {
            variant: 'error',
        });
    }, [enqueueSnackbar]);

    return (
        <div
            className={classNames('flex items-center space-x-2 text-main hover:text-primaryPink', {
                'opacity-50': disabled,
            })}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <Tooltip content={t`Act`} placement="top" disabled={disabled}>
                <motion.button
                    disabled={disabled}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!disabled) handleClick();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-1.5 hover:bg-primaryPink/[.20] "
                >
                    <CollectIcon width={17} height={16} className={collected ? 'text-collected' : ''} />
                </motion.button>
            </Tooltip>
            {count ? (
                <span
                    className={classNames('text-xs', {
                        'font-medium': !collected,
                        'font-bold': !!collected,
                        'text-collected': !!collected,
                    })}
                >
                    {nFormatter(count)}
                </span>
            ) : null}
        </div>
    );
});
