import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cloneDeep, isEmpty, isNull, isUndefined } from 'lodash-es';
import { map, Observable, of, Subject, switchMap } from 'rxjs';
import { UtilityService } from '../../services/utility.service';
import {
  AvailabilityRequest,
  DeleteRespone,
  getAvailabilityResponse,
  getResponse,
  RootAvailability,
  Standard,
  StandardAvalability,
  State_List,
  StateListRequest,
} from '../types/availability';
import { MasterData, MasterDataResponse } from '../types/product';
import { ProductContext } from '../types/product-context';
import { Category } from '../types/ref-data';
import { ProductContextService } from './product-context.service';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  _showModal: boolean;
  _showModalUpdated = new Subject<any>();
  _deleteavailability: boolean;
  _deleteAvailabilityUpdated = new Subject<any>();
  category_state = 'STATE';
  productContext: ProductContext;
  country: string;
  availability: RootAvailability | null;
  selectedCountry: string | null;

  constructor(
    private http: HttpClient,
    private productContextService: ProductContextService,
    private readonly _utilityService: UtilityService
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

  public getCountry(): Observable<MasterData[]> {
    this._productContext();
    const country_url = `/canvas/api/catalyst/reference-data/${Category.COUNTRY}?language=en&country=00&requestId=${this.productContext.requestId}`;
    return this.http
      .get<MasterDataResponse>(country_url)
      .pipe(map((res) => res.data));
  }

  public getState(country_code: string): Observable<State_List[]> {
    this._productContext();
    const state_url = `/canvas/api/catalyst/reference-data/${Category.STATE}?language=${this.productContext.language}&country=${country_code}&requestId=${this.productContext.requestId}`;
    return this.http
      .get<StateListRequest>(state_url)
      .pipe(map((res: StateListRequest) => res.data));
  }

  public getAvailability(
    productId: string,
    productVersionId: string
  ): Observable<RootAvailability> {
    if (isEmpty(this.availability)) {
      this._productContext();
      const getAvailability_url = `/canvas/api/catalyst/products/${productId}/availability?versionId=${productVersionId}`;
      return this.http.get<getAvailabilityResponse>(getAvailability_url).pipe(
        map((res: getAvailabilityResponse) => {
          this.availability = cloneDeep(res.data);
          return res.data;
        })
      );
    }
    return of(cloneDeep(this.availability));
  }

  removeAvailability(): void {
    this.availability = null;
  }

  public updatestandard(
    addavailability: AvailabilityRequest,
    productId: string,
    productVersionId: string
  ): Observable<getAvailabilityResponse> {
    this._productContext();
    this.removeAvailability();
    const patchURL = `/canvas/api/catalyst/products/${productId}/availability?versionId=${productVersionId}`;
    return this.http.patch<getAvailabilityResponse>(patchURL, addavailability);
  }

  public deletestandard(
    productId: string,
    productVersionId: string,
    availabilityId: string
  ): Observable<DeleteRespone> {
    this._productContext();
    const deleteURL = `/canvas/api/catalyst/products/${productId}/availability/${availabilityId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.delete<DeleteRespone>(deleteURL);
  }

  public createStandard(
    addavailability: StandardAvalability,
    productId: string,
    productVersionId: string
  ): Observable<Response> {
    this._productContext();
    const patchURL = `/canvas/api/catalyst/products/${productId}/availability/standard?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
    return this.http.post<Response>(patchURL, addavailability);
  }

  public getavailabilitybyId(
    productId: string,
    productVersionId: string,
    availabilityId: string
  ): Observable<Standard> {
    if (isEmpty(this.availability)) {
      this._productContext();
      const getavailability_url = `/canvas/api/catalyst/products/${productId}/availability/${availabilityId}?versionId=${productVersionId}&requestId=${this.productContext.requestId}`;
      return this.http
        .get<getResponse>(getavailability_url)
        .pipe(map((res: getResponse) => res.data));
    } else {
      return of(
        this.availability?.standards?.filter(
          (item) => item.availabilityId === availabilityId
        )[0]
      );
    }
  }

  setShowModal(value: any) {
    this._showModal = value;
    this._showModalUpdated.next(this._showModal);
  }

  deleteAvailability(value: any) {
    this._deleteavailability = value;
    this._deleteAvailabilityUpdated.next(this._deleteavailability);
  }

  public getMinimumPremium(
    productId: string,
    productVersionId: string
  ): Observable<AvailabilityRequest> {
    this._productContext();
    const getavailability_url = `/canvas/api/catalyst/products/${productId}/availability?versionId=${productVersionId}`;

    return this.http.get<getAvailabilityResponse>(getavailability_url).pipe(
      switchMap((res: getAvailabilityResponse) => {
        const data = res.data;
        return this._utilityService
          .updateMinimumPremiumDetails(data.standards)
          .pipe(
            map((updatedStandards) => {
              const rootAvailability: AvailabilityRequest = {
                standards: updatedStandards,
                ruleSets: data.ruleSets,
                requestId: data.id,
              };
              return rootAvailability;
            })
          );
      })
    );
  }
}
