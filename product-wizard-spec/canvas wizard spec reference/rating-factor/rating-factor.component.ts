import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbRadioModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ChipsModule } from 'primeng/chips';
import {
  MultiSelectModule,
  MultiSelectSelectAllChangeEvent,
} from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { combineLatest, switchMap } from 'rxjs';
import { UtilityService } from '../../../services/utility.service';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { CoherentMappingService } from '../../services/coherent-mapping.service';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  CoherentData,
  CoherentQuestion,
  CoherentQuestionRequest,
  externalMapping,
  MappingPayload,
  RatingInfo,
  RatingService,
} from '../../types/coherent-mapping';
import { CoverageVariant } from '../../types/coverage';
import { CustomerAttributeModel, GlobalProductCustomerDetails, RatingsLabel } from '../../types/rating';
@UntilDestroy()
@Component({
  selector: 'canvas-rating-factor',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    CbRadioModule,
    CbSelectChoiceModule,
    CbIconModule,
    CbButtonModule,
    CbInputModule,
    TableModule,
    FormsModule,
    ToastModule,
    ChipsModule,
    CbSelectMultipleModule,
    MultiSelectModule,
    CbTooltipModule,
    inputUnselectPipe,
    CbToggleModule,
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './rating-factor.component.html',
  styleUrls: ['./rating-factor.component.scss'],
})
export class RatingFactorComponent implements OnInit {
  productstatus: string;
  visible = false;
  coherentList!: string[];
  endpointList: RatingService[] = [];
  public enableexternal = '';
  coherentQuestion: CoherentQuestion[] = [];
  productId!: string;
  productVersionId!: string;
  cbColorTheme = CbColorTheme;
  colorTheme: CbColorTheme = this.cbColorTheme.DEFAULT;
  requestModel: CoherentQuestionRequest = {
    endPoint: '',
    inputMappings: [],
  };
  data: CoherentData[] = [];
  customProductAttributes: string[] = [];
  globalRatingFactors: string[] = [];
  globalRatingFactorsList: any[] = [];

  reId: number;
  reVersion: string | null;
  error = '';
  ratingFactorTypes = [
    RATINGFACTORS.GlobalRatingFactor,
    RATINGFACTORS.ProductAttributes,
    RATINGFACTORS.CustomerAttribute
  ];
  ratingFactorTypesList: string[] = [];
  selectedRatingFactorTypes: string[] = [];
  ratingInfo: RatingInfo[] = [];
  isDisable = false;
  fieldsetDisabled = false;
  selectedRatingFactors: string[] = [];
  selectAllRatingFactors = false;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  customerAttributeOptions: CustomerAttributeModel[] = [];
  globalProductCustomerDetails: GlobalProductCustomerDetails[] = [];
  labels!: RatingsLabel;
  isPartnerProvidedPremium = false;

  /* constructor injecting question coherent mapping and layout service */
  constructor(
    private _questioncoherentmapping: CoherentMappingService,
    private _layoutService: LayoutService,
    private _router: Router,
    private _sharedService: SharedService,
    private messageService: MessageService,
    private productService: ProductsService,
    private _productContextService: ProductContextService,
    private UtilityService: UtilityService,
    private readonly _appContextService: AppContextService,
    private coverageVariantService: CoverageVariantsService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';

    this.productstatus =
      this._productContextService._getProductContext().status;
      this.labels = <RatingsLabel>(
        this._appContextService.get('pages.ratings.labels')
      );
    if (this._productContextService.isProductDisabled()) {
      this.isDisable = true;
      this.fieldsetDisabled = true;
    }
    this._updateLayout();
  }

