import { Request, Response } from 'express';
import { AppError, AppResponse, sendKycEmail, toJSON, uploadKycDocumentFile, uploadPictureFile } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { kycRepository, userRepository } from '@/repository';

export class KycController {
	create = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { name, dob, nationality, address, city, postalCode, documentType } = req.body;
		const files = req.files as { [fieldname: string]: Express.Multer.File[] };

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (!name) {
			throw new AppError('Name is required', 400);
		}
		if (!dob) {
			throw new AppError('Date of birth is required', 400);
		}
		if (!nationality) {
			throw new AppError('Nationality is required', 400);
		}
		if (!address) {
			throw new AppError('Address is required', 400);
		}
		if (!city) {
			throw new AppError('City is required', 400);
		}
		if (!postalCode) {
			throw new AppError('Postal code is required', 400);
		}
		if (!documentType) {
			throw new AppError('Document Type is required', 400);
		}
		if (!files?.document?.[0]) {
			throw new AppError('Kyc Document is required', 400);
		}
		if (!files?.selfie?.[0]) {
			throw new AppError('Kyc Selfie is required', 400);
		}
		if (!files?.proofOfAddress?.[0]) {
			throw new AppError('Proof of address is required', 400);
		}

		const kycExists = await kycRepository.findByUserId(user.id);
		if (kycExists) {
			if (kycExists.status === 'pending') {
				throw new AppError('Your kyc is still being processed', 400);
			} else {
				await kycRepository.delete(kycExists.id);
			}
		}

		const { secureUrl: KycDocument } = await uploadKycDocumentFile({
			fileName: `kyc-document/${Date.now()}-${files.document[0].originalname}`,
			buffer: files.document[0].buffer,
			mimetype: files.document[0].mimetype,
		});

		const { secureUrl: KycSelfie } = await uploadPictureFile({
			fileName: `kyc-selfie/${Date.now()}-${files.selfie[0].originalname}`,
			buffer: files.selfie[0].buffer,
			mimetype: files.selfie[0].mimetype,
		});

		const { secureUrl: proofOfAddress } = await uploadKycDocumentFile({
			fileName: `kyc-address/${Date.now()}-${files.proofOfAddress[0].originalname}`,
			buffer: files.proofOfAddress[0].buffer,
			mimetype: files.proofOfAddress[0].mimetype,
		});

		const [kyc] = await kycRepository.create({
			name,
			dob,
			nationality,
			address,
			city,
			postalCode,
			documentType,
			document: KycDocument,
			selfie: KycSelfie,
			proofOfAddress,
			userId: user.id,
		});
		if (!kyc) {
			throw new AppError('Failed to submit kyc', 500);
		}

		return AppResponse(res, 201, toJSON([kyc]), 'KYC submitted successfully');
	});

	findByUserId = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}

		const userKyc = await kycRepository.findByUserId(user.id);
		if (!userKyc) {
			throw new AppError('No kyc found', 404);
		}

		return AppResponse(res, 200, toJSON([userKyc]), 'KYC retrieved successfully');
	});

	findAll = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (user.role !== 'admin') {
			throw new AppError('You are not authorized to view this', 400);
		}

		const usersKyc = await kycRepository.findAll();
		if (!usersKyc) {
			throw new AppError('No kyc found', 404);
		}

		return AppResponse(res, 200, toJSON(usersKyc), 'All KYC retrieved successfully');
	});

	update = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { userId, status } = req.body;

		if (!user) {
			throw new AppError('Please log in again', 400);
		}
		if (user.role !== 'admin') {
			throw new AppError('You are not authorized to update a users kyc', 400);
		}
		if (!userId) {
			throw new AppError('User ID is required', 404);
		}
		if (!status) {
			throw new AppError('Status is required', 404);
		}

		const findUser = await userRepository.findById(userId);
		if (!findUser) {
			throw new AppError('User not found', 404);
		}

		const kyc = await kycRepository.findByUserId(userId);
		if (!kyc) {
			throw new AppError('No kyc found for this user', 404);
		}

		const updateKyc = await kycRepository.update(kyc.id, {
			status,
		});
		await userRepository.update(userId, {
			isKycVerified: true,
		});
		if (!updateKyc) {
			throw new AppError('Failed to update user kyc', 500);
		}

		await sendKycEmail(findUser.email, findUser.firstName, status);
		return AppResponse(res, 200, toJSON(updateKyc), 'User KYC approved successfully');
	});
}

export const kycController = new KycController();
