import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { map, Observable } from 'rxjs';
import {} from '../types/coverage';
import { Data, Root } from '../types/insured-object';
import { MasterData, MasterDataResponse } from '../types/product';
import { ProductContext } from '../types/product-context';
import { Category } from '../types/ref-data';
import { ProductContextService } from './product-context.service';

@Injectable({
  providedIn: 'root',
})
export class InsuredTypeService {
  baseUrl = '/canvas/api/catalyst';

  productContext: ProductContext;
  country: string;
  constructor(
    private http: HttpClient,
    private productContextService: ProductContextService
  ) {
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
    this.country =
      this.productContext.country.length < 0
        ? 'IE'
        : !isEmpty(this.productContext.country[0]) &&
          !isNull(this.productContext.country[0])
        ? this.productContext.country[0]
        : 'IE';
  }
  public getPredefinedAttributes(productClass: string): Observable<Data> {
    this._productContext();
    //const url = `${this.baseUrl}/StandardInsSupported/${productClass}?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
    const url = `${this.baseUrl}/Insured/${productClass}?insuredType=OBJECT`;
    return this.http.get<Root>(url).pipe(map((res: Root) => res.data));
  }
}
