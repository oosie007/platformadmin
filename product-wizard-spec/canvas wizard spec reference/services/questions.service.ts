import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Questionsdata, QuestionsdataResponse } from '../types/question';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
 
@Injectable({ providedIn: 'root' })
export class QuestionsService {
    protected _favoritesKey = 'coveragevariant';
    productContext: ProductContext;
    country: string;
    
    constructor(
        private httpClient: HttpClient,
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

    getAll(productId?: string, productVersionId?: string): Observable<Questionsdata[]> {
        const baseUrl = `/canvas/api/catalyst/products/${productId}/questions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`
        return this.httpClient.get<QuestionsdataResponse>(baseUrl)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .pipe(map((data: { data: any }) => data.data));
    }
 
    create(data: unknown, productId?: string, productVersionId?: string): Observable<any> {
        const postURL = `/canvas/api/catalyst/products/${productId}/questions?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.httpClient.post<any>(postURL, data)
            .pipe(map(res => res.data));
    }
    get(questionId?: string, productId?: string, productVersionId?: string): Observable<Questionsdata> {
        const getURL = `/canvas/api/catalyst/products/${productId}/questions/${questionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.get<QuestionsdataResponse>(getURL)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .pipe(map((data: { data: any; }) => data.data));
    }
    update(data: unknown, questionId?: string, productId?: string, productVersionId?: string): Observable<any> {
        const puturl = `/canvas/api/catalyst/products/${productId}/questions/${questionId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
        return this.httpClient.patch(puturl, data);
    }
}