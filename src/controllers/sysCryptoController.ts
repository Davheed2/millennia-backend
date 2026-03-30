import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { sysCryptoRepository } from '@/repository/sysCryptoRepository';

export class SysCryptoController {
	getGlobalAddress = catchAsync(async (req: Request, res: Response) => {
		const cryptoList = await sysCryptoRepository.getAll();
		if (!cryptoList || cryptoList.length === 0) {
			return AppResponse(res, 200, toJSON([{ crypto: 'BTC', address: '' }]), 'Settings retrieved successfully');
		}
		return AppResponse(res, 200, toJSON(cryptoList), 'Settings retrieved successfully');
	});

	updateGlobalAddress = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { crypto, address } = req.body;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}
		if (!address) {
			throw new AppError('Crypto Address is required', 400);
		}

		const updated = await sysCryptoRepository.upsert(crypto || 'BTC', address);
		return AppResponse(res, 200, toJSON(updated), 'Global crypto address updated successfully');
	});

	addCrypto = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { crypto, address } = req.body;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}
		if (!crypto || !address) {
			throw new AppError('Crypto name and address are required', 400);
		}

		const record = await sysCryptoRepository.create(crypto, address);
		return AppResponse(res, 201, toJSON(record), 'Crypto option added successfully');
	});

	updateCrypto = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { id } = req.params;
		const { crypto, address } = req.body;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}
		if (!id) {
			throw new AppError('Crypto ID is required', 400);
		}
		if (!crypto || !address) {
			throw new AppError('Crypto name and address are required', 400);
		}

		const existing = await sysCryptoRepository.getById(Number(id));
		if (!existing) {
			throw new AppError('Crypto option not found', 404);
		}

		const updated = await sysCryptoRepository.updateById(Number(id), crypto, address);
		return AppResponse(res, 200, toJSON(updated), 'Crypto option updated successfully');
	});

	deleteCrypto = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { id } = req.params;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}
		if (!id) {
			throw new AppError('Crypto ID is required', 400);
		}

		const existing = await sysCryptoRepository.getById(Number(id));
		if (!existing) {
			throw new AppError('Crypto option not found', 404);
		}

		await sysCryptoRepository.deleteById(Number(id));
		return AppResponse(res, 200, null, 'Crypto option deleted successfully');
	});
}

export const sysCryptoController = new SysCryptoController();
