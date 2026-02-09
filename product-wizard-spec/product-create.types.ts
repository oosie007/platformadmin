/**
 * Types for Product Creation wizard (Step 1 payload and UI).
 * Use these for form state and for the eventual API request body.
 */

export interface messageKey {
    value?: string;
    category?: string;
    code?: string;
  }
  
  export interface MasterData {
    id?: string;
    description?: string;
    rank?: number;
    code?: string;
    disabled?: boolean;
  }
  
  export interface ProductHeader {
    productName?: string;
    productVersionName?: string;
    shortName?: string;
    description: string;
    marketingName?: string;
    status?: messageKey;
    premiumCurrency?: messageKey;
    limitsCurrency?: messageKey | null;
    effectiveDate?: Date;
    expiryDate?: Date;
    country?: string[];
  }
  
  export interface ProductRequest {
    productId: string;
    productVersionId: string;
    header: ProductHeader;
    requestId: string;
    rating: {
      premiumRatingFactors?: string[];
    };
  }
  
  export interface ProductModel {
    productName: string;
    productId: string;
    productDescription: string;
    effectiveDate: Date;
    expiryDate: Date;
    status: string;
    productVersion: string;
    premiumCurrency: string;
    limitsCurrency: string;
    country: string[];
    requestId: string;
  }
  
  export enum Statuskeys {
    FINAL = 'FINAL',
    DESIGN = 'DESIGN',
    DELETE = 'DELETE',
    WITHDRAW = 'WITHDRAW',
  }
  
  export enum Category {
    PRODUCTSTATUS = 'PRODUCTSTATUS',
    CURRENCY = 'CURRENCY',
  }