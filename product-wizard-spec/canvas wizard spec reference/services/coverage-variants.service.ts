/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient ,HttpHeaders} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  GenericService,
  ReferenceDataProvider,
  REFERENCE_DATA,
} from '@canvas/metadata/services';
import { AppContextService } from '@canvas/services';
import { HttpCacheManager } from '@ngneat/cashew';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { map, Observable, Subject } from 'rxjs';
import {
  InsuredData,
  InsuredResponse,
} from '../home/coverageVariant/insured-type/insured-type.component';
import {
  CoverageVariant,
  CoverageVariantInsured,
  CoverageVariantResponse,
  CoverageVariantsResponse,
  StandardCoverage,
  StandardCoverageResponse,
} from '../types/coverage';
import { ProductContext } from '../types/product-context';
import { ProductContextService } from './product-context.service';

@Injectable({ providedIn: 'root' })
export class CoverageVariantsService extends GenericService<CoverageVariant> {
  protected _favoritesKey = 'coveragevariant';
  productContext: ProductContext;
  country: string;
  baseUrl = '/canvas/api/catalyst/products';
  _showModal: boolean;
  _showModalUpdated = new Subject<any>();
  _deletecombination: boolean;
  _deleteCombinationUpdated = new Subject<any>();
  constructor(
    protected readonly httpClient: HttpClient,
    httpCacheManager: HttpCacheManager,
    @Inject(REFERENCE_DATA)
    protected override readonly _referenceDataService: ReferenceDataProvider,
    private productContextService: ProductContextService,
    protected readonly appContext: AppContextService
  ) {
    super(
      httpClient,
      httpCacheManager,
      _referenceDataService,
      `/canvas/api/catalyst/products/{{productId}}/coveragevariants?versionId=1.0&requestId=1`
    );
    this._productContext();
  }

  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.language =
      isEmpty(this.productContext.language) ||
      isNull(this.productContext.language) ||
      isUndefined(this.productContext.language) ||
      this.productContext.language == 'en'
        ? 'en'
        : this.productContext.language;
    this.productContext.requestId =
      isEmpty(this.productContext.requestId) ||
      isNull(this.productContext.requestId) ||
      isUndefined(this.productContext.requestId)
        ? crypto.randomUUID()
        : this.productContext.requestId;
    this.country = this.productContext.country?.[0];
  }

  getCoverageVariants(
    productId?: string,
    productVersionId?: string
  ): Observable<CoverageVariant[]> {
    this._productContext();
    const getUrl = `${this.baseUrl}/${productId}/coveragevariants?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.get<CoverageVariantsResponse>(getUrl).pipe(
      map((response: CoverageVariantsResponse) => {
        return response.data;
      })
    );
  }

  createCoverageVariant(
    data: CoverageVariant,
    productId?: string,
    productVersionId?: string
  ): Observable<CoverageVariant> {
    this._productContext();
    const postURL = `${this.baseUrl}/${productId}/coveragevariants?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .post<CoverageVariantResponse>(postURL, data)
      .pipe(map((res: CoverageVariantResponse) => res.data));
  }

  createCombination(
    data: InsuredData,
    productId: string,
    coverVariantId: string,
    productVersionId: string
  ): Observable<InsuredData> {
    this._productContext();
    const postURL = `${this.baseUrl}/${productId}/coveragevariants/${coverVariantId}/insured?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .patch<InsuredResponse>(postURL, data)
      .pipe(map((res: InsuredResponse) => res.data));
  }
  editCombination(
    data: CoverageVariantInsured,
    productId: string,
    coverVariantId: string,
    productVersionId: string
  ): Observable<InsuredData> {
    this._productContext();
    const postData = { ...data, requestId: '1' };
    const postURL = `${this.baseUrl}/${productId}/coveragevariants/${coverVariantId}/insured?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .patch<InsuredResponse>(postURL, postData)
      .pipe(map((res: InsuredResponse) => res.data));
  }
  getCoverageVariant(
    coverageVariantId: string,
    productId?: string,
    productVersionId?: string
  ): Observable<CoverageVariant> {
    this._productContext();
    const getURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<CoverageVariantResponse>(getURL)
      .pipe(map((response: CoverageVariantResponse) => response.data));
  }
  getInsuredData(
    coverageVariantId: string,
    productId?: string,
    productVersionId?: string
  ): Observable<CoverageVariant> {
    this._productContext();
    const getURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<CoverageVariantResponse>(getURL)
      .pipe(map((response: CoverageVariantResponse) => response.data));
  }

  async updateCoverageVariant(
    data: CoverageVariant,
    coverageVariantId: string,
    productId?: string,
    productVersionId?: string
  ): Promise<Observable<any>> {
    this._productContext();
    const putUrl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.patch<CoverageVariantResponse>(putUrl, data);
  }

  deleteCoverageVariant(
    id: string,
    productId?: string,
    productVersionId?: string
  ): Observable<unknown> {
    this._productContext();
    const deleteurl = `/canvas/api/catalyst/products/${productId}/coveragevariants/${id}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.delete(deleteurl);
  }

  getStandardCoverage(prodClassId?: string): Observable<StandardCoverage[]> {
    this._productContext();
    const getURL = `${this.baseUrl}/GetCoverageMasterGeniusData?prodClass=${prodClassId}&language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<StandardCoverageResponse>(getURL)
      .pipe(map((response: StandardCoverageResponse) => response.data));
  }

  //Update Standard Coverage  - With Coverage API
  updateStandardVariant(
    data: StandardCoverage, // Adjust this type based on the structure of your data
    coverageVariantId: string,
    productId?: string,
    productVersionId?: string
  ): Observable<StandardCoverageResponse> {
    this._productContext();
    const postUrl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/coverage?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.post<StandardCoverageResponse>(postUrl, data);
  }
  setShowModal(value: any) {
    this._showModal = value;
    this._showModalUpdated.next(this._showModal);
  }

  deleteCombination(value: any) {
    this._deletecombination = value;
    this._deleteCombinationUpdated.next(this._deletecombination);
  }

  deleteInsuredCombination(
    id: string,
    productId: string,
    productVersionId: string
  ): Observable<boolean> {
    this._productContext();
    const deleteurl = `${this.baseUrl}/${productId}/coveragevariants/${id}/insured?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.delete<boolean>(deleteurl);
  }
  updateCoverageVariantAllocation(data: any): Observable<any> {
    this._productContext();
    const putUrl = `${this.baseUrl}/${this.productContext.productId}/coverage-variants?versionId=${this.productContext.productVersionId}`;
    return this.httpClient.patch<CoverageVariantsResponse>(putUrl, data);
  }

}
