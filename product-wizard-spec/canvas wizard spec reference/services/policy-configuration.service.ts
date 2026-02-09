import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MasterData } from '../types/product';
import { MasterDataResponse } from '../types/master-data';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { Category } from '../types/ref-data';
@Injectable({
  providedIn: 'root',
})
export class PolicyConfigurationService {
  
  productContext: ProductContext;
  country: string;
  constructor(private http: HttpClient, private productContextService: ProductContextService) {
    this._productContext();
  }

  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'en' ? 'en': this.productContext.language;
    this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId)? crypto.randomUUID() : this.productContext.requestId;
    this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
  }

  public getPolicyType(): Observable<MasterData[]> {
      this._productContext();
    const policy_url =
    `/canvas/api/catalyst/reference-data/${Category.POLTYPE}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(policy_url).pipe(map((res) => res.data));
  }
  public getRefundType(): Observable<MasterData[]> {
    this._productContext();
    const refund_url =
    `/canvas/api/catalyst/reference-data/${Category.RFDTYPE}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(refund_url).pipe(map((res) => res.data));
  }
  public getRefundValueType(): Observable<MasterData[]> {
    this._productContext();
    const refundValue_url =
    `/canvas/api/catalyst/reference-data/${Category.RFDVAL}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(refundValue_url).pipe(map((res) => res.data));
  }
  public getRefundFreqType(): Observable<MasterData[]> {
    this._productContext();
    const frequency_url =
    `/canvas/api/catalyst/reference-data/${Category.REFREQTY}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(frequency_url).pipe(map((res) => res.data));
  }
  public getPolicyPeriodType(): Observable<MasterData[]> {
    this._productContext();
    const policyperiod_url =
    `/canvas/api/catalyst/reference-data/${Category.POLPDTYPE}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(policyperiod_url).pipe(map((res) => res.data));
  }
  public getTaxCharge(): Observable<MasterData[]> {
    this._productContext();
    const taxCharge_url =
    `/canvas/api/catalyst/reference-data/${Category.PMTAX}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(taxCharge_url).pipe(map((res) => res.data));
  }
  public getTermend(): Observable<MasterData[]> {
    this._productContext();
    const term_url =
    `/canvas/api/catalyst/reference-data/${Category.TERMOPTION}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(term_url).pipe(map((res) => res.data));
  }
  public getRenewalType(): Observable<MasterData[]> {
    this._productContext();
    const renewal_url =
    `/canvas/api/catalyst/reference-data/${Category.RENTYP}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(renewal_url).pipe(map((res) => res.data));
  }
  public getPolicyNumberRenewal(): Observable<MasterData[]> {
    this._productContext();
    const policyNumber_url =
    `/canvas/api/catalyst/reference-data/${Category.POLNUM}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.http.get<MasterDataResponse>(policyNumber_url).pipe(map((res) => res.data));
  }
 
}