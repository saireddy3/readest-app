import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { useEnv } from '@/context/EnvContext';

import { handleMinimize, handleToggleMaximize, handleClose } from '@/utils/webWindow';

interface WindowButtonsProps {
  className?: string;
  headerRef?: React.RefObject<HTMLDivElement>;
  showMinimize?: boolean;
  showMaximize?: boolean;
  showClose?: boolean;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  onClose?: () => void;
}

interface WindowButtonProps {
  id: string;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

const WindowButton: React.FC<WindowButtonProps> = ({ onClick, ariaLabel, id, children }) => (
  <button
    id={id}
    onClick={onClick}
    className='window-button text-base-content/85 hover:text-base-content'
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

const WindowButtons: React.FC<WindowButtonsProps> = ({
  className,
  headerRef,
  showMinimize = true,
  showMaximize = true,
  showClose = true,
  onMinimize,
  onToggleMaximize,
  onClose,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { appService } = useEnv();

  // In web mode, we don't need the title bar dragging functionality
  const handleMouseDown = async (e: MouseEvent) => {
    // No-op in web environment
    console.log('Title bar mouse down - not supported in web environment');
  };

  useEffect(() => {
    // No need to add listeners in web mode
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMinimizeClick = async () => {
    if (onMinimize) {
      onMinimize();
    } else {
      handleMinimize();
    }
  };

  const handleMaximizeClick = async () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    } else {
      handleToggleMaximize();
    }
  };

  const handleCloseClick = async () => {
    if (onClose) {
      onClose();
    } else {
      handleClose();
    }
  };

  return (
    <div
      ref={parentRef}
      className={clsx(
        'window-buttons flex h-8 items-center justify-end space-x-2',
        showClose || showMaximize || showMinimize ? 'visible' : 'hidden',
        className,
      )}
    >
      {showMinimize && appService?.hasWindowBar && (
        <WindowButton onClick={handleMinimizeClick} ariaLabel='Minimize' id='titlebar-minimize'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path fill='currentColor' d='M20 14H4v-2h16' />
          </svg>
        </WindowButton>
      )}

      {showMaximize && appService?.hasWindowBar && (
        <WindowButton onClick={handleMaximizeClick} ariaLabel='Maximize/Restore' id='titlebar-maximize'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path fill='currentColor' d='M4 4h16v16H4zm2 4v10h12V8z' />
          </svg>
        </WindowButton>
      )}

      {showClose && (appService?.hasWindowBar || onClose) && (
        <WindowButton onClick={handleCloseClick} ariaLabel='Close' id='titlebar-close'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path
              fill='currentColor'
              d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z'
            />
          </svg>
        </WindowButton>
      )}
    </div>
  );
};

export default WindowButtons;
