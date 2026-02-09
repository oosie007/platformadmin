import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DocumentResponse ,DocumentData, DocumentPostData, DocumentPostResponse} from '../types/documents';
import { ProductContextService } from './product-context.service';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { ProductContext } from '../types/product-context';
@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  
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

   getDocumentList(
    productId: string,
    productVersionId: string,
   ): Observable<DocumentData[]> {
   
    const apiUrl = `/canvas/api/catalyst/products/${productId}/documents?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;

    return this.http.get<DocumentResponse>(apiUrl)
      .pipe(
        map((response:DocumentResponse) => response.data)
      );
  }

  public createDocument(
    addDocument: DocumentPostData,
    productId: string,
    productVersionId: string
  ): Observable<DocumentPostResponse> {
    const postURL = `/canvas/api/catalyst/products/${productId}/documents/upload?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<DocumentPostResponse>(postURL, addDocument);

  }
  public uploadDocument(
    productId: string,
    productVersionId: string,
    formData: FormData
  ): Observable<DocumentPostResponse> {
    const postURL = `/canvas/api/catalyst/products/${productId}/documents/upload?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<DocumentPostResponse>(postURL, formData);

  }
  // 1/AdminAPI/products/SXRNTRINS18/documents/DO-1D826254-3BF2-4582-BBB3-8D763F69D12D?versionId=1.0&requestId=1
  public removeDocument(
    productId: string,
    productVersionId: string,
    documentId: string
  ): Observable<any> {
    const postURL = `/canvas/api/catalyst/products/${productId}/documents/${documentId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.delete(postURL);
  }
  
}