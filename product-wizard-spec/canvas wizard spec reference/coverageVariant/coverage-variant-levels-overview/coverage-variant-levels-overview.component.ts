/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbItemsShownAdjustorModule,
  CbItemsShownIndicatorModule,
  CbModalModule,
  CbPaginationNavHandleModule,
  CbSearchInputModule,
  CbSelectChoiceModule,
} from '@chubb/ui-components';
import { NavHandleLabelConfig } from '@chubb/ui-components/lib/common/models/nav-handle-label-config';
import { isNullOrUndefined } from 'is-what';
import * as _ from 'lodash';
import { cloneDeep, isEmpty } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { combineLatest } from 'rxjs';
import { UtilityService } from '../../../../services/utility.service';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { CoverageVariantLevelService } from '../../../services/coverage-variant-level.service';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { InsuredTypeService } from '../../../services/insured-type.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant, CvlPermutations } from '../../../types/coverage';
import {
  CoverageVariantLevel,
  CoverageVariantLevelDetail,
  CovVariantLevelDetails,
  Deductible,
  DependentTypeKeys,
  Duration,
  Insured,
  InsuredEvent,
  InsuredEventLevel,
  InsuredLevel,
  InsuredObject,
  InsuredObjectLevel,
  InsuredTypeKeys,
  Limit,
  PostCoverageVariantLevelRequest,
} from '../../../types/coverage-variant-level';
import { Value } from '../../../types/insured-object';
import { MasterData } from '../../../types/product';
import { Category } from '../../../types/ref-data';

