import api from './api';

export type FraudRiskLevel = 'CLEAN' | 'LOW_RISK' | 'SUSPICIOUS' | 'FRAUD_CRITICAL';

export type FraudAnomalyType =
  | 'CLICK_BURST_BOT'
  | 'ZOMBIE_TRAFFIC'
  | 'FLASH_CONVERSION'
  | 'SELF_REFERRAL'
  | 'CONVERSION_SPIKE'
  | 'IP_CLUSTER';

export type FraudIncidentStatus = 'ACTIVE' | 'FROZEN' | 'RESOLVED' | 'DISMISSED';

export type FraudMitigationAction = 'FREEZE_COMMISSION' | 'PAUSE_LINK' | 'DISMISS' | 'RESOLVE';

export interface FraudEvidenceItem {
  metric: string;
  value: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface FraudIncident {
  id: string;
  incidentCode: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorEmail: string;
  collaboratorAvatar?: string;
  collaboratorTier?: string;
  storeId?: string;
  storeName?: string;
  referralLinkId?: string;
  referralLinkCode?: string;
  productName?: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  anomalyTypes: FraudAnomalyType[];
  totalClicks: number;
  totalOrders: number;
  conversionRate: number;
  pendingCommissionAmount: number;
  aiReasoning: string;
  evidences: FraudEvidenceItem[];
  suggestedAction: 'FREEZE_COMMISSION' | 'PAUSE_LINK' | 'MONITOR' | 'NONE';
  status: FraudIncidentStatus;
  detectedAt: string;
  actionHistory?: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    note?: string;
  }>;
}

export interface FraudScanSummary {
  totalScannedLinks: number;
  totalScannedClicks: number;
  totalIncidents: number;
  criticalCount: number;
  suspiciousCount: number;
  lowRiskCount: number;
  cleanCount: number;
  potentialSavedAmount: number;
  scanTimestamp: string;
  incidents: FraudIncident[];
}

export interface FraudScanFilterParams {
  storeId?: string;
  collaboratorId?: string;
  timeframe?: '24h' | '7d' | '30d' | 'all';
  minRiskScore?: number;
  status?: FraudIncidentStatus;
}

export const aiFraudService = {
  /**
   * Quét toàn diện traffic và tính toán chỉ số rủi ro
   */
  scanTraffic: async (params?: FraudScanFilterParams): Promise<FraudScanSummary> => {
    const res = await api.get('/ai/fraud/scan', { params });
    return res.data?.data || res.data || res;
  },

  /**
   * Lấy danh sách các sự vụ nghi vấn gian lận
   */
  getIncidents: async (params?: FraudScanFilterParams): Promise<FraudIncident[]> => {
    const res = await api.get('/ai/fraud/incidents', { params });
    return res.data?.data || res.data || res;
  },

  /**
   * Lấy chi tiết phân tích 1 sự vụ
   */
  getIncidentById: async (incidentId: string): Promise<FraudIncident> => {
    const res = await api.get(`/ai/fraud/incidents/${incidentId}`);
    return res.data?.data || res.data || res;
  },

  /**
   * Phân tích chuyên sâu 1 KOL
   */
  analyzeCollaborator: async (collaboratorId: string): Promise<FraudIncident> => {
    const res = await api.get(`/ai/fraud/kol/${collaboratorId}/analysis`);
    return res.data?.data || res.data || res;
  },

  /**
   * Thực hiện hành động xử lý (Đóng băng, tạm ngưng, bác bỏ)
   */
  takeAction: async (
    incidentId: string,
    action: FraudMitigationAction,
    note?: string,
  ): Promise<{ success: boolean; message: string; incident: FraudIncident }> => {
    const res = await api.post(`/ai/fraud/incidents/${incidentId}/action`, { action, note });
    return res.data?.data || res.data || res;
  },
};
