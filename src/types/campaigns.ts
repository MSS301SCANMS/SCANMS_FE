export type CampaignParticipantStatus = 'INVITED' | 'ACCEPTED' | 'REJECTED';

export interface Campaign {
  id: string;
  storeId: string;
  name: string;
  bonusCommissionRate: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  store?: { id: string; name: string; logoUrl?: string; defaultCommissionRate?: number };
  participants?: CampaignParticipant[];
}

export interface CampaignParticipant {
  id: string;
  campaignId: string;
  collaboratorId: string;
  status: CampaignParticipantStatus;
  joinedAt?: string;
  createdAt: string;
  campaign?: Campaign;
  collaborator?: { id: string; fullName: string; email: string };
}


export interface CampaignInviteCard {
  type: 'CAMPAIGN_INVITE';
  participantId?: string;
  campaignId: string;
  campaignName: string;
  bonusCommissionRate: number;
  startDate: string;
  endDate: string;
  storeId?: string;
  storeName?: string;
  storeLogoUrl?: string | null;
  personalMessage?: string | null;
  invitedAt?: string;
}

export interface CampaignAcceptedCard {
  type: 'CAMPAIGN_ACCEPTED';
  participantId?: string;
  campaignId: string;
  campaignName: string;
  acceptedAt?: string;
}

export interface CampaignRejectedCard {
  type: 'CAMPAIGN_REJECTED';
  participantId?: string;
  campaignId: string;
  campaignName: string;
  rejectedAt?: string;
}

export type ChatCard = CampaignInviteCard | CampaignAcceptedCard | CampaignRejectedCard;

