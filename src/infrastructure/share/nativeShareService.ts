import { Share } from 'react-native';

export interface ShareService {
  shareFile(path: string, title: string): Promise<void>;
}

/** Uses the platform share sheet only after an explicit user action. */
export const nativeShareService: ShareService = {
  async shareFile(path, title) {
    if (!path.trim() || !title.trim()) throw new Error('invalid_input');
    await Share.share({
      title,
      url: path,
      message: title,
    });
  },
};
