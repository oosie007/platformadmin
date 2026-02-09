import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import {
  GenericService,
  HttpOptions,
  REFERENCE_DATA,
  ReferenceDataProvider,
} from '@canvas/metadata/services';
import { HttpCacheManager } from '@ngneat/cashew';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { isNullOrUndefined } from 'is-what';
import { isEmpty, isNull, isUndefined, omit } from 'lodash-es';
import { catchError, map, Observable, of, Subject, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  DeleteProductAttributeResponse,
  PredefineAttributeRequest,
  ProductAttribute,
  ProductAttributeRequest,
  ProductAttributeResponse,
} from '../home/product-attributes/model/product-attribute';
import { CountryCodes } from '../types/constants';
import {
  GetProductResponse,
  MasterData,
  MasterDataResponse,
  PredefinedAttrs,
  Product,
  ProductImportResponse,
  ProductListResponse,
  ProductRequest,
  ProductRequestFull,
  SupportedInsuredType,
  Value,
} from '../types/product';
import { ProductContext } from '../types/product-context';
import {
  AttributeDataResponse,
  PremiumRatingFactors,
  RatingData,
  RatingResponse,
} from '../types/rating';
import { Category } from '../types/ref-data';
import { ProductContextService } from './product-context.service';
@Injectable({ providedIn: 'root' })
export class ProductsService extends GenericService<Product> {
  protected _favoritesKey = 'product';
  _showModal: boolean;
  _showModalUpdated = new Subject<any>();
  _deleteProduct: boolean;
  _deleteProductUpdated = new Subject<any>();
  productContext: ProductContext;
  country: string;
  catalystUrl = '/canvas/api/catalyst/';
  canvasUrl = '/canvas/api/bff/';
  clonedProductVersion = '1.0';
  insuredIndividual = false;

  constructor(
    protected readonly httpClient: HttpClient,
    httpCacheManager: HttpCacheManager,
    @Inject(REFERENCE_DATA)
    protected override readonly _referenceDataService: ReferenceDataProvider,
    protected _productContextService: ProductContextService
  ) {
    super(
      httpClient,
      httpCacheManager,
      _referenceDataService,
      `/canvas/api/catalyst/products?requestId=1`
    );
    this._productContext();
  }

  private _productContext() {
    this.productContext = this._productContextService._getProductContext();
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
    this.productContext.language =
      isEmpty(this.productContext.language) ||
      isNull(this.productContext.language) ||
      isUndefined(this.productContext.language) ||
      this.productContext.language == 'en'
        ? 'en'
        : this.productContext.language;
  }

  public getDataTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('ATTRDATATYPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getProductsList() {
    this._productContext();
    const prod_url = `${this.catalystUrl}products?language=en&country=IE&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<ProductListResponse>(prod_url)
      .pipe(map((res) => res.data));
  }

  public getCurrency(country?: string): Observable<MasterData[]> {
    if (isNullOrUndefined(country)) {
      country = 'IE';
    }
    this._productContext();
    const options: HttpOptions = {
      headers: {
        'x-background-call': 'true',
      },
    };
    const product_url = `${this.catalystUrl}reference-data/${Category.CURRENCY}?language=${this.productContext.language}&country=${country}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<MasterDataResponse>(product_url, { ...omit(options, ['mappings']) })
      .pipe(map((res) => res.data));
  }

  public getCountry(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('COUNTRY', {
      params: {
        requestId: this.productContext.requestId,
      },
    });
  }

  public getCurrencyList(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('CURRENCYLIST', {
      params: {
        requestId: this.productContext.requestId,
      },
    });
  }

