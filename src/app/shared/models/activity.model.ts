export interface IActivityUI {
  icon: string;
  color: string;
  displayAction: string;
  displayStatus: string;
  displayTime: string;
  isSystem: boolean;
  entityType: string | null;
  entityId: string | null;
  displayId: string | null;
}

export interface IActivity {
  id: string;
  type: 'contract' | 'purchase_order' | 'system';
  action: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  metadata?: {
    entityId?: string;
    entityType?: string;
    status?: string;
    [key: string]: any;
  };
  ui?: IActivityUI;
} 