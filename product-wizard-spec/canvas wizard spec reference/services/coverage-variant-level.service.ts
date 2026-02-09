import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  GenericService,
  ReferenceDataProvider,
  REFERENCE_DATA,
} from '@canvas/metadata/services';
import { AppContextService } from '@canvas/services';
import { HttpCacheManager } from '@ngneat/cashew';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { map, Observable } from 'rxjs';
import {
  CoverageVariantLevel,
  CoverageVariantLevelResponse,
} from '../types/coverage-variant-level';
import { ProductContext } from '../types/product-context';
import { ProductContextService } from './product-context.service';

@Injectable({ providedIn: 'root' })
export class CoverageVariantLevelService extends GenericService<CoverageVariantLevel> {
  productContext: ProductContext;
  country: string;
  baseUrl = `/canvas/api/catalyst/products`;
  constructor(
    protected readonly httpClient: HttpClient,
    httpCacheManager: HttpCacheManager,
    @Inject(REFERENCE_DATA)
    protected override readonly _referenceDataService: ReferenceDataProvider,
    protected readonly appContext: AppContextService,
    private productContextService: ProductContextService
  ) {
    super(
      httpClient,
      httpCacheManager,
      _referenceDataService,
      `/canvas/api/catalyst/products`
    );
    this._productContext();
  }

  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.requestId =
      isEmpty(this.productContext.requestId) ||
      isNull(this.productContext.requestId) ||
      isUndefined(this.productContext.requestId)
        ? crypto.randomUUID()
        : this.productContext.requestId;
    this.country = this.productContext.country?.[0];
    this.productContext.language =
      isEmpty(this.productContext.language) ||
      isNull(this.productContext.language) ||
      isUndefined(this.productContext.language) ||
      this.productContext.language == 'en'
        ? 'en'
        : this.productContext.language;
  }

  getCoverageVariantLevels(
    productId?: string,
    coverageVariantId?: string,
    productVersionId?: string
  ): Observable<CoverageVariantLevel[]> {
    const getUrl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/variantlevels?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.get<CoverageVariantLevelResponse>(getUrl).pipe(
      map((response: CoverageVariantLevelResponse) => {
        return response.data;
      })
    );
  }

  createCoverageVariantLevels(
    data: CoverageVariantLevel[],
    productId?: string,
    coverageVariantId?: string,
    productVersionId?: string
  ): Observable<CoverageVariantLevel[]> {
    const postURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/variantlevels?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .post<CoverageVariantLevelResponse>(postURL, data)
      .pipe(map((res: CoverageVariantLevelResponse) => res.data));
  }

  updateCoverageVariantLevel(
    data: CoverageVariantLevel,
    productId?: string,
    coverageVariantId?: string,
    productVersionId?: string,
    coverageVariantLevelId?: string
  ): Observable<boolean> {
    const patchURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/variantlevels/${coverageVariantLevelId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.patch<boolean>(patchURL, data).pipe(
      map((res: boolean) => {
        return res;
      })
    );
  }

  deleteCoverageVariantLevel(
    productId: string,
    coverageVariantId: string,
    productVersionId: string,
    coverageVariantLevelId: string
  ): Observable<boolean> {
    const deleteURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/variantlevels/${coverageVariantLevelId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.delete<boolean>(deleteURL).pipe(
      map((res: boolean) => {
        return res;
      })
    );
  }
}
