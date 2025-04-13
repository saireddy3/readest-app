import clsx from 'clsx';
import React from 'react';
import { IoReload } from 'react-icons/io5';
import { FiSearch } from 'react-icons/fi';
import { MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { MdArrowBackIosNew } from 'react-icons/md';

import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTrafficLightStore } from '@/store/trafficLightStore';

const SidebarHeader: React.FC<{
  isPinned: boolean;
  isSearchBarVisible: boolean;
  onGoToLibrary: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleSearchBar: () => void;
}> = ({ isPinned, isSearchBarVisible, onGoToLibrary, onClose, onTogglePin, onToggleSearchBar }) => {
  const { isTrafficLightVisible } = useTrafficLightStore();
  const iconSize14 = useResponsiveSize(14);
  const iconSize18 = useResponsiveSize(18);
  const iconSize22 = useResponsiveSize(22);

  return (
    <div
      className={clsx(
        'sidebar-header flex h-11 items-center justify-between pe-2',
        isTrafficLightVisible ? 'pl-20' : 'ps-1.5',
      )}
      dir='ltr'
    >
      <div className='flex items-center gap-x-8'>
        <button
          onClick={onClose}
          className={'btn btn-ghost btn-circle flex h-6 min-h-6 w-6 hover:bg-transparent sm:hidden'}
        >
          <MdArrowBackIosNew size={iconSize22} />
        </button>
        <button
          className='btn btn-ghost hidden h-8 min-h-8 w-8 p-0 sm:flex'
          onClick={onGoToLibrary}
          title="Reload Book"
        >
          <IoReload className='fill-base-content' />
        </button>
      </div>
      <div className='flex min-w-24 max-w-32 items-center justify-between sm:size-[70%]'>
        <button
          onClick={onToggleSearchBar}
          className={clsx(
            'btn btn-ghost left-0 h-8 min-h-8 w-8 p-0',
            isSearchBarVisible ? 'bg-base-300' : '',
          )}
        >
          <FiSearch size={iconSize18} className='text-base-content' />
        </button>
        <div className='right-0 hidden h-8 w-8 items-center justify-center sm:flex'>
          <button
            onClick={onTogglePin}
            className={clsx(
              'sidebar-pin-btn btn btn-ghost btn-circle hidden h-6 min-h-6 w-6 sm:flex',
              isPinned ? 'bg-base-300' : 'bg-base-300/65',
            )}
          >
            {isPinned ? <MdPushPin size={iconSize14} /> : <MdOutlinePushPin size={iconSize14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
