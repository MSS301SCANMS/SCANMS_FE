import api from './api';

export interface SocialChannel {
  id: string;
  platformName: string;
  channelName?: string;
  channelUrl: string;
  followerCount: number;
  isPrimary: boolean;
  createdAt: string;
}

export const socialService = {
  async getMyChannels(): Promise<SocialChannel[]> {
    const res: any = await api.get('/social-channels');
    return res.data;
  },

  async addChannel(data: {
    platformName: string;
    channelName?: string;
    channelUrl: string;
    followerCount?: number;
    isPrimary?: boolean;
  }) {
    const res: any = await api.post('/social-channels', data);
    return res.data;
  },

  async deleteChannel(id: string) {
    const res: any = await api.delete(`/social-channels/${id}`);
    return res.data;
  },

  async setPrimary(id: string) {
    const res: any = await api.patch(`/social-channels/${id}/primary`);
    return res.data;
  },
};