  ngOnInit() {
    combineLatest([
      this.productService.getProductAttributes(
        this.productId,
        this.productVersionId
      ),
      this.productService.getProductRatingFactors(),
      this._questioncoherentmapping.getMappings(
        this.productId,
        this.productVersionId
      ),
      this.UtilityService.fetchAdminDomainData(['CUSTOMER_ATTRIBUTE'])
     
    ]).subscribe((res) => {
      
      res[0].forEach((item: { description: string }) =>
        this.customProductAttributes.push(item.description || '')
      );
      
      this.globalRatingFactorsList = res[1];
      res[1].forEach((item) =>
        this.globalRatingFactors.push(item.description || '')
      );

      this.customerAttributeOptions = res[3].map(item => ({
        externalQuestion: "Ratingfactors",
        type: "CustomerAttribute",
        ratingFactor: item.code || ''
      }));

      this.addDetails(RATINGFACTORS.CAttribute, this.customerAttributeOptions.map(att => att.ratingFactor));
      this.addDetails(RATINGFACTORS.GRatingFactor, this.globalRatingFactors);
      this.addDetails(RATINGFACTORS.PAttributes, this.customProductAttributes);

      this.endpointList = [...this.endpointList];

      //Product rating factors
      this.isPartnerProvidedPremium=res[2].isPartnerProvidedPremium;
      if (res[2].endPoint && res[2].externalMappings.length !== 0) {
        this.reId = res[2].reId;      
        this.reVersion = this.endpointList.find(pt => pt.reId === this.reId)?.version || null;
        const questionsList = res[2].externalMappings
          .map((extMap) => extMap.externalQuestion)
          .filter((que, i, arr) => arr.indexOf(que) === i);

          questionsList.forEach((que) => {
            const selectedRatingList = res[2].externalMappings
                .filter((map) => map.externalQuestion === que)
        
            let options:any = [];
            let ratingTypes: any = [];
            const selectedRatings: string[] = [];

            selectedRatingList.forEach(rating => {
              if (rating.type === RATINGFACTORS.GRatingFactor) {
                options.push(...this.globalRatingFactors);
                ratingTypes.push(RATINGFACTORS.GlobalRatingFactor);
                selectedRatings.push(this.globalRatingFactorsList.find(
                  (item) => item.id === rating.ratingFactor
                )?.description)
              } else if (rating.type === RATINGFACTORS.CAttribute) {
                options.push(...this.customerAttributeOptions.map(att => att.ratingFactor));
                ratingTypes.push(RATINGFACTORS.CustomerAttribute);
                selectedRatings.push(rating.ratingFactor);
              } else {
                options.push(...this.customProductAttributes);
                ratingTypes.push(RATINGFACTORS.ProductAttributes);
                selectedRatings.push(rating.ratingFactor);
              }
          });

            options = [...new Set(options)];
            ratingTypes = [...new Set(ratingTypes)];
        
            // Push the rating info for the current question
            this.ratingInfo.push({
                types: ratingTypes,
                input: que || '',
                options: options,
                ratingsSelected: selectedRatings,
            });
        });
      }
    });

    this.getCoverageVariant();
  }

  getCoverageVariant() {
    this.coverageVariantService
      .getCoverageVariants(this.productId, this.productVersionId)
      .pipe(
        untilDestroyed(this),
        switchMap((response: CoverageVariant[]) => {
          const productClasses = response.map((res: CoverageVariant) => res.productClass);
          const productClassValueSet = new Set(
            productClasses.map((cls: any) => cls?.value).filter((v: any) => !!v)
          );
          const productClassValue = Array.from(productClassValueSet).join(',');
          return this._questioncoherentmapping.getRatingEndpoints(productClassValue);
        })
      )
      .subscribe({
        next: (response: any[]) => {
          this.endpointList = (response || []).map((element: any) => ({
            label: element.rE_PRODUCT_TYPE,
            serviceUrl: element.rE_ENDPOINT_VALIDATE,
            reId: element.rE_ID,
            version: element.servicE_VERSION,
          }));
        },
        error: (err: any) => {
          this._layoutService.showMessage({
            severity: 'error',
            message: 'error occurred. please try again after sometime.',
            duration: 5000,
          });
        },
      });
  }

  addDetails(type: string, values: string[]) {
    values.forEach(value => {
      this.globalProductCustomerDetails.push({
        type: type,
        value: value
      });
    });
  }

  /* styles for layout */
  private _updateLayout() {
    this._layoutService.caption$.next(``);
    this._layoutService.updateBreadcrumbs([
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
      {
        label: 'Rating',
        routerLink: `/products/${this.productId}/ratingfactor`,
      },
    ]);
  }

  onSelectAllRatingFactor(
    event: MultiSelectSelectAllChangeEvent,
    index: number
  ) {
    this.selectAllRatingFactors = event.checked;
    this.ratingInfo[index].ratingsSelected = event.checked
      ? [...this.ratingInfo[index].options]
      : [];
  }

  onChipRatingFactorChange(selectedTypes: string[], index: number) {
    this.ratingInfo[index].ratingsSelected = this.ratingInfo[
      index
    ].ratingsSelected.filter((rat: any) => selectedTypes.includes(rat));
    if ( this.ratingInfo[index].ratingsSelected == this.ratingInfo[index].options)
      this.selectAllRatingFactors = true;
  }

  onChangeGlobalRatingFactor(index: number) {
    this.ratingInfo[index].ratingsSelected = this.ratingInfo[index].options;
  }

  clearSelection(ratingFactor: any, index: number, ratingType: string) {
    this.ratingInfo[index].ratingsSelected = [];
    this.selectAllRatingFactors = false;
    if (ratingType === 'ratingType') {
      this.ratingInfo[index].types = [];
    }
  }

