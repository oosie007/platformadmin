import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CoherentInputData,  CoherentMappingResponse, CoherentQuestionRequest, MappingPayload, RatingEndpoint, RatingEndpointResponse, SaveMappingResponse } from '../types/coherent-mapping';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
@Injectable({ providedIn: 'root' })
export class CoherentMappingService {

  productContext: ProductContext;
  country: string;
  // endpoint =
    // 'https://excel.uat.jp.coherent.global/chubb-sg/api/v3/folders/TestKap/services/SPP Blink Rate Calculator/Validation';

  constructor(private httpClient: HttpClient,
    @Inject(ProductContextService) private productContextService: ProductContextService
    ) {

    this._productContext();
  }
  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'enl' ? 'en': this.productContext.language;
    this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId)? crypto.randomUUID() : this.productContext.requestId;
    this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
  }

  /* service to fetch the data from coherent to map with system X */
  public getCoherentList(endpoint: string): Observable<string[]> {
    const base_url = `/canvas/api/catalyst/reference-data/coherent-inputs?endPoint=${endpoint}&country=${this.country}&requestId=${this.productContext.requestId}&language=${this.productContext.language}`;
    return this.httpClient.get<string[]>(base_url);
  }

  public create(
    data: CoherentQuestionRequest,
    productId: string,
    productVersionId: string
  ): Observable<CoherentInputData> {
    const postURL = `/canvas/api/catalyst/products/${productId}/ratings/premium/inputmappings?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .post<CoherentMappingResponse>(postURL, data)
      .pipe(map((res) => res.data));
  }

  public getCoherentQuestionList(
    productId: string,
    productVersionId: string
  ): Observable<CoherentMappingResponse> {
    const product_url = `/canvas/api/catalyst/products/${productId}/ratings/premium/inputmappings?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.get<CoherentMappingResponse>(product_url);
  }
  public getRatingEndpoints(productClasses: string): Observable<RatingEndpoint[]> {
    const get_url = `/canvas/api/catalyst/reference-data/rating-endpoints?requestId=${this.productContext.requestId}&productClasses=${productClasses}`;
    return this.httpClient.get<RatingEndpointResponse>(get_url).pipe(map((res) => res.data));
  }
  public getMappings(
    productId: string,
    productVersionId: string
  ): Observable<MappingPayload> { 
    const product_url = `/canvas/api/catalyst/products/${productId}/ratings/mappings?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.get<any>(product_url).pipe(map((res) => res.data));
  }

  public saveMappings(
    productId: string,
    productVersionId: string,
    payload: MappingPayload
  ): Observable<SaveMappingResponse> { 
    const product_url = `/canvas/api/catalyst/products/${productId}/ratings/mappings?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.post<SaveMappingResponse>(product_url, payload);
  }
}
