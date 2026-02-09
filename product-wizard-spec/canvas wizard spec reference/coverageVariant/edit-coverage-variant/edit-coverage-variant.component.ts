/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  CommandsBarComponent,
  LayoutComponent,
  LayoutService,
} from '@canvas/components';
import { AppContextService } from '@canvas/services';
import {
  CbButtonModule,
  CbCheckboxModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbRadioModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbTextAreaModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { MessageService } from 'primeng/api';
import { ChipsModule } from 'primeng/chips';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { combineLatest } from 'rxjs';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { CategoryDataService } from '../../../services/category-data.service';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import {
  CategoryData,
  coveragespremiumregistration,
  CoverageVariant,
  CreateCoverageVariant,
  StandardCoverage,
} from '../../../types/coverage';
import { MasterData } from '../../../types/product';
import { Category } from '../../../types/ref-data';
import { coverageVariantData } from '../link-coverage-variant/models/coverage-variant.model';
import { EditCoverageVariantLabels } from './model/edit-coverage-variant.model';
@Component({
  selector: 'canvas-edit-coverage-variant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    CommandsBarComponent,
    CbInputModule,
    CbSelectChoiceModule,
    CbTextAreaModule,
    CbButtonModule,
    CbCheckboxModule,
    CbRadioModule,
    MultiSelectModule,
    RouterModule,
    ToastModule,
    CbTooltipModule,
    CbIconModule,
    ChipsModule,
    CbSelectMultipleModule,
    CbToggleModule,
    inputUnselectPipe,
  ],
  providers: [DatePipe, MessageService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './edit-coverage-variant.component.html',
  styleUrls: ['./edit-coverage-variant.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EditCoverageVariantComponent implements OnInit {
  cbToggleColorTheme = CbColorTheme.DEFAULT;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  showIcons = true;
  isVariants: boolean;
  isDisabled: boolean;
  isDisabledCoverageCodeClear: boolean;
  isDisableButton = false;

  coverageVariants!: CoverageVariant[];
  productClass!: CategoryData[];
  coverageType!: MasterData[];

  selectedProductClass?: string;
  selectedCoverageType?: MasterData;
  selectedCoverageTypeValue?: string;
  editCoverageVariant: CoverageVariant = {
    coverageVariantId: '',
    description: '',
    name: '',
    marketingName: '',
    lastUpdated: '',
    productClass: {
      value: '',
      category: '',
    },
    type: {
      value: '',
      category: '',
    },
    id: '',
    relatedCoverageVariantIds: [],
    allocationPercent: 0,
    coveragespremiumregistration: [],
    subCoverages: [],
    isCurrentVersion: true,
  };

  //multichecox
  selectAllCoverageCode = false;
  standardCoverages!: StandardCoverage[];
  standardCoverageValues: string[] = [];
  tempData: string[] = [];
  isCoverageCode: boolean;
  standardCoverage!: StandardCoverage;
  selectedStandardCoverages: StandardCoverage[] = [];
  isCoverageCodeDropDown: boolean;

  coverageVariantId: string;
  productId?: string;
  productVersionId?: string;
  coverageVariantList: CoverageVariant[] = [];
  selectedVariantValues: (string | undefined)[] = [];
  selectedVariantValueIds: (string | undefined)[] = [];
  selectedProductClassData?: CategoryData = {
    value: '',
    category: '',
    description: '',
  };
  selectedCoverageTypeData?: MasterData;
  coveragespremiumregistration: coveragespremiumregistration;
  status?: string;
  fieldsetDisabled = false;
  isDisable = false;
  coverageVariantName: string;
  isDisabledCoverageClear = false;
  coverageDescMaxLength = 1000;
  labels: EditCoverageVariantLabels;
  countrySettingsData: any = [];
  coverageVariantData: coverageVariantData;

  constructor(
    private _coverageVariantService: CoverageVariantService,
    private _categoryDataService: CategoryDataService,
    private _layoutService: LayoutService,
    private _router: Router,
    private _productService: ProductsService,
    private readonly _appContext: AppContextService,
    private _productContextService: ProductContextService,
    private _sharedService: SharedService
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
      this._productContextService._setCoverageVariantId(this.coverageVariantId);
    }
    if (
      localStorage.getItem('coverageVariantName') != null ||
      localStorage.getItem('coverageVariantName') != undefined
    ) {
      this.coverageVariantName =
        localStorage.getItem('coverageVariantName') || '';
    }
    this.coverageVariantData =
      this._productContextService._getCoverageVariantData();
    this.labels = this._appContext.get(
      'pages.product.edit-coverage-variant.labels'
    ) as EditCoverageVariantLabels;
    this._updateLayout();
  }

  /* function to update the layout */
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
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    this.getCoverageVariantById();
    this.getCountrySettingList();

    if (this._productContextService.isProductDisabled()) {
      this.fieldsetDisabled = true;
      this.isDisableButton = true;
      this.isDisable = true;
      this.isCoverageCode = true;
    } else {
      this.fieldsetDisabled = false;
      this.isCoverageCode = false;
    }
  }

  getCategoryData() {
    combineLatest([
      this._categoryDataService.getProductClass(),
      this._categoryDataService.getCoverageType(),
    ]).subscribe(([res1, res2]) => {
      this.productClass = res1;
      this.coverageType = res2;
      // if(this.coverageVariantData!=null && (!isEmpty(this.coverageVariantData))){
      //    this.selectedProductClass=this.productClass.filter(x=>x.description===this.coverageVariantData.productClass)[0].value;
      //   // this.standardCoverageValues=this.coverageVariantData.standardCoverage;
      //    this.editCoverageVariant.name=this.coverageVariantData.coverageVariantName;
      //    this.editCoverageVariant.coverageVariantId=this.coverageVariantData.coverageVariantId;
      //    //this.selectedStandardCoverages=this.coverageVariantData.
      //  //this.onProductClassChange(this.selectedProductClass);
      //   this.getCoverageCodesByProductClassId(this.selectedProductClass);
      // }
    });

    this.getCoverageVariants();
    this.isCoverageCodeDropDown = false;
  }

  getCoverageVariantById() {
    this._coverageVariantService
      .getCoverageVariant(
        this.coverageVariantId,
        this.productId,
        this.productVersionId
      )
      .subscribe({
        next: (data) => {
          this.editCoverageVariant = data;
          this._productService.setInsuredIndividual(
            data?.insured?.individual ? true : false
          );
          this.bindDetails(this.editCoverageVariant);
          this.storeProductClass();
          this.getCategoryData();
        },
      });
  }

  UpdateCoverageVariant(moveToNext?: boolean): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: `Coverage variant ${this.coverageVariantId} updated successfully.`,
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: `Failed to update coverage variant ${this.coverageVariantId}, error occured.`,
        duration: 5000,
      },

      warning: {
        severity: 'warn',
        message: 'Product could not be updated as it is in Final status',
        duration: 5000,
      },
    };
    const variantName = this.editCoverageVariant.name;
    this.selectedProductClassData = this.productClass.find(
      (x) => x.value == this.selectedProductClass
    );
    const type = this.coverageType.find(
      (item) => item.code === this.selectedCoverageTypeValue
    );

    if (this.validateVariantName(variantName) && this.ValidateMandatory()) {
      const data: CreateCoverageVariant = {
        coverageVariantId: this.editCoverageVariant.coverageVariantId,
        description: this.editCoverageVariant.description,
        name: this.editCoverageVariant.name,
        productClass: this.selectedProductClassData,
        type: {
          value: type?.code,
          category: Category.CVT,
        },
        isPeril: this.editCoverageVariant.isPeril,
        isRateBearing: this.editCoverageVariant.isRateBearing,
        is3rdParty: this.editCoverageVariant.is3rdParty,
        relatedCoverageVariantIds:
          this.editCoverageVariant.relatedCoverageVariantIds,
        allocationPercent: this.editCoverageVariant.allocationPercent,
        insured: this.editCoverageVariant.insured,
        insuredObjects: this.editCoverageVariant.insuredObjects,
        coverageFactors: this.editCoverageVariant.coverageFactors,
        insuredEvents: this.editCoverageVariant.insuredEvents,
        coverageVariantLevels: this.editCoverageVariant.coverageVariantLevels,
        subCoverages: this.editCoverageVariant.subCoverages,
        coveragespremiumregistration: this.bindCoverageCode(
          this.selectedStandardCoverages
        ),
        exclusions: this.editCoverageVariant.exclusions,
        requestId: crypto.randomUUID(),
        isCurrentVersion: this.editCoverageVariant.isCurrentVersion,
      };

      this._coverageVariantService
        .updateCoverageVariant(
          data,
          this.coverageVariantId,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage(toastMessageConfig['success']);
            if (moveToNext) {
              setTimeout(() => {
                this._sharedService.nextButtonClicked.next({ stepCount: 1 });
              }, 10);
            } else {
              this._router.navigate(['products']);
            }
          },
          error: (res) => {
            const { errors } = res.error ?? [];
            const errorCodes = Object.keys(errors);
            if (errors && !isNullOrUndefined(errorCodes)) {
              const errorMessage = errors[errorCodes[0]][0];
              this._layoutService.showMessage({
                severity: 'error',
                message: errorMessage,
                duration: 5000,
              });
            } else {
              this._layoutService.showMessage(toastMessageConfig['error']);
            }
          },
        });
    }
  }

  ValidateMandatory() {
    let MandatoryFields = true;
    const toastMessageConfig = {
      isProductClass: {
        severity: 'error',
        message: 'Product class is Mandatory, error occured.',
        duration: 5000,
      },
      isStdCoverageCode: {
        severity: 'error',
        message: 'Stanadrd coverage code is mandatory, error occured.',
        duration: 5000,
      },
      isCoverageType: {
        severity: 'error',
        message: 'Coverage variant type is mandatory, error occured.',
        duration: 5000,
      },
      isCoverageId: {
        severity: 'error',
        message: 'Coverage variant ID is mandatory, error occured.',
        duration: 5000,
      },
      productIdSpaceErrorMessage: {
        severity: 'error',
        message: this.labels.productIdSpaceErrorMessage,
      },
    };
    if (!this.selectedProductClassData) {
      this._layoutService.showMessage(toastMessageConfig['isProductClass']);
      MandatoryFields = false;
    }
    if (this.selectedStandardCoverages?.length == 0) {
      this._layoutService.showMessage(toastMessageConfig['isStdCoverageCode']);
      MandatoryFields = false;
    }
    if (!this.selectedCoverageTypeValue) {
      this._layoutService.showMessage(toastMessageConfig['isCoverageType']);
      MandatoryFields = false;
    }
    if (!this.editCoverageVariant.coverageVariantId) {
      this._layoutService.showMessage(toastMessageConfig['isCoverageId']);
      MandatoryFields = false;
    }
    if (
      this._productService.noSpecialCharactersCheck(
        this.editCoverageVariant.coverageVariantId || ''
      )
    ) {
      this._layoutService.showMessage(
        toastMessageConfig['productIdSpaceErrorMessage']
      );
      MandatoryFields = false;
    }
    return MandatoryFields;
  }

  navigateCoverageVariant() {
    this._router.navigate([`products/${this.productId}/coveragevariant`]);
  }

  validateVariantName(variantName: string | undefined) {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: 'Enter Coverage variant name',
        duration: 4000,
      },
    };
    if (variantName == '' || variantName == undefined) {
      this._layoutService.showMessage(toastMessageConfig['error']);
      return false;
    } else return true;
  }

  isDuplicate(variantName: string | undefined) {
    return this.coverageVariants.find((variant) => {
      if (variant.name == variantName) {
        return true;
      } else {
        return false;
      }
    });
  }

  onProductClassChange(selectedProductsClassValue: string | undefined) {
    const prodClass = this.productClass?.find(
      (x) => x.value === selectedProductsClassValue
    );
    localStorage.setItem('ProductClass', prodClass?.value as string);
    this.isCoverageCodeDropDown = false;
    this.selectedStandardCoverages = [];
    this.standardCoverageValues = [];
    this.getCoverageCodesByProductClassId(selectedProductsClassValue);
  }

  getCoverageCodesByProductClassId(productClassSelected: string | undefined) {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: `Failed to load standard coverage codes for selected product class.`,
        duration: 5000,
      },
    };
    this._categoryDataService.getProductClass().subscribe((res) => {
      this.productClass = res;
      const productClassId = this.productClass
        ?.filter((x) => x.value == productClassSelected)
        .map((x) => x.value);
      if (productClassId) {
        this._coverageVariantService
          .getStandardCoverage(productClassId)
          .subscribe({
            next: (data) => {
              this.standardCoverages = data;
              this.bindCoverageCodesdropdown(this.standardCoverages);
              this.isCoverageCodeDropDown = false;
              // if(this.coverageVariantData!=null && (!isEmpty(this.coverageVariantData))&& this.coverageVariantData.standardCoverage.length>0){
              //   let selectedCodes:StandardCoverage;
              //   this.selectedStandardCoverages=[];
              //   this.standardCoverageValues=[];
              //   for(let i=0;i<this.coverageVariantData.standardCoverage.length;i++){
              //     const codes=this.coverageVariantData.standardCoverage[i].split(' - ');
              //     selectedCodes=this.standardCoverages.filter(x=>x.coverageCode===codes[0])[0];

              //     this.selectedStandardCoverages.push(selectedCodes);
              //     this.standardCoverageValues.push(selectedCodes.coverageCodeDescription);
              //   }

              //     this.selectedProductClass=this.productClass.filter(x=>x.description===this.coverageVariantData.productClass)[0].value;
              //    // this.standardCoverageValues=this.coverageVariantData.standardCoverage;
              //     this.editCoverageVariant.name=this.coverageVariantData.coverageVariantName;
              //     this.editCoverageVariant.coverageVariantId=this.coverageVariantData.coverageVariantId;
              //   }
            },
            error: () => {
              this._layoutService.showMessage(toastMessageConfig['error']);
              this.standardCoverages = [];
              this.bindCoverageCodesdropdown(this.standardCoverages);
              this.isCoverageCodeDropDown = false;
            },
          });
      }
    });
  }

  bindCoverageCodesdropdown(data: StandardCoverage[]) {
    this.standardCoverages = data.map((codeDesc: StandardCoverage) => {
      return {
        country: codeDesc.country,
        statTableId: codeDesc.statTableId,
        prodClass: codeDesc.prodClass,
        statLine: codeDesc.statLine,
        covPctOthr: codeDesc.covPctOthr,
        statIdCat: codeDesc.statIdCat,
        status: codeDesc.status,
        recIncomplete: codeDesc.recIncomplete,
        lastUpdatedBy: codeDesc.lastUpdatedBy,
        coverageCode: codeDesc.coverageCode,
        coverageDesc: codeDesc.coverageDesc,
        geniusSection: codeDesc.geniusSection,
        geniusCover: codeDesc.geniusCover,
        geniusTime: codeDesc.geniusTime,
        id: '',
        allocationPercent: codeDesc.allocationPercent,
        coverageCodeDescription:
          codeDesc.coverageCode +
          ' - ' +
          codeDesc.coverageDesc +
          ' - ' +
          codeDesc.geniusCover.value,
      };
    });
    // this.selectedStandardCoverages= this.selectedStandardCoverages?.filter((item) => {return this.standardCoverageValues.find((variant) => item.coverageCodeDescription == variant)});
  }

  onCoverageCodeChange() {
    this.standardCoverageValues = this.selectedStandardCoverages.map(function (
      a
    ) {
      return a.coverageCodeDescription;
    });
    if (this.standardCoverageValues.length <= 0) {
      this.isDisabledCoverageCodeClear = true;
    } else {
      this.isDisabledCoverageCodeClear = false;
    }
  }

  /* trigger the event on model change of chips */
  onCoverageChipStateChange(event: any) {
    this.standardCoverageValues = event;
    this.selectedStandardCoverages = this.selectedStandardCoverages.filter(
      (selectedStandardCoverages) => {
        return event.find(
          (state: any) =>
            selectedStandardCoverages.coverageCodeDescription == state
        );
      }
    );
    if (this.standardCoverageValues.length <= 0) {
      this.isDisabledCoverageCodeClear = true;
    } else {
      this.isDisabledCoverageCodeClear = false;
    }
  }

  storeProductClass() {
    localStorage.setItem('ProductClass', this.selectedProductClass || '');
  }
  bindDetails(coverageVariant: CoverageVariant) {
    this.editCoverageVariant.name = coverageVariant.name;
    this.editCoverageVariant.description = coverageVariant.description;
    this.editCoverageVariant.type = coverageVariant.type;
    this.selectedProductClass = coverageVariant.productClass?.value;
    this.getCoverageCodesByProductClassId(this.selectedProductClass);
    this.selectedCoverageType = {
      description: coverageVariant.type?.value,
      code: coverageVariant.type?.value,
    };
    this.selectedCoverageTypeValue = coverageVariant.type?.value;
    this.editCoverageVariant.productClass = coverageVariant.productClass;
    this.selectedVariantValueIds = coverageVariant.relatedCoverageVariantIds;

    this.selectedStandardCoverages = this.bindStandardCoverages(
      coverageVariant.coveragespremiumregistration
    );
    this.standardCoverageValues = this.selectedStandardCoverages.map(
      (x) => x.coverageCodeDescription
    );
    this.tempData = this.standardCoverageValues;
    this.editCoverageVariant.coverageVariantId =
      coverageVariant.coverageVariantId;
    this.editCoverageVariant.is3rdParty = coverageVariant.is3rdParty;
    this.editCoverageVariant.isRateBearing = coverageVariant.isRateBearing;
    this.editCoverageVariant.isPeril = coverageVariant.isPeril;
    this.editCoverageVariant.insured = coverageVariant.insured;
    this.editCoverageVariant.insuredObjects = coverageVariant.insuredObjects;
    this.editCoverageVariant.insuredEvents = coverageVariant.insuredEvents;
    this.editCoverageVariant.coverageFactors = coverageVariant.coverageFactors;
    this.editCoverageVariant.subCoverages = coverageVariant.subCoverages;
    this.editCoverageVariant.coverageVariantLevels =
      coverageVariant.coverageVariantLevels;
    this.editCoverageVariant.exclusions = coverageVariant.exclusions;
  }

  bindStandardCoverages(
    standardCoverageCode: coveragespremiumregistration[] | undefined
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const coverageCodeList: StandardCoverage[] = standardCoverageCode!.map(
      (std) => {
        return {
          coverageId: std.coverageId,
          coverageCode: std.stdCoverageCode,
          coverageDesc: std.stdCoverageDescription,
          geniusSection: std.geniusSection,
          geniusCover: std.geniusCoverage,
          geniusTime: std.geniusTimeHazard,
          coverageLevels: std.coverageLevels,
          requestId: std.requestId,
          allocationPercent: std.allocationPercent,
          country: '',
          statTableId: '',
          prodClass: 0,
          statLine: '',
          covPctOthr: 0,
          statIdCat: '',
          status: 0,
          recIncomplete: 0,
          lastUpdatedBy: '',
          id: '',
          coverageCodeDescription: isNullOrUndefined(std.geniusCoverage)
            ? std.stdCoverageCode + ' - ' + std.stdCoverageDescription
            : std.stdCoverageCode +
              ' - ' +
              std.stdCoverageDescription +
              ' - ' +
              std.geniusCoverage.value,
        };
      }
    );
    return coverageCodeList;
  }

  bindCoverageCode(standardCoverageCode: StandardCoverage[]) {
    if (
      JSON.stringify(this.tempData) !=
      JSON.stringify(this.standardCoverageValues)
    ) {
      const coverageCodeList: coveragespremiumregistration[] =
        standardCoverageCode.map((std) => {
          return {
            coverageId: std.coverageCode,
            stdCoverageCode: std.coverageCode,
            stdCoverageDescription: std.coverageDesc?.includes('-')
              ? std.coverageDesc
                  ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                  .trim()
              : std.coverageDesc,
            meridianStatLineCode: std.statLine,
            geniusCoverage: std.geniusCover,
            geniusTimeHazard: std.geniusTime,
            coverageBookingSystem: 'genius',
            stdCoverageDefinedBy: '',
            geniusSection: std.geniusSection,
            coverageLevels: [],
            requestId: crypto.randomUUID(),
            allocationPercent: Math.floor(100 / standardCoverageCode.length),
            coverageCodeDescription: isNullOrUndefined(std.geniusCover)
              ? std.coverageCode +
                ' - ' +
                (std.coverageDesc?.includes('-')
                  ? std.coverageDesc
                      ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                      .trim()
                  : std.coverageDesc)
              : std.coverageCode +
                ' - ' +
                (std.coverageDesc?.includes('-')
                  ? std.coverageDesc
                      ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                      .trim()
                  : std.coverageDesc) +
                ' - ' +
                std.geniusCover.value,
          };
        });
      const rem = 100 % standardCoverageCode.length;
      for (let i = 0; i < rem; i++) {
        coverageCodeList[i].allocationPercent++;
      }
      return coverageCodeList;
    } else {
      const coverageCodeList: coveragespremiumregistration[] =
        standardCoverageCode.map((std) => {
          return {
            coverageId: std.coverageCode,
            stdCoverageCode: std.coverageCode,
            stdCoverageDescription: std.coverageDesc?.includes('-')
              ? std.coverageDesc
                  ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                  .trim()
              : std.coverageDesc,
            meridianStatLineCode: std.statLine,
            geniusCoverage: std.geniusCover,
            geniusTimeHazard: std.geniusTime,
            coverageBookingSystem: 'genius',
            stdCoverageDefinedBy: '',
            geniusSection: std.geniusSection,
            coverageLevels: [],
            requestId: crypto.randomUUID(),
            allocationPercent: std.allocationPercent ? std.allocationPercent:100,
            coverageCodeDescription: isNullOrUndefined(std.geniusCover)
              ? std.coverageCode +
                ' - ' +
                (std.coverageDesc?.includes('-')
                  ? std.coverageDesc
                      ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                      .trim()
                  : std.coverageDesc)
              : std.coverageCode +
                ' - ' +
                (std.coverageDesc?.includes('-')
                  ? std.coverageDesc
                      ?.slice(0, std.coverageDesc.lastIndexOf('-'))
                      .trim()
                  : std.coverageDesc) +
                ' - ' +
                std.geniusCover.value,
          };
        });
      return coverageCodeList;
    }
  }

  getCoverageVariants(): void {
    this._coverageVariantService
      .getCoverageVariants(this.productId, this.productVersionId)
      .subscribe({
        next: (data) => {
          if (data) {
            this.coverageVariants = data.filter(
              (x) => x.coverageVariantId !== this.coverageVariantId
            );
            this.isVariants = this.coverageVariants.length <= 0 ? true : false;
            this.coverageVariantList = this.coverageVariants?.filter((item) => {
              return this.selectedVariantValueIds.find(
                (variant) => item.coverageVariantId == variant
              );
            });
            this.selectedVariantValues =
              this.coverageVariants
                ?.filter((item) => {
                  return this.selectedVariantValueIds.find(
                    (variant) => item.coverageVariantId == variant
                  );
                })
                .map((x) => x.name) || [];
          }
        },
      });
  }

  previous(): void {
    this._router.navigate([`/products/${this.productId}/coveragevariant`]);
  }
  submit() {
    this._sharedService.nextButtonClicked.next({ stepCount: 1 });
  }
  updateAndExit(): void {
    this.UpdateCoverageVariant(false);
  }

  updateAndNext(): void {
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    } else {
      this.UpdateCoverageVariant(true);
    }
  }

  /* trigger the event on model change of chips */
  onChipVariantChange(event: (string | undefined)[]) {
    this.coverageVariantList = this.coverageVariantList?.filter(
      (coverageVariantList) => {
        return event.find((variant) => coverageVariantList.name == variant);
      }
    );
    this.editCoverageVariant.relatedCoverageVariantIds =
      this.coverageVariantList
        .filter((x) => !!x.name)
        .map((x) => x.coverageVariantId as string);
    this.selectedVariantValues = this.coverageVariantList?.map(
      (x) => x.name as string
    );
    if (this.selectedVariantValues && this.selectedVariantValues.length <= 0) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  /* on deletion on chips updating the multiselect dropdown model */
  clearCoverageSelection() {
    this.selectedStandardCoverages = [];
    this.standardCoverageValues = [];
    this.isDisabledCoverageClear = true;
  }

  onVariantChange() {
    if (this.coverageVariantList)
      this.editCoverageVariant.relatedCoverageVariantIds =
        this.coverageVariantList
          .filter((x) => !!x.name)
          .map((x) => x.coverageVariantId as string);
    this.selectedVariantValues = this.coverageVariantList?.map((x) => x.name);
    if (this.selectedVariantValues && this.selectedVariantValues.length <= 0) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  /* on deletion on chips updating the multiselect dropdown model */
  clearSelection() {
    this.selectedVariantValues = [];
    this.editCoverageVariant.relatedCoverageVariantIds = [];
    this.coverageVariantList = [];
    this.isDisabled = true;
  }
  linkExistingCoverages() {
    const country = this._productContextService._getProductContext().country[0];
    const productClassdesc = this.productClass.filter(
      (x) => x.value === this.selectedProductClass
    )[0].description;
    const productClass = productClassdesc?.trimEnd().replace(' ', '-');
    const filteredCountry = this.countrySettingsData.filter(
      (x: any) => x.countryCode == country
    )[0].country;
    this._router.navigate(
      [
        `/products/${this.productId}/coveragevariant/${filteredCountry}/${productClass}/linkCoverageVariant`,
      ],
      {
        queryParams: {
          country: filteredCountry,
          productClass: productClassdesc,
        },
      }
    );
  }
  getCountrySettingList() {
    const countrySettingUrl =
      '/canvas/api/catalyst/country-settings?languageKey=229';
    this._productService.getCountrySettings(countrySettingUrl).subscribe({
      next: (settingsRes) => {
        this.countrySettingsData = settingsRes.data;
      },
      error: (settingsErr) => {
        console.error('Error fetching country settings:', settingsErr);
      },
    });
  }
}
