// referralService.ts
import { BonusType } from '@/common/constants';
import { userRepository, referralRepository, bonusTransactionRepository, walletRepository } from '@/repository';
import { Transaction } from './Transaction';
import { referenceGenerator } from '@/common/utils';
class ReferralService {
	// Track a new referral when someone signs up with a referral code
	async trackReferral(referrerCode: string, newUserId: string, firstName: string, lastName: string, email: string) {
		// Find the referrer by their code
		const referrer = await userRepository.findByReferralCode(referrerCode);

		if (!referrer) {
			throw new Error('Invalid referral code');
		}

		// Create the referral record
		await referralRepository.create({
			referrerId: referrer.id,
			referreeId: newUserId,
			referreeFirstName: firstName,
			referreeLastName: lastName,
			referreeEmail: email,
			hasInvested: false,
		});

		return true;
	}

	// When a referree makes their first investment
	async processReferralInvestment(userId: string) {
		// Find the referral by referree ID
		const referral = await referralRepository.findByReferreeId(userId);

		if (!referral || referral.hasInvested) {
			return false; // No referral or already processed
		}

		// Update the referral record
		await referralRepository.updateReferreeInvestmentStatus(userId, true);

		// Award $50 to both users
		await this.awardReferralBonus(referral.referrerId, userId, referral.id, 50);

		// Check if the referrer has reached 5 successful referrals
		const investedCount = await referralRepository.countInvestedByReferrerId(referral.referrerId);

		if (investedCount === 5) {
			// Award $250 bonus to referrer
			await this.awardMilestoneBonus(referral.referrerId, 250);
		}

		return true;
	}

	// Helper methods to award bonuses
	private async awardReferralBonus(referrerId: string, referreeId: string, referralId: string, amount: number) {
		// Create bonus transaction for referrer
		await bonusTransactionRepository.create({
			userId: referrerId,
			referralId,
			bonusType: BonusType.REFERRAL_BONUS,
			amount,
			notes: `Referral bonus for successful referral`,
		});

		// Create bonus transaction for referee
		await bonusTransactionRepository.create({
			userId: referreeId,
			referralId,
			bonusType: BonusType.REFEREE_BONUS,
			amount,
			notes: `Bonus for signing up through referral and investing`,
		});

		let referrerBalance = await walletRepository.findByUserId(referrerId);
		if (!referrerBalance || referrerBalance.length === 0) {
			referrerBalance = await walletRepository.create({
				userId: referrerId,
			});
		}
		await walletRepository.update(referrerBalance[0].id, {
			portfolioBalance: (referrerBalance[0].portfolioBalance += amount),
		});
		const reference = referenceGenerator();
		await Transaction.add({
			userId: referrerId,
			amount,
			type: 'Deposit',
			description: 'Referral Bonus Reward',
			reference,
		});

		let referreeBalance = await walletRepository.findByUserId(referreeId);
		if (!referreeBalance || referreeBalance.length === 0) {
			referreeBalance = await walletRepository.create({
				userId: referreeId,
			});
		}
		await walletRepository.update(referreeBalance[0].id, {
			portfolioBalance: (referreeBalance[0].portfolioBalance += amount),
		});

		const reference2 = referenceGenerator();
		await Transaction.add({
			userId: referreeId,
			amount,
			type: 'Deposit',
			description: 'Referral Bonus Reward',
			reference: reference2,
		});
	}

	private async awardMilestoneBonus(userId: string, amount: number) {
		await bonusTransactionRepository.create({
			userId,
			bonusType: BonusType.MILESTONE_BONUS,
			amount,
			notes: `Milestone bonus for 5 successful referrals`,
		});
	}

	// Get referral progress for a user
	async getReferralStats(userId: string) {
		const referrals = await referralRepository.findByReferrerId(userId);
		const investedReferrals = referrals.filter((r) => r.hasInvested);

		return {
			totalReferrals: referrals.length,
			investedReferrals: investedReferrals.length,
			remainingForBonus: Math.max(0, 5 - investedReferrals.length),
			earnedBonus: investedReferrals.length >= 5,
		};
	}

	async checkBonusesAwardedForReferral(referralId: string): Promise<boolean> {
		const transactions = await bonusTransactionRepository.findByReferralId(referralId);
		const referrerBonus = transactions.find((t) => t.bonusType === BonusType.REFERRAL_BONUS);
		const refereeBonus = transactions.find((t) => t.bonusType === BonusType.REFEREE_BONUS);

		return Boolean(referrerBonus && refereeBonus);
	}
}

export const referralService = new ReferralService();
