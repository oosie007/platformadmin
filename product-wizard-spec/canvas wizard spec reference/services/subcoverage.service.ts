import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Coverage, CoverageResponse } from '../types/insuredCombination-data';
import { SubCoverage, SubCoverageResponse } from '../types/sub-coverage';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';


@Injectable({
  providedIn: 'root',
})
export class SubcoverageService {
  productContext: ProductContext;
    country: string;
    
    constructor(
        private http: HttpClient,
        private _productContextService: ProductContextService
    ) { 
        this._productContext();
    }
    
    private _productContext() {
        this.productContext = this._productContextService._getProductContext();
        this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId)? crypto.randomUUID(): this.productContext.requestId;
        this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
        this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'en' ? 'en': this.productContext.language;
      }


  getSubcoverages(productId: string, coverageVariantId: string, productVersionId: string): Observable<Coverage> {
    const getsubcoverages_url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
    .get<Coverage>(getsubcoverages_url)
    .pipe(
      map((response: Coverage) => response)
    );
  }
 
  public getsubCoverageById(subCoverId :string,productId: string, coverageVariantId: string, productVersionId: string,): Observable<SubCoverage> {
    const url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.get<SubCoverage>(url)
    .pipe(
      map((response: SubCoverage) => response)
    );
  }

 
  public addSubCoverage(
    productId: string, coverageVariantId: string, productVersionId: string,
    formSubmitData: SubCoverage
  ): Observable<SubCoverageResponse> {
    const url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<SubCoverageResponse>(url, formSubmitData);
  }

  public editSubCoverage(
    
    formSubmitData: SubCoverage,subCoverId :string,productId: string, coverageVariantId: string, productVersionId: string,
  ): Observable<SubCoverage> {
    const url = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.patch<SubCoverage>(url, formSubmitData);
  }
 public deleteSubCoverage(productId:string,productVersionId:string,coverageVariantId:string, subCoverageId: string): Observable<boolean> {
    const deleteurl = `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverageId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`
    return this.http.delete<boolean>(deleteurl);
}
  
}