import { Request, Response, NextFunction } from 'express';

export const extractDemoMode = (req: Request, res: Response, next: NextFunction) => {
	const demoHeader = req.headers['x-demo-mode'];
	req.isDemoMode = demoHeader === 'true';
	next();
};
