export interface IWishlist {
    id: string;
    userId: string;
    name: string;
    brand: string;
    symbol: string;
    isDeleted: boolean;
    created_at?: Date;
	updated_at?: Date;
}