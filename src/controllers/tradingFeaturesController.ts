import { Request, Response } from 'express';

import { AppError } from '@/common/utils';
import { userBotRepository, liveTradeRepository, walletRepository } from '@/repository';
import { DateTime } from 'luxon';
import { catchAsync } from '@/middlewares';

class TradingFeaturesController {
  purchaseBot = catchAsync(async (req: Request, res: Response) => {
    const { user } = req;
    const { botId, name, amount, roi, duration_days } = req.body;

    if (!user) throw new AppError('Please log in again', 400);
    if (!botId || !name || !amount || !roi || !duration_days) {
      throw new AppError('Missing required bot parameters', 400);
    }

    const walletBalance = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
    if (!walletBalance || walletBalance.length === 0 || walletBalance[0].balance < amount) {
      throw new AppError('Insufficient Balance', 400);
    }

    const maturesAt = DateTime.now().plus({ days: duration_days }).toJSDate();

    // Deduct balance
    const newBalance = Number(walletBalance[0].balance) - Number(amount);
    await walletRepository.update(walletBalance[0].id, { balance: newBalance });

    // Create bot subscription
    const [bot] = await userBotRepository.create({
      userId: user.id,
      botId,
      name,
      amount,
      roi,
      duration_days,
      matures_at: maturesAt,
      status: 'active',
      isDemo: req.isDemoMode || false
    });

    res.status(201).json({
      status: 'success',
      message: 'Bot purchased successfully',
      data: bot
    });
  });

  executeLiveTrade = catchAsync(async (req: Request, res: Response) => {
    const { user } = req;
    const { symbol, amount, orderType, duration } = req.body;

    if (!user) throw new AppError('Please log in again', 400);
    if (!symbol || !amount || !orderType || !duration) {
      throw new AppError('Missing required trade parameters', 400);
    }

    const walletBalance = await walletRepository.findByUserId(user.id, req.isDemoMode || false);
    if (!walletBalance || walletBalance.length === 0 || walletBalance[0].balance < amount) {
      throw new AppError('Insufficient Balance', 400);
    }

    // Deduct balance
    const newBalance = Number(walletBalance[0].balance) - Number(amount);
    await walletRepository.update(walletBalance[0].id, { balance: newBalance });

    // Calculate expiration (e.g., "1m", "5m")
    const durationMatch = duration.match(/(\d+)([mhd])/);
    let expiresAt = DateTime.now().toJSDate();
    if (durationMatch) {
      const val = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      if (unit === 'm') expiresAt = DateTime.now().plus({ minutes: val }).toJSDate();
      else if (unit === 'h') expiresAt = DateTime.now().plus({ hours: val }).toJSDate();
      else if (unit === 'd') expiresAt = DateTime.now().plus({ days: val }).toJSDate();
    }

    // Mock entry price between 50,000 and 60,000 for crypto just for demo, usually we'd pass it from FE or fetch real-time
    const entryPrice = Math.random() * 10000 + 50000;

    // Create trade
    const [trade] = await liveTradeRepository.create({
      userId: user.id,
      symbol,
      amount,
      orderType,
      duration,
      entryPrice,
      status: 'open',
      profit: 0,
      expires_at: expiresAt,
      isDemo: req.isDemoMode || false
    });

    res.status(201).json({
      status: 'success',
      message: 'Trade executed successfully',
      data: trade
    });
  });

  getLiveTradeStats = catchAsync(async (req: Request, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError('Please log in again', 400);

    const trades = await liveTradeRepository.findByUserId(user.id, req.isDemoMode || false);

    // Calculate stats directly from trades for 100% consistency and performance
    const totalTrades = trades.length;
    const wonTrades = trades.filter((t: any) => t.status === 'won').length;
    const totalProfit = trades.reduce((acc: number, t: any) => acc + Number(t.profit || 0), 0);

    const stats = {
      totalTrades,
      wonTrades,
      totalProfit
    };

    // Also get active bots just to have them accessible if needed, but primarily live trades
    const bots = await userBotRepository.findByUserId(user.id, req.isDemoMode || false);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        trades,
        bots
      }
    });
  });

  getUserBots = catchAsync(async (req: Request, res: Response) => {
    const { user } = req;
    if (!user) throw new AppError('Please log in again', 400);

    const bots = await userBotRepository.findByUserId(user.id, req.isDemoMode || false);

    res.status(200).json({
      status: 'success',
      data: bots
    });
  });
}

export const tradingFeaturesController = new TradingFeaturesController();
