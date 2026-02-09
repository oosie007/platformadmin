import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Subject } from 'rxjs';
import { coveragespremiumregistration, CoverageVariant, CoverageVariantResponse, CoverageVariantsResponse, CreateCoverageVariant, StandardCoverage, StandardCoverageResponse } from '../types/coverage';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class CoverageVariantService {
    protected _favoritesKey = 'coveragevariant';
    _showModal: boolean;
    _showModalUpdated = new Subject<any>();
    _deletecoverageCode: boolean;
    _deleteCoverageCodeUpdated = new Subject<any>();
    baseUrl = '/canvas/api/catalyst/products';
    productContext: ProductContext;
    country: string;
    constructor(
        private httpClient: HttpClient,
        private productContextService: ProductContextService,
    ) {
        this._productContext();
    }

    private _productContext() {
        this.productContext = this.productContextService._getProductContext();
        this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'en' ? 'en': this.productContext.language;
        this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId) ? crypto.randomUUID() : this.productContext.requestId;
        this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
    }

    getCoverageVariants(productId?: string, productVersionId?: string): Observable<CoverageVariant[]> {
        this._productContext();
        const getUrl = `${this.baseUrl}/${productId}/coveragevariants?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.get<CoverageVariantsResponse>(getUrl)
            .pipe(map((data: { data: CoverageVariant[]; }) => data.data));
    }

    createCoverageVariant(data: CreateCoverageVariant, productId?: string, productVersionId?: string): Observable<CoverageVariant> {
        this._productContext();
        const postURL = `${this.baseUrl}/${productId}/coveragevariants?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.post<CoverageVariant>(postURL, data)
            .pipe(map(res => res));
    }

    getCoverageVariant(coverageVariantId: string, productId?: string, productVersionId?: string): Observable<CoverageVariant> {
        this._productContext();
        const getURL = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.get<CoverageVariantResponse>(getURL)
            .pipe(map((data: { data: CoverageVariant; }) => data.data));
    }

    updateCoverageVariant(data: CreateCoverageVariant, coverageVariantId: string, productId?: string, productVersionId?: string): Observable<CoverageVariant> {
        this._productContext();
        const puturl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}`;
        return this.httpClient.patch<CoverageVariant>(puturl, data);
    }

    deleteCoverageVariant(id: string): Observable<boolean> {
        this._productContext();
        const deleteurl = `/canvas/api/catalyst/products/PROD17/coveragevariants/${id}?versionId=17&requestId=${this.productContext.requestId}`
        return this.httpClient.delete<boolean>(deleteurl);
    }
    //CoverageGenius - GetCoverage Genius Master Data
    getStandardCoverage(prodClassId: (string | undefined)[]): Observable<StandardCoverage[]> {
        this._productContext();
        const getURL = `${this.baseUrl}/GetCoverageMasterGeniusData?prodClass=${prodClassId}&language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
        return this.httpClient.get<StandardCoverageResponse>(getURL)
            .pipe(map((data: { data: StandardCoverage[]; }) => data.data));
    }

    //Update Standard Coverage  - With Coverage API
    updateStandardVariant(data: coveragespremiumregistration[], coverageVariantId: string, productId?: string, productVersionId?: string): Observable<coveragespremiumregistration> {
        this._productContext();
        const postUrl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/coverage?versionId=${productVersionId}`;
        return this.httpClient.post<coveragespremiumregistration>(postUrl, data);
    }
    setShowModal(value: any) {
        this._showModal = value;
        this._showModalUpdated.next(this._showModal);
    }

    deleteAllocationCode(value: any) {
        this._deletecoverageCode = value;
        this._deleteCoverageCodeUpdated.next(this._deletecoverageCode);
    }
    updateCoverageCode(
        data: coveragespremiumregistration,
        coverageVariantId: string,
        coverageId:string,
        productId?: string,
        productVersionId?: string
      ): Observable<any> {
        this._productContext();
        const putUrl = `${this.baseUrl}/${productId}/coveragevariants/${coverageVariantId}/coverages/${coverageId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.patch<CoverageVariantResponse>(putUrl, data);
      }
}
