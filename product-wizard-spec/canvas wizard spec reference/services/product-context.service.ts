import { Injectable } from '@angular/core';
import { AuthService } from '@canvas/shared/data-access/auth';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { messageKey, ProductHeader, Statuskeys } from '../types/product';
import { coverageVariantData, ProductContext } from '../types/product-context';
@Injectable({
  providedIn: 'root',
})
export class ProductContextService {
  /**
   * selectedProductId$ holds the selected product id
   */
  selectedProductId$: BehaviorSubject<string> = new BehaviorSubject('');
  /**
   * coverageVariantId$ holds the coverageVariant id
   */
  coverageVariantId$: BehaviorSubject<string> = new BehaviorSubject('');

  productLock = false;
  productHeader: ProductHeader;

  constructor(private readonly _authService: AuthService) {}

  _getProductContext(): ProductContext {
    const product = localStorage.getItem('productContext');
    const {
      productId,
      productVersionId,
      requestId,
      country,
      language,
      status,
    } = JSON.parse(product ?? '{}');
    return {
      productId: productId ?? '',
      productVersionId: productVersionId ?? '',
      country: country ?? ['IE'],
      requestId: (requestId ?? '') !== '' ? requestId : uuidv4(),
      language: language ?? 'en',
      status: status ?? '',
    };
  }

  _setProductContext(
    productId: string,
    productVersionId: string,
    requestId: string,
    country: string[],
    language: string[],
    status: string
  ) {
    localStorage.removeItem('productContext');
    const productContext = {
      productId: productId ?? '',
      productVersionId: productVersionId ?? '',
      country: country ?? '',
      requestId: requestId ?? '',
      language: 'en',
      status: status ?? '',
    };
    localStorage.setItem('productContext', JSON.stringify(productContext));
    this._setProductId(productId);
  }

  _setProductVersions(versions: { versionId: string; status: messageKey }[]) {
    localStorage.removeItem('productVersions');
    const currProd = this._getProductId;
    localStorage.setItem(
      'productVersions',
      JSON.stringify({
        productId: currProd,
        versions,
      })
    );
  }

  _getProductVersions(): {
    productId: string;
    versions: { versionId: string; status: messageKey }[];
  } {
    const productVersions = localStorage.getItem('productVersions');
    const { productId, versions } = JSON.parse(productVersions ?? '{}');
    return {
      productId: productId ?? '',
      versions,
    };
  }

  _setProductId(productId: string) {
    const idContext = {
      productId: productId ?? '',
      availabilityId: '',
      coverageVariantId: '',
      productAggregateLimitValue: 0,
      productAggregateLimitType: '',
      productAggregatePercentageType: '',
      productAggregateMaxValue: 0,
      coverageVariantData:null,
      isPartnerProvidedPremium:false,
      productClass:''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
    this.selectedProductId$.next(productId);
  }

  _getProductId(): string {
    const ids = localStorage.getItem('idContext');
    const { productId } = JSON.parse(ids ?? '');
    return productId;
  }

  _setCoverageVariantId(coverageVariantId: string) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      productAggregateLimitValue,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateMaxValue,
      coverageVariantData,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue ?? 0,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue ?? 0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium:isPartnerProvidedPremium ?? false,
      productClass:productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
    this.coverageVariantId$.next(coverageVariantId);
  }

  _getCoverageVariantId() {
    const ids = localStorage.getItem('idContext');
    const { coverageVariantId } = JSON.parse(ids ?? '');
    return coverageVariantId;
  }

  _getCoverageVariantName() {
    return localStorage.getItem('coverageVariantName') ?? '';
  }

