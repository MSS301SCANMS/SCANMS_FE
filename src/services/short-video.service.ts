import api from './api';
import { captureProductReferral } from '../utils/referral-attribution';
export interface ShortVideoProduct {
    productId: string;
    referralLinkId: string;
    name: string;
    priceVnd: number;
    imageUrl: string | null;
}
export interface ShortVideo {
    id: string;
    collaboratorId: string;
    creatorName: string;
    storeId: string;
    title: string;
    caption?: string;
    videoUrl: string;
    posterUrl?: string;
    durationSeconds: number;
    status: 'PUBLISHED' | 'HIDDEN';
    createdAt: string;
    products: ShortVideoProduct[];
}
export interface VideoFeed {
    items: ShortVideo[];
    nextPage: number | null;
}
const unwrap = (r: any) => r?.result ?? r?.data ?? r;
const clickVersions = new Map<string, number>();
export const shortVideoService = {
    async feed(page = 0): Promise<VideoFeed> { return unwrap(await api.get('/public/short-videos', { params: { page }, headers: { 'x-skip-cache': 'true' } })); },
    async mine(page = 0): Promise<VideoFeed> { return unwrap(await api.get('/short-videos/mine', { params: { page }, headers: { 'x-skip-cache': 'true' } })); },
    async upload(file: File): Promise<{
        publicId: string;
        secureUrl: string;
        posterUrl?: string;
    }> { const form = new FormData(); form.append('file', file); return unwrap(await api.post('/upload/short-video', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 })); },
    async create(input: {
        title: string;
        caption: string;
        publicId: string;
        products: {
            productId: string;
            referralLinkId: string;
        }[];
    }): Promise<ShortVideo> { return unwrap(await api.post('/short-videos', input, { timeout: 30000 })); },
    async hide(id: string) { await api.delete(`/short-videos/${encodeURIComponent(id)}`); },
    async click(productId: string, referralLinkId: string, shortVideoId?: string) {
        const version = (clickVersions.get(productId) || 0) + 1;
        clickVersions.set(productId, version);
        const click = unwrap(await api.post('/referrals/clicks', { productId, referralLinkId, shortVideoId }));
        if (!click?.clickId || !click?.expiresAt)
            throw new Error('Chưa ghi nhận được lượt giới thiệu. Vui lòng thử lại.');
        if (clickVersions.get(productId) !== version)
            return;
        captureProductReferral(productId, referralLinkId, click.clickId, click.expiresAt);
    },
};