@Component({
  selector: 'canvas-coverage-variant-levels-overview',
  templateUrl: './coverage-variant-levels-overview.component.html',
  styleUrls: ['./coverage-variant-levels-overview.component.scss'],
  standalone: true,
  imports: [
    CbSearchInputModule,
    CbInputModule,
    CbButtonModule,
    CbIconModule,
    CbSelectChoiceModule,
    CbItemsShownIndicatorModule,
    CbItemsShownAdjustorModule,
    CbPaginationNavHandleModule,
    AutoCompleteModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    CbModalModule,
    CommonModule,
    inputUnselectPipe,
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CoverageVariantLevelsOverviewComponent implements OnInit {
  title = 'Coverage variant levels overview';
  selectedItem: string;
  coverageLevelsForm: FormGroup = new FormGroup({
    coverageLevelsCount: new FormControl(''),
  });
  coverageLevels: number[];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  rowSelectorOptions: number[] = [1, 5, 10, 15, 20];

  navLabelConfig: NavHandleLabelConfig = {
    nextPageButtonLabel: '',
    previousPageButtonLabel: '',
    itemsLabel: 'Page',
    ofLabel: 'of',
  };
  productId: string;
  productVersionId: string;
  coverageVariantId: string;
  coverageVariantLevels: CoverageVariantLevel[];
  isVariantLevelAvailable = false;
  coverageVariantLevelDetails: CoverageVariantLevelDetail[] = [];
  updatedCoverageVariantLevels: CoverageVariantLevel[];
  covVariantLevelDetails: CovVariantLevelDetails[] = [];
  insureds: Insured[] = [];
  insuredLevels: Insured[] = [];
  rows = 5;
  coverageVariantLevelsRequest: CoverageVariantLevel[] = [];
  disableCounter = false;
  nextButtonLabel: string;
  insuredObjects: InsuredObject[] = [];
  insuredEvents: InsuredEvent[] = [];
  fieldsetDisabled = false;
  openModal = false;
  openNumberOfLevelWarningModal = false;
  isDisabled = false;
  countErrorMessage: string | null = null;
  coverageLevelName = 'Coverage level';
  coverageVariantName: string;
  coverageList: CoverageVariant[];
  aggregateType: MasterData[];
  aggregateMaxAmount: number;
  productClass: string;
  insuredObjectsData: Value[];
  openDeleteModal: boolean;
  deleteSelectedItem: any;
  insuredEventsData: MasterData[] = [];
  coverageFactorPermutations: boolean = true;
  coverageFactorCombinationData: CvlPermutations[][] = [];
  isButtonEnabled: boolean = true;
  /**
   *
   */
  constructor(
    private coverageVariantLevelService: CoverageVariantLevelService,
    private _variantLevelService: VariantLevelService,
    private _productService: ProductsService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _productContextService: ProductContextService,
    private _router: Router,
    private _coverageVariantService: CoverageVariantService,
    private _insuredTypeService: InsuredTypeService,
    private _fb: FormBuilder,
    private _utilityService: UtilityService
  ) {
    if (
      localStorage.getItem('productId') != null ||
      localStorage.getItem('productId') != undefined
    ) {
      this.productId = localStorage.getItem('productId') || '';
    }
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      this.productVersionId = localStorage.getItem('productVersionId') || '';
    }
    if (
      localStorage.getItem('coverageVariantId') != null ||
      localStorage.getItem('coverageVariantId') != undefined
    ) {
      this.coverageVariantId = localStorage.getItem('coverageVariantId') || '';
    }
    if (
      localStorage.getItem('coverageVariantName') != null ||
      localStorage.getItem('coverageVariantName') != undefined
    ) {
      this.coverageVariantName =
        localStorage.getItem('coverageVariantName') || '';
    }
    this.productClass = localStorage?.getItem('ProductClass') || '';
  }

  ngOnInit() {
    this.getCumulativeLimits();
    this.isDisabled = this._productContextService.isProductDisabled();
    this.getCoverageVariantLevels(
      this.productId,
      this.coverageVariantId,
      this.productVersionId
    );

    this._updateLayout();
  }

  private _updateLayout() {
    this._layoutService.updateBreadcrumbs([
      { label: 'Home', routerLink: 'home' },
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
      {
        label: 'Coverage variants',
        routerLink: `/products/${this.productId}/coveragevariant`,
      },
      {
        label: `${this.coverageVariantName}`,
        routerLink: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
      },
      {
        label: 'Coverage variant levels',
        routerLink: `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  getCumulativeLimits() {
    this._productService.getMinMaxLimitTypes().subscribe({
      next: (data: any) => {
        this.aggregateType = data;
      },
    });
  }

  shouldEnableButton(variantLevelResponse: any, permutationsResponse: any) {
    if (!permutationsResponse || permutationsResponse.length === 0) {
      return true;
    }
    const permutationsLength = permutationsResponse.length;
    for (const variant of variantLevelResponse) {
      for (const insured of variant.insuredLevel) {
        const combinations =
          insured.coverageFactorMapping &&
          insured.coverageFactorMapping.coverageFactorCombinations
            ? insured.coverageFactorMapping.coverageFactorCombinations
            : [];
        if (combinations.length !== permutationsLength) {
          return false;
        }
        for (const combo of combinations) {
          if (
            !combo.limit ||
            combo.limit.maxAmount == null ||
            combo.limit.maxAmount === 0
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private getCoverageVariantLevels = async (
    productId: string,
    coverageVariantid: string,
    productVersionId: string
  ) => {
    const toastMessageConfigGet = {
      warning: {
        severity: 'error',
        message: `There is no Coverage Variant level for the associated product ${this.productId} and coverage variant ${this.coverageVariantId}`,
        duration: 5000,
      },
    };
    combineLatest([
      this.coverageVariantLevelService.getCoverageVariantLevels(
        productId,
        coverageVariantid,
        productVersionId
      ),
      this._utilityService.fetchAdminDomainData(['INSUREDEVENT']),
      this._variantLevelService.getCoverageVariantLevelPermutations(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._coverageVariantService.getCoverageVariants(
        this.productId,
        this.productVersionId
      ),
    ]).subscribe({
      next: ([data, insuredEvents, permutations, coverageVariants]) => {
        this.insuredEventsData = insuredEvents;

        if (data) {
          this.coverageList = coverageVariants;
          this.coverageList = this.coverageList.filter(
            (coverageid) =>
              coverageid.coverageVariantId != this.coverageVariantId
          );

          this.coverageFactorPermutations = permutations.length > 0;
          this.coverageFactorCombinationData = permutations ?? [];
          this.coverageVariantLevels = data;
          this.updatedCoverageVariantLevels = this.coverageVariantLevels;
          this.isVariantLevelAvailable =
            this.coverageVariantLevels.length <= 0 ? false : true;

          this.isButtonEnabled = this.shouldEnableButton(data, permutations);
          const currentCoverageVariant: CoverageVariant[] =
            coverageVariants.filter(
              (coverage: CoverageVariant) =>
                coverage.coverageVariantId === this.coverageVariantId
            );
          if (!isEmpty(currentCoverageVariant[0]?.insuredObjects)) {
            this._insuredTypeService
              .getPredefinedAttributes(this.productClass)
              .subscribe((res) => {
                this.insuredObjectsData =
                  res.productClass.supportedInsuredType.find((x) => x.values)
                    ?.values || [];
                this.configureCoverageLimits();
              });
          } else {
            this.configureCoverageLimits();
          }
        } else {
          this._layoutService.showMessage(toastMessageConfigGet['warning']);
        }
      },
    });
  };

  configureCoverageLimits(): void {
    if (!this.isVariantLevelAvailable) {
      this.coverageLevelsForm
        ?.get('coverageLevelsCount')
        ?.setValue({ value: 0, disabled: true });
      this.nextButtonLabel = 'Next';
    } else {
      this.coverageLevelsForm = this._fb.group({
        coverageLevelsCount: [
          {
            value: this.coverageVariantLevels?.length,
            disabled: !(this.coverageVariantLevels?.length > 0),
          },
          [
            Validators.min(1),
            Validators.required,
            Validators.pattern(/^[1-9]\d*$/),
          ],
        ],
      });
      this.nextButtonLabel = 'Save & Next';
    }
    this.getCoverageVariantLevelDetails(this.coverageVariantLevels);
  }

  getCoverageVariantLevelDetails = async (
    coverageVariantLevels: CoverageVariantLevel[]
  ) => {
    this.coverageVariantLevels.map((item: CoverageVariantLevel, i: number) => {
      const orderNumber = Number(
        item.description.substring(this.coverageLevelName?.length)
      );
      item.order = !isNaN(orderNumber) ? orderNumber : i + 1;
      return item;
    });
    this.coverageVariantLevelDetails.map(
      (item: CoverageVariantLevelDetail, i: number) => {
        const orderNumber = Number(
          item.description.substring(this.coverageLevelName?.length)
        );
        item.order = !isNaN(orderNumber) ? orderNumber : i + 1;
        return item;
      }
    );
    this.coverageVariantLevels = _.sortBy(this.coverageVariantLevels, [
      'order',
    ]);
    this.coverageVariantLevelDetails = _.sortBy(
      this.coverageVariantLevelDetails,
      ['order']
    );
    this.coverageVariantLevelDetails.splice(
      0,
      this.coverageVariantLevelDetails.length
    );
    this.covVariantLevelDetails.splice(0, this.covVariantLevelDetails.length);
    for (let i = 0; i < coverageVariantLevels.length; i++) {
      const coverageVariantLevelDetail: CoverageVariantLevelDetail =
        new CoverageVariantLevelDetail();
      const covVariantLevelDetail: CovVariantLevelDetails =
        new CovVariantLevelDetails();
      if (this.coverageVariantLevels[i]?.insuredLevel?.length > 0) {
        for (
          let ins = 0;
          ins < this.coverageVariantLevels[i].insuredLevel.length;
          ins++
        ) {
          const insured: Insured = {
            insuredLevelId: '',
            InsuredType: '',
            InsuredTypeValue: '',
            maxType: '',
            maxAmount: 0,
            isMIApplicable: false,
            isSpouseApplicable: false,
            isDependentChildApplicable: false,
            isDependentAdultApplicable: false,
            aggregateMaxValue: 0,
            aggregateLimitType: '',
            aggregateCoverageVariantPercentage: '',
          };
          const insuredData = this.coverageVariantLevels[i].insuredLevel[ins];
          insured.insuredLevelId = insuredData.insuredLevelId;
          insured.maxType = insuredData.limit.maxType;
          insured.maxAmount = insuredData.limit.maxAmount;
          insured.isMIApplicable = this.isMIApplicable(insuredData);
          insured.isSpouseApplicable = this.isSpouseApplicable(insuredData);
          insured.isDependentChildApplicable =
            this.isDependentChildApplicable(insuredData);
          insured.isDependentAdultApplicable =
            this.isDependentAdultApplicable(insuredData);
          insured.aggregateMaxValue = insuredData.limit.aggregateMaxValue;
          insured.aggregateLimitType = insuredData.limit.aggregateLimitType;
          insured.aggregateCoverageVariantPercentage =
            insuredData.limit.aggregateCoverageVariantPercentage;
          this.insuredLevels = [...this.insuredLevels, insured];
        }
        coverageVariantLevelDetail.insuredLevel = Object.values(
          this.insuredLevels
        );
        this.insuredLevels.splice(0, Object.entries(this.insuredLevels).length);
        coverageVariantLevelDetail.coverageLevelId =
          this.coverageVariantLevels[i].coverageVariantLevelId || '';
        coverageVariantLevelDetail.description =
          this.coverageLevelName + ' ' + (i + 1);
        const isCurrentVersion =
          this.coverageVariantLevels[i].isCurrentVersion ?? true;
        coverageVariantLevelDetail.isCurrentVersion = isCurrentVersion;
        coverageVariantLevelDetail.disableEdit = !isCurrentVersion;
        coverageVariantLevelDetail.aggregateCoverageVariantPercentage =
          this.coverageVariantLevels[i].aggregateCoverageVariantPercentage;
        coverageVariantLevelDetail.aggregateLimitType =
          this.coverageVariantLevels[i].aggregateLimitType;
        coverageVariantLevelDetail.aggregateMaxValue =
          this.coverageVariantLevels[i].aggregateMaxValue;
        if (i > 0)
          coverageVariantLevelDetail.multipleFactor = isNullOrUndefined(
            this.coverageVariantLevels[i].multipleFactor
          )
            ? i + 1
            : this.coverageVariantLevels[i].multipleFactor || i + 1;
        this.coverageVariantLevelDetails.push(coverageVariantLevelDetail);
      } else if (
        this.coverageVariantLevels[i]?.insuredObjectLevel?.length > 0
      ) {
        this.coverageVariantLevels[i].insuredObjectLevel.forEach((ins) => {
          this.insuredObjects.push({
            description:
              this.insuredObjectsData.find(
                (obj) => obj.msgId === ins.insuredObjectType.value
              )?.description || ins.insuredObjectType.value,
            maxAmount: ins.limit.maxAmount,
            aggregateLimitType: ins.limit.aggregateLimitType,
            aggregateMaxValue: ins.limit.aggregateMaxValue,
            aggregateCoverageVariantPercentage:
              ins.limit.aggregateCoverageVariantPercentage,
          });
        });
        const covLevelDetails = [...this.insuredObjects];
        covVariantLevelDetail.insuredObject = covLevelDetails;
        this.insuredObjects.splice(
          0,
          Object.entries(this.insuredObjects).length
        );
        covVariantLevelDetail.coverageLevelId =
          this.coverageVariantLevels[i]?.coverageVariantLevelId || '';
        covVariantLevelDetail.description =
          this.coverageLevelName + ' ' + (i + 1);
        const isCurrentVersion =
          this.coverageVariantLevels[i].isCurrentVersion ?? true;
        covVariantLevelDetail.isCurrentVersion = isCurrentVersion;
        covVariantLevelDetail.disableEdit = !isCurrentVersion;
        covVariantLevelDetail.aggregateCoverageVariantPercentage =
          this.coverageVariantLevels[i].aggregateCoverageVariantPercentage;
        covVariantLevelDetail.aggregateLimitType =
          this.coverageVariantLevels[i].aggregateLimitType;
        covVariantLevelDetail.aggregateMaxValue =
          this.coverageVariantLevels[i].aggregateMaxValue;
        if (i > 0)
          covVariantLevelDetail.multipleFactor = isNullOrUndefined(
            this.coverageVariantLevels[i].multipleFactor
          )
            ? i + 1
            : this.coverageVariantLevels[i].multipleFactor || i + 1;
        this.covVariantLevelDetails.push(covVariantLevelDetail);
      } else if (this.coverageVariantLevels[i]?.insuredEventLevel?.length > 0) {
        this.coverageVariantLevels[i].insuredEventLevel.forEach((ins) => {
          this.insuredEvents.push({
            description:
              this.insuredEventsData.find(
                (obj) => obj.code === ins.insuredEventType.value
              )?.description || ins.insuredEventType.value,
            maxAmount: ins.limit.maxAmount,
            aggregateLimitType: ins.limit.aggregateLimitType,
            aggregateMaxValue: ins.limit.aggregateMaxValue,
            aggregateCoverageVariantPercentage:
              ins.limit.aggregateCoverageVariantPercentage,
          });
        });
        const covLevelDetails = [...this.insuredEvents];
        covVariantLevelDetail.insuredEvent = covLevelDetails;
        this.insuredEvents.splice(0, Object.entries(this.insuredEvents).length);
        covVariantLevelDetail.coverageLevelId =
          this.coverageVariantLevels[i]?.coverageVariantLevelId || '';
        covVariantLevelDetail.description =
          this.coverageLevelName + ' ' + (i + 1);
        const isCurrentVersion =
          this.coverageVariantLevels[i].isCurrentVersion ?? true;
        covVariantLevelDetail.isCurrentVersion = isCurrentVersion;
        covVariantLevelDetail.disableEdit = !isCurrentVersion;
        covVariantLevelDetail.aggregateCoverageVariantPercentage =
          this.coverageVariantLevels[i].aggregateCoverageVariantPercentage;
        covVariantLevelDetail.aggregateLimitType =
          this.coverageVariantLevels[i].aggregateLimitType;
        covVariantLevelDetail.aggregateMaxValue =
          this.coverageVariantLevels[i].aggregateMaxValue;
        if (i > 0)
          covVariantLevelDetail.multipleFactor = isNullOrUndefined(
            this.coverageVariantLevels[i].multipleFactor
          )
            ? i + 1
            : this.coverageVariantLevels[i].multipleFactor || i + 1;
        this.covVariantLevelDetails.push(covVariantLevelDetail);
      }
      this.covVariantLevelDetails.map(
        (item: CovVariantLevelDetails, i: number) => {
          const orderNumber = Number(
            item.description.substring(this.coverageLevelName?.length)
          );
          item.order = !isNaN(orderNumber) ? orderNumber : i + 1;
          return item;
        }
      );
      this.covVariantLevelDetails = _.sortBy(this.covVariantLevelDetails, [
        'order',
      ]);
      this.coverageLevelsForm
        ?.get('coverageLevelsCount')
        ?.setValue(this.coverageVariantLevels?.length);
    }
    if (this._productContextService.isProductDisabled()) {
      this.coverageLevelsForm = this._fb.group({
        coverageLevelsCount: [
          { value: this.coverageVariantLevels?.length, disabled: true },
          [
            Validators.min(1),
            Validators.required,
            Validators.pattern(/^[1-9]\d*$/),
          ],
        ],
      });
    } else {
      this.fieldsetDisabled = false;
      this.coverageLevelsForm = this._fb.group({
        coverageLevelsCount: [
          {
            value: this.coverageVariantLevels?.length,
            disabled: !(this.coverageVariantLevels?.length > 0),
          },
          [
            Validators.min(1),
            Validators.required,
            Validators.pattern(/^[1-9]\d*$/),
          ],
        ],
      });
    }
  };

  private isMIApplicable = (insuredLevel: InsuredLevel): boolean => {
    return insuredLevel.insuredType.category == Category.INSURED &&
      insuredLevel.insuredType.value == InsuredTypeKeys.MAININSURED
      ? true
      : false;
  };

  private isSpouseApplicable(insuredLevel: InsuredLevel): boolean {
    return insuredLevel.insuredType.category == Category.INSURED &&
      insuredLevel.insuredType.value == InsuredTypeKeys.SPOUSE
      ? true
      : false;
  }

  private isDependentChildApplicable(insuredLevel: InsuredLevel): boolean {
    return insuredLevel.insuredType.category == Category.DEPENDENTTYPE &&
      insuredLevel.insuredType.value == DependentTypeKeys.CHILD
      ? true
      : false;
  }

  private isDependentAdultApplicable(insuredLevel: InsuredLevel): boolean {
    return insuredLevel.insuredType.category == Category.DEPENDENTTYPE &&
      insuredLevel.insuredType.value == DependentTypeKeys.ADULT
      ? true
      : false;
  }

  editLevel(event: any) {
    if (
      event.insuredObject != undefined &&
      event.insuredObject != null &&
      event.insuredObject.length
    ) {
      if (event.insuredObject[0]?.description) {
        this._router.navigate(
          [
            `products/${
              this.productId
            }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
              event.coverageLevelId
            }/edit`,
          ],
          {
            queryParams: { key: event.insuredObject[0]?.description.trimEnd() },
          }
        );
      }
    } else if (
      event.insuredEvent != undefined &&
      event.insuredEvent != null &&
      event.insuredEvent.length
    ) {
      if (event.insuredEvent[0]?.description) {
        this._router.navigate(
          [
            `products/${
              this.productId
            }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
              event.coverageLevelId
            }/edit`,
          ],
          {
            queryParams: { key: event.insuredEvent[0]?.description.trimEnd() },
          }
        );
      }
    } else {
      if (event.insuredLevel[0]?.isMIApplicable) {
        this._router.navigate([
          `products/${this.productId}/coveragevariants/${this.coverageVariantId}
        /variantLevels/${event.coverageLevelId}/update&type=maininsured`,
        ]);
      }
      if (event.insuredLevel[0]?.isSpouseApplicable) {
        this._router.navigate([
          `products/${this.productId}/coveragevariants/${this.coverageVariantId}
        /variantLevels/${event.coverageLevelId}/update&type=spouse`,
        ]);
      }
      if (event.insuredLevel[0]?.isDependentChildApplicable) {
        this._router.navigate([
          `products/${this.productId}/coveragevariants/${this.coverageVariantId}
        /variantLevels/${event.coverageLevelId}/update&type=child`,
        ]);
      }
      if (event.insuredLevel[0]?.isDependentAdultApplicable) {
        this._router.navigate([
          `products/${this.productId}/coveragevariants/${this.coverageVariantId}
        /variantLevels/${event.coverageLevelId}/update&type=adult`,
        ]);
      }
    }
  }

  previous() {
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
    ]);
  }

  saveAndExit() {
    //Save and exit button click
    this.saveCoverageVariantLevels();
  }

  saveAndNext() {
    if (!this._productContextService.isProductDisabled()) {
      this.saveCoverageVariantLevels(true);
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    } else {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    }
  }

  NavigateToCoverageLevels() {
    this._productContextService._setProductAggregateMaxValue(0);
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
    ]);
  }
  onChange(event: any) {
    console.log(event);
    this.rows = event.rows;
  }

  saveCoverageVariantLevels(isSave?: boolean) {
    const covVariantLevelsRequest = this._prepareRequestObject();
    //ForInsured
    if (this.coverageVariantLevelDetails?.length > 0) {
      for (let i = 0; i < this.coverageVariantLevelDetails?.length; i++) {
        //For updating the existing level
        if (!isEmpty(this.coverageVariantLevelDetails?.[i]?.coverageLevelId)) {
          const patchCoverageVariantLevelId =
            this.coverageVariantLevels?.[i]?.coverageVariantLevelId;
          covVariantLevelsRequest.coverageVariantLevels.push(
            this._preparePatchRequestObject(
              i,
              patchCoverageVariantLevelId,
              isSave
            )
          );
        }
        //For creating the new level
        else {
          covVariantLevelsRequest.coverageVariantLevels.push(
            this._preparePostRequestObject(i, isSave)
          );
        }
      }
      this._variantLevelService
        .upsertCoverageVariantLevel(
          this.productId,
          this.productVersionId,
          this.coverageVariantId,
          covVariantLevelsRequest
        )
        .subscribe({
          next: () => {
            this.getCoverageVariantLevels(
              this.productId,
              this.coverageVariantId,
              this.productVersionId
            );
            this._layoutService.showMessage({
              severity: 'success',
              message: 'Coverage Variant Level Saved Successfully',
              duration: 5000,
            });
          },
          error: (e) => {
            if (
              (e.error.errors && e.error.errors['PMERR000336']) ||
              (e.error.errors && e.error.errors['PMERR000337'])
            ) {
              this._layoutService.showMessage({
                severity: 'error',
                message: e.error.errors['PMERR000336']
                  ? e.error.errors['PMERR000336']
                  : e.error.errors && e.error.errors['PMERR000337'],
              });
            } else {
              this._layoutService.showMessage({
                severity: 'error',
                message: 'Unable to save data. Please try again later.',
                duration: 5000,
              });
            }
          },
        });
    }
    //For Insured Object
    else if (this.covVariantLevelDetails?.length > 0) {
      for (let i = 0; i < this.covVariantLevelDetails?.length; i++) {
        //For updating the existing level
        if (!isEmpty(this.covVariantLevelDetails?.[i]?.coverageLevelId)) {
          const patchCoverageVariantLevelId =
            this.covVariantLevelDetails?.[i]?.coverageLevelId;
          covVariantLevelsRequest.coverageVariantLevels.push(
            this._preparePatchRequestObject(
              i,
              patchCoverageVariantLevelId,
              isSave
            )
          );
        }
        //For creating the new level
        else {
          covVariantLevelsRequest.coverageVariantLevels.push(
            this._preparePostRequestObject(i, isSave)
          );
        }
      }
      this._variantLevelService
        .upsertCoverageVariantLevel(
          this.productId,
          this.productVersionId,
          this.coverageVariantId,
          covVariantLevelsRequest
        )
        .subscribe({
          next: (res) => {
            this.getCoverageVariantLevels(
              this.productId,
              this.coverageVariantId,
              this.productVersionId
            );
            this._layoutService.showMessage({
              severity: 'success',
              message: 'Coverage Variant Level Saved Successfully',
              duration: 5000,
            });
          },
          error: (e) => {
            if (
              (e.error.errors && e.error.errors['PMERR000336']) ||
              (e.error.errors && e.error.errors['PMERR000337'])
            ) {
              this._layoutService.showMessage({
                severity: 'error',
                message: e.error.errors['PMERR000336']
                  ? e.error.errors['PMERR000336']
                  : e.error.errors && e.error.errors['PMERR000337'],
              });
            } else {
              this._layoutService.showMessage({
                severity: 'error',
                message: 'Unable to save data. Please try again later.',
                duration: 5000,
              });
            }
          },
        });
    }
  }

  private _prepareRequestObject(): PostCoverageVariantLevelRequest {
    const { requestId } = this._productContextService._getProductContext();
    return {
      requestId:
        isEmpty(requestId) || isNullOrUndefined(requestId)
          ? crypto.randomUUID()
          : requestId,
      coverageVariantLevels: [],
    };
  }
  private _preparePatchRequestObject(
    index: number,
    coverageVariantLevelId?: string,
    isSave?: boolean
  ): CoverageVariantLevel {
    const coverageVariantLevel = this.updatedCoverageVariantLevels[index];

    if (this.coverageVariantLevelDetails?.length > 0) {
      for (let i = 0; i < coverageVariantLevel.insuredLevel?.length; i++) {
        if (this.coverageFactorPermutations) {
          coverageVariantLevel.insuredLevel[i].deductible = {} as Deductible;
          coverageVariantLevel.insuredLevel[i].limit = {} as Limit;
          coverageVariantLevel.insuredLevel[i].duration = {} as Duration;
        } else {
          coverageVariantLevel.insuredLevel[i].limit.maxAmount =
            this.coverageVariantLevelDetails[index].insuredLevel[i]?.maxAmount;
          coverageVariantLevel.insuredLevel[i].limit.aggregateLimitType =
            this.coverageVariantLevelDetails[index].insuredLevel[
              i
            ]?.aggregateLimitType;
          coverageVariantLevel.insuredLevel[
            i
          ].limit.aggregateCoverageVariantPercentage =
            this.coverageVariantLevelDetails[index].insuredLevel[
              i
            ]?.aggregateCoverageVariantPercentage;
          coverageVariantLevel.insuredLevel[i].limit.aggregateMaxValue =
            this.coverageVariantLevelDetails[index].insuredLevel[
              i
            ]?.aggregateMaxValue;
        }
      }
      coverageVariantLevel.description =
        this.coverageVariantLevelDetails[index].description;
      coverageVariantLevel.multipleFactor =
        this.coverageVariantLevelDetails[index].multipleFactor;
      coverageVariantLevel.aggregateMaxValue =
        this.coverageVariantLevelDetails[index].aggregateMaxValue;
    } else if (this.covVariantLevelDetails?.length > 0) {
      coverageVariantLevel.aggregateCoverageVariantPercentage =
        this.covVariantLevelDetails[index].aggregateCoverageVariantPercentage;
      coverageVariantLevel.aggregateLimitType =
        this.covVariantLevelDetails[index].aggregateLimitType;
      coverageVariantLevel.aggregateMaxValue =
        this.covVariantLevelDetails[index].aggregateMaxValue;
      for (
        let i = 0;
        i < coverageVariantLevel.insuredObjectLevel?.length;
        i++
      ) {
        coverageVariantLevel.insuredObjectLevel[i].limit.maxAmount =
          this.covVariantLevelDetails[index].insuredObject[i].maxAmount;
        coverageVariantLevel.insuredObjectLevel[i].limit.aggregateLimitType =
          this.coverageVariantLevels[0].insuredObjectLevel[
            i
          ].limit.aggregateLimitType;
        coverageVariantLevel.insuredObjectLevel[
          i
        ].limit.aggregateCoverageVariantPercentage =
          this.coverageVariantLevels[0].insuredObjectLevel[
            i
          ].limit.aggregateCoverageVariantPercentage;

        if (!isSave) {
          if (
            coverageVariantLevel.multipleFactor != undefined &&
            coverageVariantLevel.multipleFactor > 0
          ) {
            const aggregateLimitType =
              this.covVariantLevelDetails[index].insuredObject[i]
                .aggregateLimitType;
            coverageVariantLevel.insuredObjectLevel[i].limit.aggregateMaxValue =
              Number(
                coverageVariantLevel.insuredObjectLevel[i].limit
                  .aggregateMaxValue
              ) *
              (aggregateLimitType === 'PERCENTAGE'
                ? 1
                : this.covVariantLevelDetails[index].multipleFactor);
          } else {
            coverageVariantLevel.insuredObjectLevel[i].limit.aggregateMaxValue =
              Number(
                coverageVariantLevel.insuredObjectLevel[i].limit
                  .aggregateMaxValue
              );
          }
        }
      }

      for (let i = 0; i < coverageVariantLevel.insuredEventLevel?.length; i++) {
        coverageVariantLevel.insuredEventLevel[i].limit.maxAmount =
          this.covVariantLevelDetails[index].insuredEvent[i].maxAmount;
        coverageVariantLevel.insuredEventLevel[i].limit.aggregateLimitType =
          this.coverageVariantLevels[0].insuredEventLevel[
            i
          ].limit.aggregateLimitType;
        coverageVariantLevel.insuredEventLevel[
          i
        ].limit.aggregateCoverageVariantPercentage =
          this.coverageVariantLevels[0].insuredEventLevel[
            i
          ].limit.aggregateCoverageVariantPercentage;

        if (!isSave) {
          if (
            coverageVariantLevel.multipleFactor != undefined &&
            coverageVariantLevel.multipleFactor > 0
          ) {
            const aggregateLimitType =
              this.covVariantLevelDetails[index].insuredEvent[i]
                .aggregateLimitType;
            coverageVariantLevel.insuredEventLevel[i].limit.aggregateMaxValue =
              Number(
                coverageVariantLevel.insuredEventLevel[i].limit
                  .aggregateMaxValue
              ) *
              (aggregateLimitType === 'PERCENTAGE'
                ? 1
                : this.covVariantLevelDetails[index].multipleFactor);
          } else {
            coverageVariantLevel.insuredEventLevel[i].limit.aggregateMaxValue =
              Number(
                coverageVariantLevel.insuredEventLevel[i].limit
                  .aggregateMaxValue
              );
          }
        }
      }

      coverageVariantLevel.description =
        this.covVariantLevelDetails[index].description;
      coverageVariantLevel.multipleFactor =
        this.covVariantLevelDetails[index].multipleFactor;
    }
    coverageVariantLevel.requestId = crypto.randomUUID();
    coverageVariantLevel.coverageVariantLevelId =
      this.updatedCoverageVariantLevels[index].coverageVariantLevelId ||
      coverageVariantLevelId;
    return coverageVariantLevel;
  }

  private _preparePostRequestObject(
    index: number,
    isSave?: boolean
  ): CoverageVariantLevel {
    // For Insured
    if (this.coverageVariantLevelDetails?.length > 0) {
      return {
        coverageVariantLevelId:
          this.coverageVariantLevelDetails?.[index]?.coverageLevelId || '',
        description: this.coverageVariantLevelDetails[index].description,
        insuredLevel: this._prepareInsuredLevel(index, isSave),
        ruleSet: [],
        insuredObjectLevel: [],
        multipleFactor:
          this.coverageVariantLevelDetails?.[index]?.multipleFactor,
        requestId: crypto.randomUUID(),
        aggregateLimitType:
          this.coverageVariantLevelDetails[index].aggregateLimitType,
        aggregateMaxValue:
          this.coverageVariantLevelDetails[index].aggregateMaxValue,
        aggregateCoverageVariantPercentage:
          this.coverageVariantLevelDetails[index]
            .aggregateCoverageVariantPercentage,
        isCurrentVersion:
          this.coverageVariantLevelDetails[index].isCurrentVersion,
        insuredEventLevel: [],
      };
    }

    // For Insured Object
    else {
      return {
        coverageVariantLevelId:
          this.coverageVariantLevels?.[index]?.coverageVariantLevelId || '',
        description: this.covVariantLevelDetails?.[index]?.description,
        insuredLevel: [],
        ruleSet: [],
        insuredObjectLevel: this._prepareInsuredObjectLevel(index, isSave),
        multipleFactor: this.covVariantLevelDetails?.[index]?.multipleFactor,
        requestId: crypto.randomUUID(),
        aggregateLimitType:
          this.covVariantLevelDetails[index].aggregateLimitType,
        aggregateMaxValue: this.covVariantLevelDetails[index].aggregateMaxValue,
        aggregateCoverageVariantPercentage:
          this.covVariantLevelDetails[index].aggregateCoverageVariantPercentage,
        isCurrentVersion: this.covVariantLevelDetails[index].isCurrentVersion,
        insuredEventLevel: this._prepareInsuredEventLevel(index, isSave),
      };
    }
  }

  private _prepareInsuredLevel(
    index: number,
    isSave?: boolean
  ): InsuredLevel[] {
    const insuredLevels: InsuredLevel[] = [];

    for (
      let i = 0;
      i < this.coverageVariantLevelDetails[index].insuredLevel.length;
      i++
    ) {
      if (isSave) {
        this.aggregateMaxAmount = Number(
          this.coverageVariantLevels[0].insuredLevel[i].limit.aggregateMaxValue
        );
      } else {
        if (this.coverageFactorPermutations) {
          const level =
            this.updatedCoverageVariantLevels[index].insuredLevel[i];
          level.deductible = {} as Deductible;
          level.limit = {} as Limit;
          level.duration = {} as Duration;
          this.updatedCoverageVariantLevels[index].insuredLevel[i];
          insuredLevels.push(level);
        } else {
          const aggregateLimitType =
            this.coverageVariantLevels[0].insuredLevel[i].limit
              .aggregateLimitType;
          this.aggregateMaxAmount =
            Number(
              this.coverageVariantLevels[0].insuredLevel[i].limit
                .aggregateMaxValue
            ) *
            (aggregateLimitType === 'PERCENTAGE'
              ? 1
              : this.coverageVariantLevelDetails[index].multipleFactor);
          const insuredLevel: InsuredLevel = {
            insuredLevelId: '',
            insuredType: {
              value:
                this.coverageVariantLevels[0].insuredLevel[i].insuredType.value,
              category:
                this.coverageVariantLevels[0].insuredLevel[i].insuredType
                  .category,
            },

            limit: {
              limitId: crypto.randomUUID(),
              minType:
                this.coverageVariantLevels[0].insuredLevel[i].limit.minType,
              minAmount:
                this.coverageVariantLevels[0].insuredLevel[i].limit.minAmount,
              maxType:
                this.coverageVariantLevelDetails[index].insuredLevel[i].maxType,
              maxAmount:
                this.coverageVariantLevelDetails[index].insuredLevel[i]
                  .maxAmount,
              scope: this.coverageVariantLevels[0].insuredLevel[i].limit.scope,
              scopeValue:
                this.coverageVariantLevels[0].insuredLevel[i].limit.scopeValue,
              duration:
                this.coverageVariantLevels[0].insuredLevel[i].limit.duration,
              waitingPeriod:
                this.coverageVariantLevels[0].insuredLevel[i].limit
                  .waitingPeriod,
              waitingPeriodValue:
                this.coverageVariantLevels[0].insuredLevel[i].limit
                  .waitingPeriodValue,
              basecoverLevelId: '',
              options: [],
              aggregateLimitType:
                this.coverageVariantLevels[0].insuredLevel[i].limit
                  .aggregateLimitType,
              aggregateMaxValue: this.aggregateMaxAmount,
              aggregateCoverageVariantPercentage:
                this.coverageVariantLevels[0].insuredLevel[i].limit
                  .aggregateCoverageVariantPercentage,
            },
            deductible: {
              id: crypto.randomUUID(),
              deductibleType:
                this.coverageVariantLevels[0].insuredLevel[i].deductible
                  .deductibleType,
              type: this.coverageVariantLevels[0].insuredLevel[i].deductible
                .type,
              amount:
                this.coverageVariantLevels[0].insuredLevel[i].deductible.amount,
              baseCoverLevelId: '',
              options: [],
            },
            duration: {
              durationId: crypto.randomUUID(),
              type: this.coverageVariantLevels[0].insuredLevel[i].duration.type,
              quantity:
                this.coverageVariantLevels[0].insuredLevel[i].duration.quantity,
            },
          };
          insuredLevels.push(insuredLevel);
        }
      }
    }
    return insuredLevels;
  }

  private _prepareInsuredObjectLevel(
    index: number,
    isSave?: boolean
  ): InsuredObjectLevel[] {
    const insuredObjectLevels: InsuredObjectLevel[] = [];
    for (
      let i = 0;
      i < this.covVariantLevelDetails[index].insuredObject.length;
      i++
    ) {
      if (isSave) {
        this.aggregateMaxAmount = Number(
          this.coverageVariantLevels[0].insuredObjectLevel[i].limit
            .aggregateMaxValue
        );
      } else {
        const aggregateLimitType =
          this.coverageVariantLevels[0].insuredObjectLevel[i].limit
            .aggregateLimitType;
        this.aggregateMaxAmount =
          Number(
            this.coverageVariantLevels[0].insuredObjectLevel[i].limit
              .aggregateMaxValue
          ) *
          (aggregateLimitType === 'PERCENTAGE'
            ? 1
            : this.covVariantLevelDetails[index].multipleFactor);
      }
      const insuredObjectLevel: InsuredObjectLevel = {
        insuredObjectLevelId: '',
        insuredObjectType: {
          value:
            this.coverageVariantLevels[0].insuredObjectLevel[i]
              .insuredObjectType.value,
          category:
            this.coverageVariantLevels[0].insuredObjectLevel[i]
              .insuredObjectType.category,
        },

        limit: {
          limitId: crypto.randomUUID(),
          minType: '',
          minAmount: 0,
          maxType: 'AMT',
          maxAmount:
            this.covVariantLevelDetails[index].insuredObject[i].maxAmount,
          scope: '',
          scopeValue: '',
          duration: '',
          basecoverLevelId: '',
          options: [],
          aggregateLimitType:
            this.coverageVariantLevels[0].insuredObjectLevel[i].limit
              .aggregateLimitType,
          aggregateMaxValue: this.aggregateMaxAmount,
          aggregateCoverageVariantPercentage:
            this.coverageVariantLevels[0].insuredObjectLevel[i].limit
              .aggregateCoverageVariantPercentage,
        },
        deductible: {
          id: crypto.randomUUID(),
          type: '',
          amount: 0,
          baseCoverLevelId: '',
          options: [],
        },
        duration: {
          durationId: crypto.randomUUID(),
          type: '',
          quantity: '',
        },
      };
      insuredObjectLevels.push(insuredObjectLevel);
    }
    return insuredObjectLevels;
  }

  private _prepareInsuredEventLevel(
    index: number,
    isSave?: boolean
  ): InsuredEventLevel[] {
    const insuredEventLevels: InsuredEventLevel[] = [];
    for (
      let i = 0;
      i < this.covVariantLevelDetails[index].insuredEvent.length;
      i++
    ) {
      if (isSave) {
        this.aggregateMaxAmount = Number(
          this.coverageVariantLevels[0].insuredEventLevel[i].limit
            .aggregateMaxValue
        );
      } else {
        const aggregateLimitType =
          this.coverageVariantLevels[0].insuredEventLevel[i].limit
            .aggregateLimitType;
        this.aggregateMaxAmount =
          Number(
            this.coverageVariantLevels[0].insuredEventLevel[i].limit
              .aggregateMaxValue
          ) *
          (aggregateLimitType === 'PERCENTAGE'
            ? 1
            : this.covVariantLevelDetails[index].multipleFactor);
      }
      const insuredEventLevel: InsuredEventLevel = {
        insuredEventLevelId: '',
        insuredEventType: {
          value:
            this.coverageVariantLevels[0].insuredEventLevel[i].insuredEventType
              .value,
          category:
            this.coverageVariantLevels[0].insuredEventLevel[i].insuredEventType
              .category,
        },

        limit: {
          limitId: crypto.randomUUID(),
          minType: '',
          minAmount: 0,
          maxType: 'AMT',
          maxAmount:
            this.covVariantLevelDetails[index].insuredEvent[i].maxAmount,
          scope: '',
          scopeValue: '',
          duration: '',
          basecoverLevelId: '',
          options: [],
          aggregateLimitType:
            this.coverageVariantLevels[0].insuredEventLevel[i].limit
              .aggregateLimitType,
          aggregateMaxValue: this.aggregateMaxAmount,
          aggregateCoverageVariantPercentage:
            this.coverageVariantLevels[0].insuredEventLevel[i].limit
              .aggregateCoverageVariantPercentage,
        },
        deductible: {
          id: crypto.randomUUID(),
          type: '',
          amount: 0,
          baseCoverLevelId: '',
          options: [],
        },
        duration: {
          durationId: crypto.randomUUID(),
          type: '',
          quantity: '',
        },
      };
      insuredEventLevels.push(insuredEventLevel);
    }
    return insuredEventLevels;
  }

  updateMaxAmount(coverageLevelName: string, multiplicationFactor: number) {
    let numericFactor: number = Number(multiplicationFactor);
    if (this.coverageFactorPermutations) {
      if (numericFactor !== 0) {
        this.updatedCoverageVariantLevels
          .find((cov) => cov.description == coverageLevelName)
          ?.insuredLevel.forEach((ins) => {
            if (!isEmpty(ins.coverageFactorMapping)) {
              ins.coverageFactorMapping.coverageFactorCombinations.forEach(
                (combination) => {
                  combination.limit.maxAmount =
                    combination.limit.maxAmount * numericFactor;
                }
              );
            }
          });
      }
    } else {
      const firstCoverageLevelInsured =
        this.coverageVariantLevelDetails[0].insuredLevel;
      this.coverageVariantLevelDetails
        .find((cov) => cov.description == coverageLevelName)
        ?.insuredLevel.forEach((ins) => {
          let InsuredMaxAmount!: Insured;
          firstCoverageLevelInsured.find((firstCoverageLevel) => {
            if (
              firstCoverageLevel.isMIApplicable === true &&
              ins.isMIApplicable === true
            )
              InsuredMaxAmount = firstCoverageLevel;
            if (
              firstCoverageLevel.isSpouseApplicable === true &&
              ins.isSpouseApplicable === true
            )
              InsuredMaxAmount = firstCoverageLevel;
            if (
              firstCoverageLevel.isDependentChildApplicable === true &&
              ins.isDependentChildApplicable === true
            )
              InsuredMaxAmount = firstCoverageLevel;
            if (
              firstCoverageLevel.isDependentAdultApplicable === true &&
              ins.isDependentAdultApplicable === true
            )
              InsuredMaxAmount = firstCoverageLevel;
          });
          ins.maxAmount =
            multiplicationFactor * (InsuredMaxAmount?.maxAmount || 1);
        });
    }
  }

  handleModal() {
    this.openModal = !this.openModal;
  }

  onConfirm() {
    const coverageLevelsCount =
      this.coverageLevelsForm?.get('coverageLevelsCount')?.value - 1;
    this.openModal = !this.openModal;
    if (coverageLevelsCount == 0) {
      //Delete all the data and show create coverage level screen
      this.deleteLevel(this.deleteSelectedItem);
      this.isVariantLevelAvailable = false;
    }
  }

  deleteCvLevel(cvLevelId: string) {
    const coverageLevelsCount = this.coverageLevelsForm?.get(
      'coverageLevelsCount'
    )?.value;
    if (coverageLevelsCount == 1) {
      this.openModal = true;
    } else {
      this.coverageLevelsForm
        ?.get('coverageLevelsCount')
        ?.setValue(
          this.coverageLevelsForm?.get('coverageLevelsCount')?.value - 1
        );
      this.deleteLevel(cvLevelId);
    }
    this.openDeleteModal = false;
  }

  async deleteLevel(cvLevelId: string) {
    const toastMessageConfigGet = {
      warning: {
        severity: 'error',
        message: `Unable to delete coverge variant level`,
        duration: 5000,
      },
    };
    this.coverageVariantLevelService
      .deleteCoverageVariantLevel(
        this.productId,
        this.coverageVariantId,
        this.productVersionId,
        cvLevelId
      )
      .subscribe({
        next: () => {
          this.getCoverageVariantLevels(
            this.productId,
            this.coverageVariantId,
            this.productVersionId
          );
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfigGet['warning']);
        },
      });
  }

  /**
   * Based on count it will decide whether to add or remove the records
   * @returns it will call modal if we have given to delete(if given number is less than number of records) other wise it will add new records.
   */
  addLevels() {
    const coverageLevelsCount = this.coverageLevelsForm?.get(
      'coverageLevelsCount'
    )?.value;
    const currentCLCount = this.coverageVariantLevels?.length;
    if (currentCLCount === Number(coverageLevelsCount)) {
      return;
    } else if (currentCLCount <= Number(coverageLevelsCount)) {
      this.updateCVLevels();
    } else {
      this.openNumberOfLevelWarningModal = !this.openNumberOfLevelWarningModal;
    }
  }

  /**
   * It will open modal.
   */
  onNumberOfLevelsConfirm() {
    this.openNumberOfLevelWarningModal = false;
    this.updateCVLevels();
  }

  /**
   * Modal toggle
   */
  handleNumberOfLevelsModal() {
    this.openNumberOfLevelWarningModal = !this.openNumberOfLevelWarningModal;
  }

  updateCoverageFactorsLimitMaxAmount(currentCount: number) {
    const newVariantLevel = cloneDeep(this.coverageVariantLevels[0]);
    newVariantLevel.coverageVariantLevelId = '';
    newVariantLevel.description = this.coverageLevelName + ' ' + currentCount;
    newVariantLevel.insuredLevel.forEach((level) => {
      level.insuredLevelId = '';
      level.deductible = {} as Deductible;
      level.limit = {} as Limit;
      level.duration = {} as Duration;
      if (!isEmpty(level.coverageFactorMapping)) {
        level.coverageFactorMapping.aggregateMaxValue =
          level.coverageFactorMapping.aggregateMaxValue * currentCount;
        level.coverageFactorMapping.coverageFactorCombinations.forEach(
          (combination) => {
            combination.limit.maxAmount =
              combination.limit.maxAmount * currentCount;
          }
        );
      }
    });
    this.updatedCoverageVariantLevels.push(newVariantLevel);
  }

  /**
   * It will iterate data and calculate based on multifactor and will generate new data if the given count is greather than current records.
   * If given count is less than current records then it will remove records.
   */
  updateCVLevels() {
    const coverageLevelsCount = this.coverageLevelsForm?.get(
      'coverageLevelsCount'
    )?.value;
    let currentCLCount = this.coverageVariantLevelDetails?.length;
    //For insureds
    if (currentCLCount != 0) {
      if (currentCLCount <= Number(coverageLevelsCount)) {
        for (let index = currentCLCount; index < coverageLevelsCount; index++) {
          const currentCount = index + 1;
          const aggregateLimitType =
            this.covVariantLevelDetails?.[0]?.aggregateLimitType;
          const coverageVariantLevelDetail: CoverageVariantLevelDetail =
            new CoverageVariantLevelDetail();
          coverageVariantLevelDetail.description =
            this.coverageLevelName + ' ' + currentCount;
          coverageVariantLevelDetail.multipleFactor = currentCount;
          coverageVariantLevelDetail.isCurrentVersion = true;
          coverageVariantLevelDetail.disableEdit = true;
          coverageVariantLevelDetail.aggregateMaxValue =
            this.coverageVariantLevelDetails[0].aggregateMaxValue *
            (aggregateLimitType === 'PERCENTAGE' ? 1 : currentCount);
          coverageVariantLevelDetail.aggregateLimitType =
            this.coverageVariantLevelDetails[0].aggregateLimitType;
          coverageVariantLevelDetail.aggregateCoverageVariantPercentage =
            this.coverageVariantLevelDetails[0].aggregateCoverageVariantPercentage;
          Object.values(
            this.coverageVariantLevelDetails[0].insuredLevel
          ).forEach((val) =>
            coverageVariantLevelDetail.insuredLevel.push(Object.assign({}, val))
          );
          for (
            let i = 0;
            i < Object.values(coverageVariantLevelDetail.insuredLevel).length;
            i++
          ) {
            coverageVariantLevelDetail.insuredLevel[i].maxAmount =
              coverageVariantLevelDetail.insuredLevel[i].maxAmount *
              currentCount;
            coverageVariantLevelDetail.insuredLevel[i].aggregateMaxValue =
              coverageVariantLevelDetail.insuredLevel[i].aggregateMaxValue *
              currentCount;
          }
          this.coverageVariantLevelDetails.push(coverageVariantLevelDetail);
          if (this.coverageFactorPermutations) {
            this.updateCoverageFactorsLimitMaxAmount(currentCount);
          } else {
            const newVariantLevel = { ...this.coverageVariantLevels[0] };
            newVariantLevel.insuredLevel.forEach((level) => {
              level.limit.maxAmount * coverageVariantLevelDetail.multipleFactor,
                level.limit.aggregateMaxValue *
                  (aggregateLimitType === 'PERCENTAGE'
                    ? 1
                    : coverageVariantLevelDetail.multipleFactor);
            });
            this.updatedCoverageVariantLevels.push(newVariantLevel);
          }
        }
      } else {
        const newCount = this.coverageLevelsForm?.get(
          'coverageLevelsCount'
        )?.value;
        this.coverageVariantLevelDetails =
          this.coverageVariantLevelDetails.slice(0, newCount);
        this.updatedCoverageVariantLevels =
          this.updatedCoverageVariantLevels.slice(0, newCount);
      }
    }
    //For insured Objects
    else if (this.covVariantLevelDetails?.length > 0) {
      currentCLCount = this.covVariantLevelDetails?.length;
      if (currentCLCount <= Number(coverageLevelsCount)) {
        for (let index = currentCLCount; index < coverageLevelsCount; index++) {
          const currentCount = index + 1;
          const covVariantLevelDetail: CovVariantLevelDetails =
            new CovVariantLevelDetails();
          const aggregateLimitType =
            this.covVariantLevelDetails?.[0]?.aggregateLimitType;
          covVariantLevelDetail.description =
            this.coverageLevelName + ' ' + currentCount;
          covVariantLevelDetail.multipleFactor = currentCount;
          covVariantLevelDetail.isCurrentVersion = true;
          covVariantLevelDetail.disableEdit = true;
          covVariantLevelDetail.aggregateMaxValue =
            this.covVariantLevelDetails[0].aggregateMaxValue *
            (aggregateLimitType === 'PERCENTAGE' ? 1 : currentCount);
          covVariantLevelDetail.aggregateLimitType =
            this.covVariantLevelDetails[0].aggregateLimitType;
          covVariantLevelDetail.aggregateCoverageVariantPercentage =
            this.covVariantLevelDetails[0].aggregateCoverageVariantPercentage;

          if (
            this.covVariantLevelDetails[0].insuredObject &&
            this.covVariantLevelDetails[0].insuredObject.length > 0
          ) {
            Object.values(this.covVariantLevelDetails[0].insuredObject).forEach(
              (val) =>
                covVariantLevelDetail.insuredObject.push(Object.assign({}, val))
            );
            for (
              let i = 0;
              i < covVariantLevelDetail.insuredObject.length;
              i++
            ) {
              covVariantLevelDetail.insuredObject[i].maxAmount =
                covVariantLevelDetail.insuredObject[i].maxAmount * currentCount;
              covVariantLevelDetail.insuredObject[i].aggregateMaxValue =
                covVariantLevelDetail.insuredObject[i].aggregateMaxValue *
                (aggregateLimitType === 'PERCENTAGE' ? 1 : currentCount);
            }
            this.covVariantLevelDetails.push(covVariantLevelDetail);
            const newVariantLevel = { ...this.coverageVariantLevels[0] };
            newVariantLevel.insuredObjectLevel =
              newVariantLevel.insuredObjectLevel.map((lvl) => ({ ...lvl }));
            this.updatedCoverageVariantLevels.push(newVariantLevel);
          } else if (
            this.covVariantLevelDetails[0].insuredEvent &&
            this.covVariantLevelDetails[0].insuredEvent.length > 0
          ) {
            Object.values(this.covVariantLevelDetails[0].insuredEvent).forEach(
              (val) =>
                covVariantLevelDetail.insuredEvent.push(Object.assign({}, val))
            );
            for (
              let i = 0;
              i < covVariantLevelDetail.insuredEvent.length;
              i++
            ) {
              covVariantLevelDetail.insuredEvent[i].maxAmount =
                covVariantLevelDetail.insuredEvent[i].maxAmount * currentCount;
              covVariantLevelDetail.insuredEvent[i].aggregateMaxValue =
                covVariantLevelDetail.insuredEvent[i].aggregateMaxValue *
                (aggregateLimitType === 'PERCENTAGE' ? 1 : currentCount);
            }
            this.covVariantLevelDetails.push(covVariantLevelDetail);
            const newVariantEventLevel = { ...this.coverageVariantLevels[0] };
            newVariantEventLevel.insuredEventLevel =
              newVariantEventLevel.insuredEventLevel.map((lvl) => ({ ...lvl }));
            this.updatedCoverageVariantLevels.push(newVariantEventLevel);
          }
        }
      } else {
        const newCount = this.coverageLevelsForm?.get(
          'coverageLevelsCount'
        )?.value;
        this.covVariantLevelDetails = this.covVariantLevelDetails.slice(
          0,
          newCount
        );
        this.updatedCoverageVariantLevels =
          this.updatedCoverageVariantLevels.slice(0, newCount);
      }
    }

    this.updatedCoverageVariantLevels.map(
      (item: CoverageVariantLevel, i: number) => {
        const orderNumber = Number(
          item.description.substring(this.coverageLevelName?.length)
        );
        item.order = !isNaN(orderNumber) ? orderNumber : i + 1;
        return item;
      }
    );
    this.updatedCoverageVariantLevels = _.sortBy(
      this.updatedCoverageVariantLevels,
      ['order']
    );
    this.saveCoverageVariantLevels();
  }

  /**
   * It will return or provide the form controld data
   */
  get f() {
    return this.coverageLevelsForm?.controls['coverageLevelsCount'];
  }

  /**
   * It will check user data for calclate or generate multiple records.
   * @returns It will return error message based on validations
   */
  _setErrorMessages() {
    if (this.f?.errors?.['required']) {
      this.countErrorMessage = 'Number of levels is required.';
    } else if (this.f?.errors?.['pattern']) {
      this.countErrorMessage = 'Please enter a valid number.';
    } else {
      this.countErrorMessage = null;
    }
    return this.countErrorMessage;
  }

  /**
   * Track the data based on given field
   */
  trackByFn(index: number, level: any) {
    return level?.order;
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  enableDeleteConfirmation(cvLevelId: string) {
    this.openDeleteModal = true;
    this.deleteSelectedItem = cvLevelId;
  }

  deleteConfirmation() {
    this.deleteCvLevel(this.deleteSelectedItem);
  }
}
