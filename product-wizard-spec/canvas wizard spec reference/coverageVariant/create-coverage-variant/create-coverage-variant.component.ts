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
import { LayoutService } from '@canvas/components';
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
import { isEmpty } from 'lodash-es';
import { MessageService } from 'primeng/api';
import { ChipsModule } from 'primeng/chips';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
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
import { CreateCoverageVariantLabels } from './model/create-coverage-variant.model';
@Component({
  selector: 'canvas-create-coverage-variant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CbSelectChoiceModule,
    CbTextAreaModule,
    CbButtonModule,
    FormsModule,
    CbCheckboxModule,
    CbRadioModule,
    MultiSelectModule,
    RouterModule,
    ToastModule,
    CbToggleModule,
    CbTooltipModule,
    CbIconModule,
    ChipsModule,
    CbSelectMultipleModule,
    inputUnselectPipe,
    CbInputModule,
  ],
  providers: [DatePipe, MessageService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './create-coverage-variant.component.html',
  styleUrls: ['./create-coverage-variant.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateCoverageVariantComponent implements OnInit {
  checkboxcolortheme = CbColorTheme.DEFAULT;
  cbToggleColorTheme = CbColorTheme.DEFAULT;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  showIcons = true;

  coverageVariants!: CoverageVariant[];
  productClass!: CategoryData[];
  coverageType!: MasterData[];
  selectedCoverageType!: MasterData;
  coverageVariantList: CoverageVariant[];
  selectedCoverageVariatnList: string[] = [];

  coverageVariantId: string;
  productId: string;
  productVersionId: string;

  selectedVariantValues: (string | undefined)[] = [];
  isVariants: boolean;
  isDisabled: boolean;
  isDisabledCoverageClear: boolean;

  //multichecox
  selectAllCoverageCode = false;
  standardCoverages!: StandardCoverage[];
  standardCoverageValues: string[] = [];
  isCoverageCode: boolean;
  standardCoverage!: StandardCoverage;
  selectedStandardCoverages: StandardCoverage[] = [];
  selectedProductClass: CategoryData;
  isCoverageCodeDropDown: boolean;
  coveragespremiuRregistrationData?: coveragespremiumregistration[];
  coverageDescMaxLength = 1000;
  addCoverageVariant: CoverageVariant = {
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

  labels: CreateCoverageVariantLabels;
  coverageVariantData: coverageVariantData;
  countrySettingsData: any = [];

  constructor(
    private datePipe: DatePipe,
    private _coverageVariantService: CoverageVariantService,
    private _categoryDataService: CategoryDataService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private readonly _appContext: AppContextService,
    private _router: Router,
    private _productService: ProductsService,
    private messageService: MessageService,
    private _productContextService: ProductContextService
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
    this.coverageVariantData =
      this._productContextService._getCoverageVariantData();
    this.labels = this._appContext.get(
      'pages.product.create-coverage-variant.labels'
    ) as CreateCoverageVariantLabels;
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
        label: 'Details',
        routerLink: `/products/${this.productId}/coveragevariant`,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    this.getCategoryData();
    this.getCoverageVariants();
    this.getCountrySettingList();
  }

  getCategoryData() {
    this._categoryDataService.getCoverageType().subscribe((res) => {
      this.coverageType = res;
    });
    this._categoryDataService.getProductClass().subscribe((res) => {
      this.productClass = res;
      this.isCoverageCodeDropDown = true;
      if (
        this.coverageVariantData != null &&
        !isEmpty(this.coverageVariantData) &&
        this.coverageVariantData.coverageVariantName != '' &&
        this.coverageVariantData.coverageVariantId != ''
      ) {
        //this.standardCoverageValues=this.coverageVariantData.standardCoverage;
        const prodClass = this.productClass.filter(
          (x) => x.description === this.coverageVariantData.productClass
        )[0];
        if (prodClass != undefined && prodClass.value != undefined) {
          this.selectedProductClass = prodClass;
          this.getCoverageCodesByProductClassId(prodClass);
        }
        this.isCoverageCodeDropDown = false;
      }
    });
  }

  onProductClassChange(selectedProductsClassValue: CategoryData) {
    const prodClass = this.productClass?.find(
      (x) => x.value === selectedProductsClassValue.value
    );
    localStorage.setItem('ProductClass', prodClass?.value as string);
    if (prodClass !== undefined) {
      this._productContextService._setProductClass(prodClass.description as string);
      this.isCoverageCodeDropDown = false;
    } else this.isCoverageCodeDropDown = true;
    this.selectedStandardCoverages = [];
    this.addCoverageVariant.coveragespremiumregistration = [];
    this.standardCoverageValues = [];
    this.getCoverageCodesByProductClassId(selectedProductsClassValue);
  }

  getCoverageCodesByProductClassId(productClassSelected: CategoryData) {
    const toastMessageConfigCode = {
      error: {
        severity: 'error',
        message: `Failed to load Standard Coverage code for the associated product class ${this.selectedProductClass.value}`,
        duration: 5000,
      },
    };
    const productClassId = this.productClass
      ?.filter((x) => x.value == productClassSelected.value)
      .map((x) => x.value);
    this._coverageVariantService.getStandardCoverage(productClassId).subscribe({
      next: (data) => {
        this.standardCoverages = data;
        this.bindCoverageCodes(this.standardCoverages);

        if (
          this.coverageVariantData != null &&
          this.coverageVariantData.standardCoverage.length > 0
        ) {
          let selectedCodes: StandardCoverage;
          this.selectedStandardCoverages = [];
          this.standardCoverageValues = [];
          for (
            let i = 0;
            i < this.coverageVariantData.standardCoverage.length;
            i++
          ) {
            const codes =
              this.coverageVariantData.standardCoverage[i].split(' - ');
            selectedCodes = this.standardCoverages.filter(
              (x) => x.coverageCode === codes[0]
            )[0];
            this.selectedStandardCoverages.push(selectedCodes);
            this.standardCoverageValues.push(
              selectedCodes.coverageCodeDescription
            );
          }
          this.selectedProductClass = this.productClass.filter(
            (x) => x.description === this.coverageVariantData.productClass
          )[0];
          // this.standardCoverageValues=this.coverageVariantData.standardCoverage;
          this.addCoverageVariant.name =
            this.coverageVariantData.coverageVariantName;
          this.addCoverageVariant.coverageVariantId =
            this.coverageVariantData.coverageVariantId;
        }

        this.isCoverageCodeDropDown = false;
      },
      error: () => {
        this._layoutService.showMessage(toastMessageConfigCode['error']);
      },
    });
  }
  bindCoverageCodes(data: StandardCoverage[]) {
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
        //coverageCodeDescription: isNullOrUndefined(codeDesc.geniusCover) || isEmpty(codeDesc.geniusCover)? codeDesc.coverageCode + ' - ' + codeDesc.coverageDesc : codeDesc.coverageCode + ' - ' + codeDesc.coverageDesc + ' - ' + codeDesc.geniusCover
        coverageCodeDescription:
          codeDesc.coverageCode +
          ' - ' +
          codeDesc.coverageDesc +
          ' - ' +
          codeDesc.geniusCover.value,
      };
    });
  }
  getCoverageVariants(): void {
    const toastMessageConfigGet = {
      error: {
        severity: 'error',
        message: `Failed to load Coverage Variants for the associated product ${this.productId}`,
        duration: 5000,
      },
      warning: {
        severity: 'warning',
        message: `There is no Coverage Variant for the associated product ${this.productId}`,
        duration: 5000,
      },
    };
    this._coverageVariantService
      .getCoverageVariants(this.productId, this.productVersionId)
      .subscribe({
        next: (data) => {
          this.coverageVariants = data;
          this.isVariants = this.coverageVariants.length <= 0 ? true : false;
        },
      });
  }
  bindCoverageCode(standardCoverageCode: StandardCoverage[]) {
    const coverageCodeList: coveragespremiumregistration[] =
      standardCoverageCode.map((std) => {
        return {
          coverageId: std.coverageCode,
          stdCoverageCode: std.coverageCode,
          stdCoverageDescription: std.coverageDesc,
          meridianStatLineCode: std.statLine,
          geniusCoverage: std.geniusCover,
          geniusTimeHazard: std.geniusTime,
          coverageBookingSystem: 'genius',
          stdCoverageDefinedBy: '',
          geniusSection: std.geniusSection,
          coverageLevels: [],
          requestId: '1',
          allocationPercent: Math.floor(100 / standardCoverageCode.length),
          coverageCodeDescription:
            std.coverageCode +
            ' - ' +
            std.coverageDesc +
            ' - ' +
            std.geniusCover.value,
        };
      });
    const rem = 100 % standardCoverageCode.length;

    for (let i = 0; i < rem; i++) {
      coverageCodeList[i].allocationPercent++;
    }

    return coverageCodeList;
  }

  createCoverageVariant(moveToNext?: boolean): void {
    const variantName = this.addCoverageVariant.name;
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: `Coverage variant ${this.addCoverageVariant.coverageVariantId} created successfully for the product.`,
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: `Failed to create coverage variant ${this.addCoverageVariant.coverageVariantId} for product, error occured.`,
        duration: 5000,
      },
      duplicate: {
        severity: 'error',
        message: `Coverage variant ID: ${this.addCoverageVariant.coverageVariantId} already exists.`,
        duration: 5000,
      },
    };
    this.coveragespremiuRregistrationData = this.bindCoverageCode(
      this.selectedStandardCoverages
    );

    //Validate Coverage Variant ID Duplicate or not
    const coverageVariantIdExists = this.coverageVariants.some(
      (x) => x.coverageVariantId == this.addCoverageVariant.coverageVariantId
    );
    if (coverageVariantIdExists) {
      this._layoutService.showMessage(toastMessageConfig['duplicate']);
    } else {
      if (this.validateVariantName(variantName) && this.ValidateMandatory()) {
        const data: CreateCoverageVariant = {
          coverageVariantId: this.addCoverageVariant.coverageVariantId || '',
          name: this.addCoverageVariant.name || '',
          description: this.addCoverageVariant.description || '',
          productClass: {
            value: this.selectedProductClass.value,
            category: this.selectedProductClass.category,
          },
          type: {
            value: this.selectedCoverageType.code,
            category: Category.CVT,
          },
          isPeril: this.addCoverageVariant.isPeril,
          isRateBearing: this.addCoverageVariant.isRateBearing,
          is3rdParty: this.addCoverageVariant.is3rdParty,
          relatedCoverageVariantIds:
            this.addCoverageVariant.relatedCoverageVariantIds,
          coveragespremiumregistration: this.coveragespremiuRregistrationData,
          allocationPercent: 1,
          requestId: crypto.randomUUID(),
          isCurrentVersion: this.addCoverageVariant.isCurrentVersion,
        };
        this._coverageVariantService
          .createCoverageVariant(data, this.productId, this.productVersionId)
          .subscribe({
            next: (res) => {
              if (res) {
                this._layoutService.showMessage(toastMessageConfig['success']);
              }
              this._productContextService._setCoverageVariantId(
                this.addCoverageVariant.coverageVariantId || ''
              );
              localStorage.setItem(
                'coverageVariantId',
                this.addCoverageVariant.coverageVariantId as string
              );
              localStorage.setItem(
                'coverageVariantName',
                this.addCoverageVariant.name as string
              );
              this.clearAddCoverageVariant();
              this.clearCoverageSelection();
              this.clearSelection();
              if (moveToNext) {
                this._sharedService.nextButtonClicked.next({
                  stepCount: 1,
                });
              } else {
                this._router.navigate(['products']);
              }
            },
            error: (err) => {
              this._layoutService.showMessage({
                severity: 'error',
                message:
                  err.error.errors.PMERR000028[0] ||
                  `Failed to create coverage variant ${this.addCoverageVariant.coverageVariantId} for product, error occured.`,
                duration: 5000,
              });
            },
          });
      }
    }
  }

  ValidateMandatory() {
    let MandatoryFields = true;
    const toastMessageConfig = {
      isProductClass: {
        severity: 'error',
        message: 'Product class is mandatory, error occured.',
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
    if (!this.selectedProductClass) {
      this._layoutService.showMessage(toastMessageConfig['isProductClass']);
      MandatoryFields = false;
    }
    if (this.coveragespremiuRregistrationData?.length == 0) {
      this._layoutService.showMessage(toastMessageConfig['isStdCoverageCode']);
      MandatoryFields = false;
    }
    if (!this.selectedCoverageType) {
      this._layoutService.showMessage(toastMessageConfig['isCoverageType']);
      MandatoryFields = false;
    }
    if (!this.addCoverageVariant.coverageVariantId) {
      this._layoutService.showMessage(toastMessageConfig['isCoverageId']);
      MandatoryFields = false;
    }
    if (
      this._productService.noSpecialCharactersCheck(
        this.addCoverageVariant.coverageVariantId || ''
      )
    ) {
      this._layoutService.showMessage(
        toastMessageConfig['productIdSpaceErrorMessage']
      );
      MandatoryFields = false;
    }
    return MandatoryFields;
  }

  previous(): void {
    this._router.navigate([`/products/${this.productId}/coveragevariant`]);
  }

  validateVariantName(variantName: string | undefined) {
    if (!variantName) {
      this.messageService.add({
        key: 'tr',
        severity: 'error',
        summary: 'Error',
        detail: 'Enter Coverage variant name, Error Occured',
        life: 80000,
        sticky: true,
        closable: true,
      });
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

  saveAndExit(): void {
    this.createCoverageVariant(false);
  }

  saveAndNext(): void {
    this.createCoverageVariant(true);
  }

  /* trigger the event on model change of chips */
  onChipVariantChange(event: (string | undefined)[]) {
    this.coverageVariantList = this.coverageVariantList?.filter(
      (coverageVariantList) => {
        return event.find((variant) => coverageVariantList.name == variant);
      }
    );
    this.selectedVariantValues = this.coverageVariantList.map((x) => x.name);
    if (this.selectedVariantValues.length <= 0) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }

  onVariantChange() {
    if (this.coverageVariantList.length > 0) {
      this.addCoverageVariant.relatedCoverageVariantIds =
        this.coverageVariantList
          .filter((coverageVariant) => !!coverageVariant.name)
          .map(
            (coverageVariant) => coverageVariant.coverageVariantId as string
          );
      this.selectedVariantValues = this.coverageVariantList.map((x) => x.name);
      if (this.selectedVariantValues.length <= 0) {
        this.isDisabled = true;
      } else {
        this.isDisabled = false;
      }
    }
  }

  onCoverageCodeChange() {
    this.standardCoverageValues = this.selectedStandardCoverages.map(function (
      a
    ) {
      return a.coverageCodeDescription;
    });
    if (this.standardCoverageValues.length <= 0) {
      this.isDisabledCoverageClear = true;
    } else {
      this.isDisabledCoverageClear = false;
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
      this.isDisabledCoverageClear = true;
    } else {
      this.isDisabledCoverageClear = false;
    }
  }

  /* on deletion on chips updating the multiselect dropdown model */
  clearCoverageSelection() {
    this.selectedStandardCoverages = [];
    this.addCoverageVariant.coveragespremiumregistration = [];
    this.standardCoverageValues = [];
    this.isDisabledCoverageClear = true;
  }

  clearAddCoverageVariant(): void {
    this.addCoverageVariant = {
      coverageVariantId: '',
      description: '',
      name: '',
      marketingName: '',
      lastUpdated: '',
      id: '',
      productClass: {
        value: '',
        category: '',
      },
      type: {
        value: '',
        category: '',
      },
      relatedCoverageVariantIds: [],
      coveragespremiumregistration: [],
      subCoverages: [],
      isCurrentVersion: true,
    };
  }

  /* on deletion on chips updating the multiselect dropdown model */
  clearSelection() {
    this.selectedVariantValues = [];
    this.addCoverageVariant.relatedCoverageVariantIds = [];
    this.coverageVariantList = [];
    this.isDisabled = true;
  }
  linkExistingCoverages() {
    const country = this._productContextService._getProductContext().country[0];
    const productClass = this.selectedProductClass.description
      ?.trimEnd()
      .replace(' ', '-');
    // const str=`/products/${this.productId}/coveragevariant/${country}/${productClass}/linkCoverageVariant`;
    const filteredCountry = this.countrySettingsData.filter(
      (x: any) => x.countryCode == country
    )[0].country;
    this._router.navigate(
      [`/products/${this.productId}/coveragevariant/linkCoverageVariant`],
      { queryParams: { country: filteredCountry, productClass: productClass } }
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
