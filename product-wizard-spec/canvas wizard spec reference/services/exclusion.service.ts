import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Exclusion, ExclusionPostResponse, ExclusionRequest, ExclusionResponse } from '../types/exclusion';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
@Injectable({
  providedIn: 'root',
})
export class ExclusionService{
  
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
 
  public getexclusions(
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<Exclusion[]> {
    const getexclusion_url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/exclusions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
    .get<ExclusionResponse>(getexclusion_url)
      .pipe(map((res:ExclusionResponse) => res.data));
  }

  public createExclusion(
    addExclusion: ExclusionRequest,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<ExclusionPostResponse> {
    const postURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/exclusions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<ExclusionPostResponse>(postURL, addExclusion);
  }
  public updateExclusion(
    updateExclusion: Exclusion,
    productId: string,
    coverageVariantId: string,
    productVersionId: string,
    exclusionId:string
  ): Observable<ExclusionPostResponse> {
    const putURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/exclusions/${exclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.put<ExclusionPostResponse>(putURL, updateExclusion);
  }
  public getExclusionbyId(
    exclusionId: string,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<Exclusion> {
    const postURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/exclusions/${exclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.get<Exclusion>(postURL);
  }

  public deleteExclusion(
    exclusionId: string,
    productId: string,
    coverageVariantId: string,
    productVersionId: string
  ): Observable<boolean> {
    const deleteURL = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/exclusions/${exclusionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.delete<boolean>(deleteURL);
  }
  
}