  _setAvailabilityId(availabilityId: string) {
    const ids = localStorage.getItem('idContext');
    const { productId } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: '',
      productAggregatePercentageType: '',
      productAggregateLimitType: '',
      productAggregateLimitValue: 0,
      productAggregateMaxValue: 0,
      coverageVariantData:null,
      isPartnerProvidedPremium:false,
      productClass:''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getAvailabilityId() {
    const ids = localStorage.getItem('idContext');
    const { availabilityId } = JSON.parse(ids ?? '');
    return availabilityId;
  }

  _setProductAggregateLimitValue(productAggregateLimitValue: number) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateMaxValue,
      coverageVariantData,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue ?? 0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium:isPartnerProvidedPremium ?? false,
      productClass:productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getProductAggregateLimitValue() {
    const ids = localStorage.getItem('idContext');
    const { productAggregateLimitValue } = JSON.parse(ids ?? '');
    return productAggregateLimitValue;
  }
  _setProductAggregateLimitType(productAggregateLimitType: string) {
    const ids = localStorage.getItem('idContext');
    if (productAggregateLimitType == undefined) {
      productAggregateLimitType = '';
    }
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitValue,
      productAggregatePercentageType,
      productAggregateMaxValue,
      coverageVariantData,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue ?? '',
      productAggregateLimitType: productAggregateLimitType,
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue ?? 0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium:isPartnerProvidedPremium ?? false,
      productClass: productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getProductAggregateLimitType() {
    const ids = localStorage.getItem('idContext');
    const { productAggregateLimitType } = JSON.parse(ids ?? '');
    return productAggregateLimitType;
  }

  _setproductAggregatePercentageType(productAggregatePercentageType: string) {
    if (productAggregatePercentageType == undefined) {
      productAggregatePercentageType = '';
    }
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitValue,
      productAggregateLimitType,
      productAggregateMaxValue,
      coverageVariantData,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue ?? '',
      productAggregateLimitType: productAggregateLimitType,
      productAggregatePercentageType: productAggregatePercentageType,
      productAggregateMaxValue: productAggregateMaxValue ?? 0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium:isPartnerProvidedPremium??false,
      productClass: productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getproductAggregatePercentageType() {
    const ids = localStorage.getItem('idContext');
    const { productAggregatePercentageType } = JSON.parse(ids ?? '');
    return productAggregatePercentageType;
  }

  _setProductAggregateMaxValue(productAggregateMaxValue: number) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateLimitValue,
      coverageVariantData,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium:isPartnerProvidedPremium ?? false,
      productClass: productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getProductAggregateMaxValue() {
    const ids = localStorage.getItem('idContext');
    const { productAggregateMaxValue } = JSON.parse(ids ?? '');
    return productAggregateMaxValue;
  }

  _setCoverageVariantData(coverageVariantData: coverageVariantData) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateLimitValue,
      productAggregateMaxValue,
      isPartnerProvidedPremium,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue??0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium : isPartnerProvidedPremium ?? false,
      productClass: productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getCoverageVariantData() {
    const ids = localStorage.getItem('idContext');
    const { coverageVariantData } = JSON.parse(ids ?? '');
    return coverageVariantData;
  }

  _setPartnerProvidedData(isPartnerProvidedPremium: boolean) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateLimitValue,
      productAggregateMaxValue,
      coverageVariantData,
      productClass
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue??0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium : isPartnerProvidedPremium,
      productClass : productClass ?? ''
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getPartnerProvidedData() {
    const ids = localStorage.getItem('idContext');
    const { isPartnerProvidedPremium } = JSON.parse(ids ?? '');
    return isPartnerProvidedPremium;
  }

  _setProductClass(productClass: string) {
    const ids = localStorage.getItem('idContext');
    const {
      productId,
      availabilityId,
      coverageVariantId,
      productAggregateLimitType,
      productAggregatePercentageType,
      productAggregateLimitValue,
      productAggregateMaxValue,
      coverageVariantData,
      isPartnerProvidedPremium
    } = JSON.parse(ids ?? '{}');

    const idContext = {
      productId: productId ?? '',
      availabilityId: availabilityId ?? '',
      coverageVariantId: coverageVariantId ?? '',
      productAggregateLimitValue: productAggregateLimitValue,
      productAggregateLimitType: productAggregateLimitType ?? '',
      productAggregatePercentageType: productAggregatePercentageType ?? '',
      productAggregateMaxValue: productAggregateMaxValue??0,
      coverageVariantData:coverageVariantData??null,
      isPartnerProvidedPremium : isPartnerProvidedPremium ?? false,
      productClass : productClass
    };
    localStorage.removeItem('idContext');
    localStorage.setItem('idContext', JSON.stringify(idContext));
  }

  _getProductClass() {
    const ids = localStorage.getItem('idContext');
    const { productClass } = JSON.parse(ids ?? '');
    return productClass;
  }
  _isCurrVersionNew() {
    const product = this._getProductContext();
    const allVersions = this._getProductVersions().versions;
    const versMeta = allVersions.find(
      (vers) => vers.versionId === product.productVersionId
    );
    return (
      versMeta &&
      versMeta.status.value !== Statuskeys.FINAL &&
      versMeta.status.value !== Statuskeys.DELETE &&
      allVersions.some((vers) => vers.status.value === Statuskeys.FINAL)
    );
  }

  setProductLock(status: boolean): void {
    this.productLock = status;
  }

  setProductHeader(productHeader: ProductHeader): void {
    this.productHeader = productHeader;
    this.setProductLock(this.productHeader.lockStatus ?? false);
  }

  isProductLocked(): boolean {
    return this.productLock;
  }

  isProductDisabled(): boolean {
    return (
      this._getProductContext().status === Statuskeys.FINAL ||
      this.isReadonlyProduct()
    );
  }

  /**
   * Method to check product is editable or readonly
   *
   * @returns {boolean}
   */

  isReadonlyProduct(): boolean {
    if (!this.productLock) {
      return false;
    }
    const userEntitlement = this._authService.userEntitlements;
    // Check if any of these conditions are true
    const canEdit =
      userEntitlement?.entitlements?.UpdateLockStatus?.enabled ||
      userEntitlement?.name?.toLocaleLowerCase() ===
        this.productHeader?.createdBy?.toLocaleLowerCase() ||
      (this.productHeader?.allowedLockStatusUsers?.includes(
        userEntitlement?.name
      ) ??
        false);
    // If canEdit is true, the product is not read-only; otherwise, it is read-only
    return !canEdit; // Return true for read-only, false for editable
  }

  getToastMessage(isCurrentVersion = false) {
    const toastMessage = {
      warning: {
        severity: 'info',
        message: 'Changes are not allowed as product is in Final status',
        duration: 5000,
      },
    };
    if (isCurrentVersion) {
      toastMessage.warning.message =
        'Changes are not allowed as product was inherited from the previous version of the product';
    } else if (this.isReadonlyProduct()) {
      toastMessage.warning.message =
        'Changes are not allowed as product is in Lock status';
    }

    return toastMessage;
  }

  removeLocalStorage(): void {
    localStorage.removeItem('productContext');
    localStorage.removeItem('productId');
    localStorage.removeItem('productVersions');
    localStorage.removeItem('idContext');
  }
}