  onChangeRatingFactorType(event: any, index: number) {
    this.selectedRatingFactorTypes = event.value;
    this.ratingInfo[index].ratingsSelected = [];
    this.ratingInfo[index].options = [];
    this.ratingInfo[index].types = this.selectedRatingFactorTypes;

    this.selectedRatingFactorTypes.forEach(type => {
        if (type === RATINGFACTORS.GlobalRatingFactor) {
            this.ratingInfo[index].options.push(...this.globalRatingFactors);
        } 
        if (type === RATINGFACTORS.CustomerAttribute) {
            this.ratingInfo[index].options.push(...this.customerAttributeOptions.map(att => att.ratingFactor));
        } 
        if (type === RATINGFACTORS.ProductAttributes) {
            this.ratingInfo[index].options.push(...this.customProductAttributes);
        }
    });
  }

  onRatingFactorChange(index: number) {
    this.ratingInfo[index].ratingsSelected.length ==
    this.ratingInfo[index].options.length
      ? (this.selectAllRatingFactors = true)
      : (this.selectAllRatingFactors = false);
  }
  onEndpointSelect(_event: Event) {
    const select = (_event.target as HTMLSelectElement);
    const value = select.value;
    const reId = Number(value);

    this.reId = isNaN(reId) ? 0 : reId;

    this.reVersion = this.endpointList.find((item) => item.reId === this.reId)?.version || null;
  }

  /* lookup button click event to call the api and get the coherent mapping data */
  btnClick() {
    const endpointURL = this.endpointList.find(ep => ep.reId == this.reId && ep.version == this.reVersion)?.serviceUrl || ''
    this._questioncoherentmapping
      .getCoherentList(endpointURL)
      .pipe(untilDestroyed(this))
      .subscribe((res: any) => {
        this.coherentList = res.data;
        this.ratingInfo = [];
        this.coherentList.forEach((item) => {
          this.ratingInfo.push({
            types: [],
            input: item,
            options: [],
            ratingsSelected: [],
          });
        });
      });
  }

  validateInputMapping(mapping: MappingPayload | undefined): boolean {
    let isvalid = false;
    if(mapping?.isPartnerProvidedPremium){
     isvalid=true;
    }
    else{
      mapping?.externalMappings.forEach((items: externalMapping) => {
        if (items.ratingFactor === '' || items.ratingFactor === undefined) {
          return isvalid;
        } else return (isvalid = true);
      });
    }
   
    return isvalid;
  }

  save(navigateToHome: boolean): void {
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
      return;
    }

    const extMappings: externalMapping[] = [];
    this.ratingInfo.forEach((item: any) => {
      item.ratingsSelected.forEach((selectedItem: any)  => {
        const selectedval = this.globalProductCustomerDetails.find((detail: any) => detail.value === selectedItem);
        if(selectedval) {
          extMappings.push({
            externalQuestion: item.input,
            type: selectedval.type,
            ratingFactor: selectedval.type === RATINGFACTORS.GRatingFactor ? 
                          this.globalRatingFactorsList.find(item => item.description === selectedval.value).id :
                          selectedval.value,
          });
        }
      })
    });
    const mappingPayload: MappingPayload = {
      reId: this.reId,
      endPoint: this.endpointList.find(x => x.reId == this.reId && x.version == this.reVersion)?.serviceUrl || '',
      externalMappings: extMappings.filter(
        (map) =>
          map.ratingFactor != '' ||
          map.ratingFactor != null ||
          map.ratingFactor != undefined
      ),
      isPartnerProvidedPremium:this.isPartnerProvidedPremium
    };
    const result = this.validateInputMapping(mappingPayload);
    if (result === false) {
      this.messageService.add({
        key: 'tr',
        severity: 'error',
        detail: ' Unable to save rating factors - Please enter mandatory data',
        life: 500,
        sticky: true,
        closable: true,
      });
    } else {
      this._questioncoherentmapping
        .saveMappings(this.productId, this.productVersionId, mappingPayload)
        .subscribe({
          next: () => {
           
            this._layoutService.showMessage({
              severity: 'success',
              message: 'Rating Factor Saved Successfully',
              duration: 5000,
            });
            this._productContextService._setPartnerProvidedData(mappingPayload.isPartnerProvidedPremium);
            if (navigateToHome) {
              this._router.navigate(['products']);
            } else {
              this._sharedService.nextButtonClicked.next({ stepCount: 1 });
            }
          },
          error: () => {
            this._layoutService.showMessage({
              severity: 'error',
              message: 'Unable to save rating factor(s)',
              duration: 5000,
            });
          },
        });
    }

  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }
  onPremiumToggleChange(e: boolean) {

    this.isPartnerProvidedPremium = e;
    this._productContextService._setPartnerProvidedData(e);
  }

}

export const RATINGFACTORS = {
  GRatingFactor: 'GlobalRatingFactor',
  GlobalRatingFactor: 'Global Rating Factor',
  ProductAttributes: 'Product Attributes',
  PAttributes: 'ProductAttribute',
  CustomerAttribute: 'Customer Attributes',
  CAttribute: 'CustomerAttribute',
};