import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MasterDataResponse } from '../types/master-data';
import { CategoryData } from '../types/coverage';
import { MasterData } from '../types/product';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { Category } from '../types/ref-data';

@Injectable({
  providedIn: 'root',
})
/**
 * CategoryDataService
 */
export class CategoryDataService {
 
  productContext: ProductContext;
  params: string;
  country: string;

  constructor(private http: HttpClient, private productContextService: ProductContextService) {
    this._productContext();
  }

  private _productContext() {
    this.productContext = this.productContextService._getProductContext();
    this.productContext.language = isEmpty(this.productContext.language) || isNull(this.productContext.language) || isUndefined(this.productContext.language) || this.productContext.language == 'en' ? 'en': this.productContext.language;
    this.productContext.requestId = isEmpty(this.productContext.requestId) || isNull(this.productContext.requestId) || isUndefined(this.productContext.requestId)? crypto.randomUUID(): this.productContext.requestId;
    this.country = this.productContext.country.length < 0 ? 'IE': (!isEmpty(this.productContext.country[0])) && (!isNull(this.productContext.country[0])) ?  this.productContext.country[0] : 'IE';
    this.params = `?language=${this.productContext.language}&country=${this.country}&requestId=${this.productContext.requestId}`;
  }

  categoryUrl =
    '/canvas/api/catalyst/reference-data/';
  

  public getProductClass(): Observable<CategoryData[]> {
    this._productContext();
    const productClassURL = this.categoryUrl + Category.PRODUCTCLASS + this.params;
    return this.http.get<MasterDataResponse>(productClassURL).pipe(map((res) =>{
      return res.data.map(category => {
        return <CategoryData>{ description: category.description, value: category.code, category: Category.PRODUCTCLASS }
      })
    }));
  }

  public getProductSubClass(): Observable<CategoryData[]> {
    this._productContext();
    const productSubClassURL = this.categoryUrl + Category.PRODTYPE + this.params;
    return this.http.get<MasterDataResponse>(productSubClassURL).pipe(map((res) =>{
      return res.data.map(category => {
        return <CategoryData>{ value: category.code, key: category.id, category: Category.PRODTYPE }
      })
    }));
  }

  public getCoverageType(): Observable<MasterData[]> {
    this._productContext();
    const coverageTypeURL = this.categoryUrl + Category.CVT + this.params;
    return this.http.get<MasterDataResponse>(coverageTypeURL).pipe(map((res) =>{
      return res.data
    }));
  }
}