  public getState(country_code: string): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('STATE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: country_code,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getStatus(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('PRODUCTSTATUS', {
      params: {
        requestId: this.productContext.requestId,
      },
    });
  }

  public getCountryList(region: string): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('COUNTRY', {
      params: {
        requestId: this.productContext.requestId,
        parentCode: region,
      },
    });
  }

  public getProductRatingFactors(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('RatingFactors', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getMinMaxLimitTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('LIMITTYPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getDeductibleValueTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('RFDVAL', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getPercentageValueTypes(parentCode: string): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('PERCENTVALUETYPES', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
        {
          key: 'parentCode',
          value: parentCode,
        },
      ],
    });
  }

  public getDurationTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('DURATIONTYPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getLimitScopes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('LIMITSCOPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getWaitingPeriodList(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('WAITPRD', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getDeductibleTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('DEDUCTIBLETYPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getInsuredTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('INSURED', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getDependentTypes(): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get('DEPENDENTTYPE', {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getBreakDownType(): Observable<MasterData[]> {
    this._productContext();
    // const res =  this._referenceDataService.get('PREMBREAKDOWNTYPE', {
    //   params: {
    //     requestId: this.productContext.requestId,
    //   },
    //   mappings: [
    //     {
    //       key: 'countryCode',
    //       value: this.country,
    //     },
    //     {
    //       key: 'languageId',
    //       value: this.productContext.language,
    //     },
    //   ],
    // });
    // This code will remove once API is ready.
    const mockResp = of([
      {
        id: crypto.randomUUID(),
        categoryId: null,
        description: 'Coverage variant',
        rank: 50,
        code: 'COVGVAR',
        country: 'IE',
      },
      {
        id: crypto.randomUUID(),
        categoryId: null,
        description: 'Standard coverage code',
        rank: 50,
        code: 'STDCOVER',
        country: 'IE',
      },
    ]);
    return mockResp;
  }

  create(data: ProductRequest): Observable<ProductRequest> {
    this._productContext();
    const postURL = `${this.catalystUrl}products?requestId=${this.productContext.requestId}`;
    return this.httpClient
      .post<GetProductResponse>(postURL, data)
      .pipe(map((res) => res.data));
  }

  updateProduct(
    data: ProductRequest,
    productVersionId: string
  ): Observable<boolean> {
    this._productContext();
    const updateURL = `${this.catalystUrl}products/${data.productId}/header?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .patch<boolean>(updateURL, data)
      .pipe(map((res) => res));
  }

  updateAllProductInfo(data: ProductRequestFull): Observable<boolean> {
    this._productContext();
    const updateURL = `${this.catalystUrl}products/${data.productId}?versionId=${data.productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .patch<boolean>(updateURL, data)
      .pipe(map((res) => res));
  }

  updatePolicy(
    data: ProductRequest,
    productVersionId: string
  ): Observable<ProductRequest> {
    this._productContext();
    const updateURL = `${this.catalystUrl}products/${data.productId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .patch<GetProductResponse>(updateURL, data)
      .pipe(map((res) => res.data));
  }

  updateStatus(
    productId: string,
    productVersionId: string,
    newStatus: string
  ): Observable<string | null> {
    this._productContext();
    const updateURL = `${this.canvasUrl}products/productstatus/${productId}?versionId=${productVersionId}&productStatus=${newStatus}&requestId=${this.productContext.requestId}&country=${this.productContext.country}`;
    return this.httpClient
      .patch<string | null>(updateURL, {})
      .pipe(map((res) => res));
  }

  getProduct(
    productId: string,
    productVersionId: string,
    versioned = false
  ): Observable<ProductRequest> {
    this._productContext();
    const headers = new HttpHeaders({
      versioned: `${versioned}`,
    });
    const product_url = `${this.catalystUrl}products/${productId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}&language=${this.productContext.language}&country=${this.productContext.country}`;
    return this.httpClient
      .get<GetProductResponse>(product_url, { headers })
      .pipe(map((res) => res.data));
  }

  getProductFull(
    productId: string,
    productVersionId: string
  ): Observable<ProductRequestFull> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${productId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}&language=${this.productContext.language}&country=${this.productContext.country}`;
    return this.httpClient
      .get<{ requestId: string; data: ProductRequestFull }>(product_url)
      .pipe(map((res) => res.data));
  }

  public getProductPremiumRatingFactors(
    pId: string,
    pVId: string
  ): Observable<RatingData[]> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${pId}/ratings/premuim-rating-factors?versionId=${pVId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<PremiumRatingFactors>(product_url)
      .pipe(map((res) => res.data));
  }

  public getProductAttributes(pId: string, pVId: string): Observable<any> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${pId}/attribute-paths?versionId=${pVId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.get<AttributeDataResponse>(product_url).pipe(
      map((res) =>
        res.data.map((item, index) => ({
          description: item,
          id: item,
          rank: index,
          code: index,
        }))
      )
    );
    //.pipe(map((elem) => ({description: elem})));
    // .tap(item => item.map)
  }

  public PostProductPremiumRatingFactors(
    arr: any,
    pId: string,
    pVId: string
  ): Observable<boolean> {
    this._productContext();
    const duct_url = `${this.catalystUrl}products/${pId}/ratings/premuim-rating-factors?versionId=${pVId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .post<RatingResponse>(duct_url, arr)
      .pipe(map((res) => res.data));
  }

  downloadFile(fileUrl: string, fileName: string, region: string) {
    axios
      .get(fileUrl, {
        responseType: 'blob', // Important for handling binary data
        headers: {
          region: region, // Add your custom header here
        },
      })
      .then((response) => {
        const blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });
        saveAs(blob, fileName); // Use FileSaver.js to save the file
      })
      .catch((error) => {
        console.error('Error downloading file:', error);
      });
  }

  exportProduct(
    productId: string,
    productVersionId: string,
    countryCode: string,
    region: string
  ) {
    this._productContext();
    const product_url = `${this.catalystUrl}products/export/${productId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}&countryId=${countryCode}&languageId=229`;
    this.downloadFile(product_url, 'products and reference.zip', region ?? '');
  }

  importProduct(formData: FormData): Observable<ProductRequest> {
    const postURL = `${this.catalystUrl}products/Import`;
    return this.httpClient
      .post<ProductImportResponse>(postURL, formData)
      .pipe(map((res) => res.data));
  }

  setShowModal(value: any) {
    this._showModal = value;
    this._showModalUpdated.next(this._showModal);
  }

  deleteProduct(value: any) {
    this._deleteProduct = value;
    this._deleteProductUpdated.next(this._deleteProduct);
  }

  public DeleteProduct(
    productId: string,
    productVersionId: string
  ): Observable<any> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${productId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.delete<any>(product_url).pipe(map((res) => res));
  }

  cloneProduct(
    productId: string,
    versionId: string,
    newproductId: string,
    productName: string,
    productDescription: string,
    effectiveDate: string,
    expiryDate: string
  ): Observable<any> {
    const requestBody = {
      requestId: uuidv4(),
      productName: productName,
      productId: newproductId,
      productDescription: productDescription,
      effectiveDate: effectiveDate,
      expiryDate: expiryDate,
      productVersionId: this.clonedProductVersion,
    };
    const product_url = `${this.catalystUrl}products/Clone/${productId}?versionId=${versionId}`;
    return this.httpClient
      .post<any>(product_url, requestBody)
      .pipe(map((res) => res.data));
  }

  createNewVersion(productRequest: object): Observable<object> {
    const requestBody = {
      ...productRequest,
      requestId: this.productContext.requestId,
    };
    const product_url = `${this.catalystUrl}products`;
    return this.httpClient
      .post<{ data: object }>(product_url, requestBody)
      .pipe(map((res) => res.data));
  }

  getAllByVersion(productId: string, versionId: string): Observable<object> {
    const product_url = `${this.catalystUrl}products/${productId}?versionId=${versionId}`;
    return this.httpClient
      .get<{ data: object }>(product_url)
      .pipe(map((res) => res.data));
  }

  fetchProductAttributes(
    pId: string,
    pVId: string
  ): Observable<ProductAttribute[]> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${pId}/custom-attributes?versionId=${pVId}&requestId=${this.productContext.requestId}`;
    return this.httpClient
      .get<ProductAttributeResponse>(product_url)
      .pipe(map((res) => res.data));
  }

  deleteProductAttribute(
    pId: string,
    pVId: string,
    attrId: string
  ): Observable<DeleteProductAttributeResponse> {
    this._productContext();
    const product_url = `${this.catalystUrl}products/${pId}/custom-attributes/${attrId}?versionId=${pVId}&requestId=${this.productContext.requestId}`;
    return this.httpClient.delete<DeleteProductAttributeResponse>(product_url);
  }

  saveProductAttribute(
    pId: string,
    pVId: string,
    data: ProductAttributeRequest
  ): Observable<ProductAttributeResponse> {
    this._productContext();
    const postURL = `${this.catalystUrl}products/${pId}/custom-attributes?versionId=${pVId}`;
    return this.httpClient
      .post<ProductAttributeResponse>(postURL, data)
      .pipe(map((res) => res));
  }

  savePredefineProductAttribute(
    pId: string,
    pVId: string,
    data: PredefineAttributeRequest
  ): Observable<ProductAttributeResponse> {
    this._productContext();
    const postURL = `${this.catalystUrl}products/${pId}/multiple-custom-attributes?versionId=${pVId}`;
    return this.httpClient
      .post<ProductAttributeResponse>(postURL, data)
      .pipe(map((res) => res));
  }

  editProductAttribute(
    pId: string,
    pVId: string,
    data: ProductAttributeRequest,
    attrId: string
  ): Observable<ProductAttributeResponse> {
    this._productContext();
    const postURL = `${this.catalystUrl}products/${pId}/custom-attributes/${attrId}?versionId=${pVId}`;
    return this.httpClient
      .patch<ProductAttributeResponse>(postURL, data)
      .pipe(map((res) => res));
  }

  public getPredefinedAttrInsured(productClass: string): Observable<any> {
    this._productContext();
    const getURL = `${this.catalystUrl}insured/${productClass}?insuredType=INDIVIDUAL`;
    return this.httpClient.get<any>(getURL).pipe(
      catchError((error) => {
        console.error('Error fetching country settings:', error);
        return throwError(() => error);
      })
    );
  }

  getPredefinedAttrByMsgId(
    msgId: string,
    response: any
  ): Observable<PredefinedAttrs[]> {
    return of(response).pipe(
      map((res) => {
        const supportedInsuredType = res.data.productClass.supportedInsuredType;

        // Flatten the values array and filter by msgId
        const predefinedAttrs = supportedInsuredType.flatMap(
          (type: SupportedInsuredType) =>
            type.values.flatMap((value: Value) =>
              value.msgId === msgId ? value.predefinedAttr : []
            )
        );

        return predefinedAttrs;
      })
    );
  }
  public getReferenceData(category: string): Observable<MasterData[]> {
    this._productContext();
    return this._referenceDataService.get(category, {
      params: {
        requestId: this.productContext.requestId,
      },
      mappings: [
        {
          key: 'countryCode',
          value: this.country,
        },
        {
          key: 'languageId',
          value: this.productContext.language,
        },
      ],
    });
  }

  public getInsuredPredefineAttributes(): Observable<MasterData[]> {
    this._productContext();

    const mockResp = of([
      {
        id: crypto.randomUUID(),
        categoryId: null,
        description: 'Customer ID',
        rank: 50,
        code: 'CUSTOMERID',
        country: 'IE',
      },
      {
        id: crypto.randomUUID(),
        categoryId: null,
        description: 'Employment Status',
        rank: 50,
        code: 'EMPSTATUS',
        country: 'IE',
      },
    ]);
    return mockResp;
  }

  public getCountrySettings(url: string): Observable<any> {
    const params = new HttpParams().set('requestId', uuidv4()); // Example of adding a parameter

    return this.httpClient.get<any>(url, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching country settings:', error);
        return throwError(error);
      })
    );
  }

  getSelectedCountry(): string {
    this._productContext();
    return this.country;
  }

  isInsuredIndividual(): boolean {
    return this.insuredIndividual;
  }

  setInsuredIndividual(insuredIndividual: boolean): void {
    this.insuredIndividual = insuredIndividual;
  }

  getStepCount(): number {
    this._productContext();
    return this.country === CountryCodes.US ? 1 : 2;
  }

  getCoverageFactorsStepCount(): number {
    return this.insuredIndividual ? 1 : 2;
  }

  noSpecialCharactersValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    const specialCharacterRegex = /[^a-zA-Z0-9_-]/; // Allows letters, numbers and underscores
    if (specialCharacterRegex.test(value)) {
      return { invalidCharacters: true };
    }
    return null;
  }

  noSpecialCharactersCheck(value: any): boolean {
    const specialCharacterRegex = /[^a-zA-Z0-9_-]/; // Allows letters, numbers and underscores
    if (specialCharacterRegex.test(value)) {
      return true;
    }
    return false;
  }
}
