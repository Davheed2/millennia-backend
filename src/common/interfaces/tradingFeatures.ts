export interface IUserBot {
  id?: string;
  userId: string;
  botId: string;
  name: string;
  amount: number;
  roi: string;
  duration_days: number;
  status: 'active' | 'completed';
  matures_at: Date;
  isDemo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ILiveTrade {
  id?: string;
  userId: string;
  symbol: string;
  amount: number;
  orderType: 'rise' | 'fall';
  duration: string;
  entryPrice?: number;
  exitPrice?: number;
  status: 'open' | 'won' | 'lost';
  profit: number;
  expires_at?: Date;
  isDemo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
