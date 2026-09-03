import { ComplianceRecommendation, RiskLevel, SentimentLabel } from '../types';

export function getRiskColor(level: RiskLevel): {
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  progressColor: string;
  ringColor: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        badgeBg: 'bg-red-500/15',
        badgeText: 'text-red-400',
        borderColor: 'border-red-500/30',
        progressColor: 'bg-red-500',
        ringColor: 'ring-red-500',
      };
    case 'HIGH':
      return {
        badgeBg: 'bg-orange-500/15',
        badgeText: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        progressColor: 'bg-orange-500',
        ringColor: 'ring-orange-500',
      };
    case 'MEDIUM':
      return {
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        progressColor: 'bg-amber-500',
        ringColor: 'ring-amber-500',
      };
    case 'LOW':
    default:
      return {
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        progressColor: 'bg-emerald-500',
        ringColor: 'ring-emerald-500',
      };
  }
}

export function getRecommendationBadge(rec: ComplianceRecommendation): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  actionText: string;
} {
  switch (rec) {
    case 'REJECT_BLOCK':
      return {
        label: 'PROHIBITED / REJECT & BLOCK',
        bgColor: 'bg-red-950/60',
        textColor: 'text-red-300',
        borderColor: 'border-red-600/60',
        actionText: 'Mandatory Account Denial & Suspicious Activity Report (SAR) Filing',
      };
    case 'ENHANCED_DUE_DILIGENCE':
      return {
        label: 'ENHANCED DUE DILIGENCE (EDD)',
        bgColor: 'bg-orange-950/60',
        textColor: 'text-orange-300',
        borderColor: 'border-orange-600/60',
        actionText: 'Senior Management Sign-off & Source of Wealth Verification Required',
      };
    case 'PASS_WITH_MONITORING':
      return {
        label: 'PASS WITH CONDITIONAL MONITORING',
        bgColor: 'bg-amber-950/60',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-600/60',
        actionText: 'Accelerated 90-Day Transaction Review & Risk Trigger Monitoring',
      };
    case 'PASS':
    default:
      return {
        label: 'STANDARD APPROVAL (PASS)',
        bgColor: 'bg-emerald-950/60',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-600/60',
        actionText: 'Standard Customer Due Diligence (CDD) / Periodic Annual Review',
      };
  }
}

export function getSentimentDetails(score: number, label?: SentimentLabel): {
  text: string;
  colorClass: string;
  bgClass: string;
} {
  if (score <= -70 || label === 'NEGATIVE_CRITICAL') {
    return {
      text: 'Critical Adverse',
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/20 border-red-500/40',
    };
  }
  if (score <= -30 || label === 'NEGATIVE_HIGH') {
    return {
      text: 'High Negative',
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/20 border-orange-500/40',
    };
  }
  if (score < 0 || label === 'NEGATIVE_MODERATE') {
    return {
      text: 'Moderate Negative',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/20 border-amber-500/40',
    };
  }
  if (score === 0 || label === 'NEUTRAL') {
    return {
      text: 'Neutral / Informational',
      colorClass: 'text-slate-300',
      bgClass: 'bg-slate-700/40 border-slate-600/40',
    };
  }
  return {
    text: 'Positive Sentiment',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/20 border-emerald-500/40',
  };
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Undated';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function downloadJsonFile(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
