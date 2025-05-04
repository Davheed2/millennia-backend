import multer from 'multer';

/**
 * Multer configuration for file uploads
 */
const multerStorage = multer.memoryStorage();

export const multerUpload = multer({
	storage: multerStorage,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit for all file uploads
	},
});
