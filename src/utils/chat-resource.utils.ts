import type {ResourceKind} from '@/services/collaboration-chat.service';

export function parseCollaborationResource(content: string): { type: ResourceKind; resourceId: string } | null {
  try {
    const card = JSON.parse(content);
    return ['COMMISSION_DEAL', 'SAMPLE_REQUEST'].includes(card.type) && typeof card.resourceId === 'string' ? card : null;
  } catch {
    return null;
  }
}
