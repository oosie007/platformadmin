import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CoverageFactor,
  CoverageFactorsResponse,
} from '../types/coverageFactors';
import { ProductContext } from '../types/product-context';
import { ProductContextService } from './product-context.service';
@Injectable({
  providedIn: 'root',
})
export class CoverageFactorsService {
  baseUrl = '/canvas/api/catalyst';

  productContext: ProductContext;
  country: string;
  constructor(
    private http: HttpClient,
    private productContextService: ProductContextService
  ) {
    this.productContext = this.productContextService._getProductContext();
  }

  public createCoverageFactors(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    body: CoverageFactor[]
  ): Observable<CoverageFactor[]> {
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/coveragefactors?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .post<CoverageFactorsResponse>(url, body)
      .pipe(map((res: CoverageFactorsResponse) => res.data));
  }

  public updateCoverageFactors(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    body: CoverageFactor[]
  ): Observable<CoverageFactor[]> {
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/coveragefactors?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .patch<CoverageFactorsResponse>(url, body)
      .pipe(map((res: CoverageFactorsResponse) => res.data));
  }
}
