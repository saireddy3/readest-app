import {
  webUpload,
  webDownload,
  ProgressHandler,
  ProgressPayload,
} from '@/utils/transfer';

export const createProgressHandler = (
  totalFiles: number,
  completedFilesRef: { count: number },
  onProgress?: ProgressHandler,
) => {
  return (progress: ProgressPayload) => {
    const fileProgress = progress.progress / progress.total;
    const overallProgress = ((completedFilesRef.count + fileProgress) / totalFiles) * 100;

    if (onProgress) {
      onProgress({
        progress: overallProgress,
        total: 100,
        transferSpeed: progress.transferSpeed,
      });
    }
  };
};

export const uploadFile = async (
  file: File,
  fileFullPath: string,
  onProgress?: ProgressHandler,
  bookHash?: string,
) => {
  // No remote upload needed in web mode
  console.log('File upload skipped in web mode:', file.name);
  if (onProgress) {
    onProgress({ progress: 100, total: 100, transferSpeed: 0 });
  }
  return;
};

export const downloadFile = async (
  filePath: string,
  fileFullPath: string,
  onProgress?: ProgressHandler,
) => {
  // No remote download needed in web mode
  console.log('File download skipped in web mode:', filePath);
  if (onProgress) {
    onProgress({ progress: 100, total: 100, transferSpeed: 0 });
  }
  throw new Error('File download skipped in web mode');
};

export const deleteFile = async (filePath: string) => {
  // No remote deletion needed in web mode
  console.log('File deletion skipped in web mode:', filePath);
  return;
};
