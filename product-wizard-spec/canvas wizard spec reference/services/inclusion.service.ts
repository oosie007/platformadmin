import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { Observable, map } from 'rxjs';

import { Inclusion, InclusionPostResponse, InclusionRequest, InclusionResponse } from '../types/inclusion';
import { ProductContext } from '../types/product-context';
import { ProductContextService } from './product-context.service';
@Injectable({
  providedIn: 'root',
})
export class InclusionService{
  
  productContext: ProductContext;
  country: string;

  constructor(private http: HttpClient, private productContextService: ProductContextService) {
    this._productContext();
  }

  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'en' ? 'en': this.productContext.language;
    this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId) ? crypto.randomUUID() : this.productContext.requestId;
    this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
  }
 
  public getInclusions(
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<Inclusion[]> {
    const getinclusion_url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/inclusions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
    .get<InclusionResponse>(getinclusion_url)
      .pipe(map((res:InclusionResponse) => res.data));
  }

  public createInclusion(
    addInclusion: InclusionRequest,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<InclusionPostResponse> {
    const postURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/inclusions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<InclusionPostResponse>(postURL, addInclusion);
  }
  public updateInclusion(
    updateInclusion: Inclusion,
    productId: string,
    coverageVariantId: string,
    productVersionId: string,
    inclusionId:string
  ): Observable<InclusionPostResponse> {
    const putURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/inclusions/${inclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.put<InclusionPostResponse>(putURL, updateInclusion);
  }
  public getInclusionbyId(
    inclusionId: string,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<Inclusion> {
    const postURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/inclusions/${inclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.get<Inclusion>(postURL);
  }

  public deleteInclusion(
    inclusionId: string,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<boolean> {
    const deleteURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/inclusions/${inclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.delete<boolean>(deleteURL);
  }
}