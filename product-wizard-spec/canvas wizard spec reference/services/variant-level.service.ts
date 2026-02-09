import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { isNullOrUndefined } from 'is-what';
import { isEmpty, isNull, isUndefined } from 'lodash-es';
import { map, Observable } from 'rxjs';
import { StepperNavigationService } from '../home/coverage-variant-v2/services/stepper-navigation.service';
import {
  CoverageVariant,
  CoverageVariantLevelPermutationsResponse,
  CoverageVariantResponse,
  CvlPermutations,
} from '../types/coverage';
import {
  CoverageVariantLevel,
  CoverageVariantLevelResponse,
  DependentTypeKeys,
  InsuredTypeKeys,
  PostCoverageVariantLevelRequest,
  SubCoverageLevel,
  SubCoverageLevelsRequest,
  SubCoverageLevelsResponse,
} from '../types/coverage-variant-level';
import { ProductContext } from '../types/product-context';
import { ProductContextService } from './product-context.service';
@Injectable({
  providedIn: 'root',
})
export class VariantLevelService {
  baseUrl = '/canvas/api/catalyst';

  productContext: ProductContext;
  country: string;
  constructor(
    private http: HttpClient,
    private productContextService: ProductContextService,
    private _stepperNavigationService: StepperNavigationService,
    private _router: Router
  ) {
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

  public getCoverageVariantDetails(
    productId: string,
    productVersionId: string,
    coverageVariantId: string
  ): Observable<CoverageVariant> {
    this._productContext();
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .get<CoverageVariantResponse>(url)
      .pipe(map((res: CoverageVariantResponse) => res.data));
  }

  public getCoverageVariantLevelPermutations(
    productId: string,
    productVersionId: string,
    coverageVariantId: string
  ): Observable<CvlPermutations[][]> {
    this._productContext();
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/coveragefactors/permutations?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .get<CoverageVariantLevelPermutationsResponse>(url)
      .pipe(map((res: CoverageVariantLevelPermutationsResponse) => res.data));
  }

  // public getInsuredObjectTypes(): Observable<MasterData[]> {
  //   // const url = `${this.baseUrl}/reference-data/Objects?language=en`;
  //   // return this.http
  //   //   .get<MasterDataResponse>(url)
  //   //   .pipe(map((res: MasterDataResponse) => res.data));
  //   return of(this.objectTypes);
  // }

  public getCoverageVaraintLevels(
    productId?: string,
    productVersionId?: string,
    coverageVariantId?: string
  ): Observable<CoverageVariantLevel[]> {
    this._productContext();
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/variantlevels?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .get<CoverageVariantLevelResponse>(url)
      .pipe(map((res: CoverageVariantLevelResponse) => res.data));
  }

  public upsertCoverageVariantLevel(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    body: PostCoverageVariantLevelRequest
  ): Observable<CoverageVariantLevel[]> {
    this._productContext();
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/variantlevels?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .put<CoverageVariantLevelResponse>(url, body)
      .pipe(map((res: CoverageVariantLevelResponse) => res.data));
  }

  public patchCoverageVariantLevel(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    coverageVariantLevelId: string,
    body: CoverageVariantLevel
  ): Observable<CoverageVariantLevel[]> {
    this._productContext();
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/variantlevels/${coverageVariantLevelId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http
      .patch<CoverageVariantLevelResponse>(url, body)
      .pipe(map((res: CoverageVariantLevelResponse) => res.data));
  }

  public postSubCoverageVariantLevel(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    subCoverageId: string,
    body: SubCoverageLevelsRequest[]
  ): Observable<SubCoverageLevel[]> {
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverageId}/subcoveragelevel?versionId=${productVersionId}`;
    return this.http
      .post<SubCoverageLevelsResponse>(url, body)
      .pipe(map((res: SubCoverageLevelsResponse) => res.data));
  }

  // public patchSubCoverageVariantLevel(
  //   productId: string,
  //   productVersionId: string,
  //   coverageVariantId: string,
  //   subCoverageId: string,
  //   subCoverageLevelId: string,
  //   body: SubCoverageLevelsRequest
  // ): Observable<boolean> {
  //   const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverageId}/subcoveragelevel/${subCoverageLevelId}?versionId=${productVersionId}`;
  //   return this.http.patch<boolean>(url, body).pipe(map((res: boolean) => res))
  // }

  public patchSubCoverageVariantLevel2(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    body: any
  ): Observable<boolean> {
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}`;
    return this.http.patch<boolean>(url, body).pipe(map((res: boolean) => res));
  }

  public deleteSubCoverageVariantLevel(
    productId: string,
    productVersionId: string,
    coverageVariantId: string,
    subCoverageId: string,
    subCoverageLevelId: string
  ): Observable<boolean> {
    const url = `${this.baseUrl}/products/${productId}/coveragevariants/${coverageVariantId}/subcoverages/${subCoverageId}/subcoveragelevel/${subCoverageLevelId}?versionId=1.0&requestId=1`;
    return this.http.delete<boolean>(url).pipe(map((res: boolean) => res));
  }

  public selectVariant(
    variant: string,
    productId: string,
    cvLevelId: string,
    coverageVariantId: string
  ) {
    if (!isEmpty(variant)) {
      switch (variant) {
        case InsuredTypeKeys.MAININSURED:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([
              `/products/${productId}/coveragevariant/miVariantLevel`,
            ]);
          } else {
            this._router.navigate([
              `products/${productId}/coveragevariants/${coverageVariantId}/variantLevels/${cvLevelId}/update&type=maininsured`,
            ]);
          }
          break;
        case InsuredTypeKeys.SPOUSE:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([
              `/products/${productId}/coveragevariant/spouseVariantLevel`,
            ]);
          } else {
            this._router.navigate([
              `products/${productId}/coveragevariants/${coverageVariantId}/variantLevels/${cvLevelId}/update&type=spouse`,
            ]);
          }
          break;
        case DependentTypeKeys.CHILD:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([
              `/products/${productId}/coveragevariant/childVariantLevel`,
            ]);
          } else {
            this._router.navigate([
              `products/${productId}/coveragevariants/${coverageVariantId}/variantLevels/${cvLevelId}/update&type=child`,
            ]);
          }
          break;
        case DependentTypeKeys.ADULT:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([
              `/products/${productId}/coveragevariant/adultVariantLevel`,
            ]);
          } else {
            this._router.navigate([
              `products/${productId}/coveragevariants/${coverageVariantId}/variantLevels/${cvLevelId}/update&type=adult`,
            ]);
          }

          break;
        default:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([
              `/products/${productId}/coveragevariant/coveragevariantlevels`,
            ]);
          } else {
            this._router.navigate([
              `/products/${productId}/coveragevariant/coverage-variant-level-overview`,
            ]);
          }
      }
    } else {
      if (
        isNullOrUndefined(cvLevelId) ||
        isEmpty(cvLevelId) ||
        cvLevelId?.length <= 0
      ) {
        this._router.navigate([
          `/products/${productId}/coveragevariant/coveragevariantlevels`,
        ]);
      } else {
        this._router.navigate([
          `/products/${productId}/coveragevariant/coverage-variant-level-overview`,
        ]);
      }
    }
  }

  public selectVariantV2(
    variant: string,
    productId: string,
    cvLevelId: string,
    coverageVariantId: string
  ) {
    const urlPath = `/products/${productId}/coveragevariant/${coverageVariantId}`;
    if (!isEmpty(variant)) {
      switch (variant) {
        case InsuredTypeKeys.MAININSURED:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([`${urlPath}/miVariantLevel`]);
          } else {
            this._router.navigate([
              `${urlPath}/variantLevels/${cvLevelId}/update&type=maininsured`,
            ]);
          }
          break;
        case InsuredTypeKeys.SPOUSE:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([`${urlPath}/spouseVariantLevel`]);
          } else {
            this._router.navigate([
              `${urlPath}/variantLevels/${cvLevelId}/update&type=spouse`,
            ]);
          }
          break;
        case DependentTypeKeys.CHILD:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([`${urlPath}/childVariantLevel`]);
          } else {
            this._router.navigate([
              `${urlPath}/variantLevels/${cvLevelId}/update&type=child`,
            ]);
          }
          break;
        case DependentTypeKeys.ADULT:
          if (
            isNullOrUndefined(cvLevelId) ||
            isEmpty(cvLevelId) ||
            cvLevelId?.length <= 0
          ) {
            this._router.navigate([`${urlPath}/adultVariantLevel`]);
          } else {
            this._router.navigate([
              `${urlPath}/variantLevels/${cvLevelId}/update&type=adult`,
            ]);
          }
          break;
        default:
          this._stepperNavigationService.emitNext();
        // if (
        //   isNullOrUndefined(cvLevelId) ||
        //   isEmpty(cvLevelId) ||
        //   cvLevelId?.length <= 0
        // ) {
        //   this._router.navigate([`${urlPath}/coveragevariantlevels`]);
        // } else {
        //   this._router.navigate([
        //     `${urlPath}/coverage-variant-level-overview`,
        //   ]);
        // }
      }
    } else {
      this._stepperNavigationService.emitNext();
      // if (
      //   isNullOrUndefined(cvLevelId) ||
      //   isEmpty(cvLevelId) ||
      //   cvLevelId?.length <= 0
      // ) {
      //   this._router.navigate([`${urlPath}/coveragevariantlevels`]);
      // } else {
      //   this._router.navigate([`${urlPath}/coverage-variant-level-overview`]);
      // }
    }
  }
}
