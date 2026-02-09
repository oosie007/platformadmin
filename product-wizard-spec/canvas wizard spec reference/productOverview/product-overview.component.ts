import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterContentChecked,
  Component,
  EventEmitter,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import {
  AppContextService,
  LoadingIndicatorService,
  RegionService,
  RegionValues,
} from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbDateInputModule,
  CbDropdownMenuModule,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbModalModule,
  CbSelectChoiceModule,
  CbTextAreaModule,
  CbToggleModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { cloneDeep, isEmpty, isNull } from 'lodash-es';
import { MenuItem } from 'primeng/api/menuitem';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { combineLatest } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { AvailabilityService } from '../../services/availability.service';
import { CatalystPolicyService } from '../../services/catalyst-policy.service';
import { CoherentMappingService } from '../../services/coherent-mapping.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  Availability,
  MainState,
  StandardAvalability,
} from '../../types/availability';
import { Constants } from '../../types/constants';
import {
  CoverageVariant,
  CoverageVariantInsured,
  Entity,
  InsuredGroupType,
  InsuredType,
} from '../../types/coverage';
import { CoverageVariantLevel } from '../../types/coverage-variant-level';
import { Exclusion } from '../../types/exclusion';
import {
  AllowedParty,
  CustomAttribute,
  InsuredObject,
} from '../../types/insured-object';
import { PolSearchResponse } from '../../types/polsearch';
import {
  GetProductRequest,
  MasterData,
  messageKey,
  ProductHeader,
  ProductOverviewLabels,
  ProductRequest,
  Statuskeys,
} from '../../types/product';
import { Category } from '../../types/ref-data';
import { SubCoverage } from '../../types/sub-coverage';

@Component({
  selector: 'canvas-product-overview',
  standalone: true,
  imports: [
    CommonModule,
    CbButtonModule,
    CbInputModule,
    CbSelectChoiceModule,
    CbDateInputModule,
    FormsModule,
    ReactiveFormsModule,
    CbDropdownMenuModule,
    TieredMenuModule,
    CbTextAreaModule,
    CbToggleModule,
    CbToggleModule,
    CbToggleModule,
    CbIconModule,
    inputUnselectPipe,
    CbModalModule,
  ],
  providers: [DatePipe],
  templateUrl: './product-overview.component.html',
  styleUrls: ['./product-overview.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProductOverviewComponent implements OnInit, AfterContentChecked {
  /**
   *
   */
  constants!: {
    labels: {
      [key: string]: string;
    };
    toolTip: {
      [key: string]: string;
    };
  };

  tooltipTextForNewVers!: string;
  currency: MasterData[] = [];
  productResponse!: ProductRequest;
  polSearchResp!: { response: PolSearchResponse; version: string };
  productId!: string;
  productVersionId!: string;
  newVersion!: string;
  editProduct!: boolean;
  productUpdated!: boolean; // Need to check with team.
  updateproductRequest!: ProductRequest;
  productData!: GetProductRequest; // Need to check with team.
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  protected iconSize: CbIconSize = CbIconSize.REGULAR;
  statusData: MasterData[] = [];
  countryList: MasterData[] = [];
  items: MenuItem[] = [
    {
      label: 'BASIC INFORMATION',
      visible: true,
    },
  ];
  limitsCurrency: messageKey = {
    value: '',
    category: Category.CURRENCY,
  };
  availableVersions!: { version: string; isNew: boolean }[];
  createVersionTheme = CbColorTheme.DEFAULT;

  productHeaderDetails: ProductHeader = {
    productVersionName: '',
    productName: '',
    shortName: '',
    description: '',
    marketingName: '',
    status: {},
    premiumCurrency: {},
    limitsCurrency: {},
    country: [],
  };
  sidebarVisible = false;
  showDiscardButton = false;
  selectedVersion: string;

  effectiveDate: Date = new Date(new Date().setDate(new Date().getDate() - 1));
  expiryDate: Date = new Date();
  isLimitsCurrencyEnable = false;
  limitsCurrencyValue: string | undefined = '';
  product: FormGroup = new FormGroup({
    productName: new FormControl('', [
      Validators.required,
      Validators.maxLength(500),
    ]),
    productId: new FormControl(''),
    description: new FormControl('', [Validators.maxLength(2000)]),
    dateRange: new FormGroup({
      effectiveDate: new FormControl('', [Validators.required]),
      expiryDate: new FormControl('', []),
    }),
    status: new FormControl('', [Validators.required]),
    productVersionId: new FormControl(
      '',
      Validators.pattern(/^(?!00)\d+\.0{1,}$/)
    ),

    premiumCurrency: new FormControl(''),
    limitsCurrency: new FormControl(''),
    country: new FormControl([{ value: '', disabled: true }, []]),
    versions: this._fb.control(''),
    marketingName: new FormControl('', [Validators.maxLength(500)]),
  });
  requestId: string;
  productName: string;
  isDisable = false;
  canSaveExit = false;
  nextEvent = new EventEmitter();
  backEvent = new EventEmitter();
  versioning = false;
  versioningCtrl!: string;
  labels!: ProductOverviewLabels;
  newEffDate!: Date | undefined;
  newExpiryDate!: Date | undefined;
  region: string;
  countrySettingsData: MasterData[] = [];
  selectedCountry!: string;
  /**
   *
   */
  constructor(
    private readonly _appContextService: AppContextService,
    private _productService: ProductsService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _router: Router,
    private _fb: FormBuilder,
    private datepipe: DatePipe,
    private _loaderService: LoadingIndicatorService,
    private _activatedRoute: ActivatedRoute,
    private _availabilityService: AvailabilityService,
    private _productContextService: ProductContextService,
    protected regionService: RegionService,
    private _polService: CatalystPolicyService,
    private _cohereMappingService: CoherentMappingService,
    private readonly _commands: StudioCommands
  ) {
    this.labels = <ProductOverviewLabels>(
      this._appContextService.get('pages.productOverview.labels')
    );
    // Need to rewrite the logic
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
      localStorage.getItem('productId') === null ||
      localStorage.getItem('productId') === undefined
    ) {
      this.productId = _activatedRoute.snapshot.paramMap.get('id') ?? '';
    }
    if (
      localStorage.getItem('productVersionId') === null ||
      localStorage.getItem('productVersionId') === undefined
    ) {
      this.productVersionId =
        _activatedRoute.snapshot.queryParamMap.get('productVersion') ?? '';
    }

    this._updateLayout();
    this.requestId = this._productContextService._getProductContext().requestId;
    this.requestId =
      isNullOrUndefined(this.requestId) || isEmpty(this.requestId)
        ? uuidv4()
        : this.requestId;
    this.constants = Constants;
  }
  ngAfterContentChecked(): void {
    if (this.versioningCtrl === '1.0') {
      // console.log(this.versioningCtrl);
    }
  }

  ngOnInit(): void {
    this.initializeProduct();
  }

  // Need to refactor the code.
  updateLocalStorage() {
    localStorage.setItem(
      'productVersionId',
      this.updateproductRequest.productVersionId || ''
    );
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      localStorage.setItem(
        'productVersionId',
        this.updateproductRequest.productVersionId || ''
      );
    }
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      localStorage.setItem(
        'productVersionId',
        this.updateproductRequest.productVersionId || ''
      );
    }
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      this.productVersionId = localStorage.getItem('productVersionId') || '';
    }
  }

  /**
   * Breadcrumbs setup
   */
  private _updateLayout() {
    this._layoutService.updateBreadcrumbs([
      { label: 'Home', routerLink: 'home' },
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  /**
   * Product initialization
   */
  initializeProduct(statusUpdate = false) {
    this.fetchProductDetails(statusUpdate);
  }

  /**
   * Getting currencies and it's relared data.
   */
  loadCurrencyDetails(country?: string) {
    if (country == null || country === undefined) {
      country = this.product?.value?.['country'];
    }
    this._productService.getCurrencyList().subscribe({
      next: (data) => {
        this.processCountryData(data, this.countrySettingsData, false, country);
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Unable to fetch currency(s)',
          duration: 5000,
        });
      },
    });
  }
  /**
   * Status data. Need to check it if we required this method or not.
   */
  loadStatusDetails() {
    this._productService.getStatus().subscribe({
      next: (data) => {
        this.statusData = data;
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Unable to fetch status(s)',
          duration: 5000,
        });
      },
    });
  }

  /**
   * Getting products details.
   */
  private fetchProductDetails(statusUpdate = false) {
    if (statusUpdate) {
      this.preSetValues();
      return;
    }
    const selectedRegion = this.regionService.getRegion() as RegionValues;
    combineLatest([
      this._productService.getStatus(),
      this._productService.getCountryList(selectedRegion?.toUpperCase()),
      this._productService.getProduct(
        this.productId,
        this.productVersionId,
        true
      ),
    ]).subscribe({
      next: (response) => {
        this._loaderService.show();
        this.statusData = response[0];
        this.getCountrySettingList(response[1]);
        this.productResponse = response[2];
        this.productHeaderDetails = response[2].header;
        this._productContextService.setProductHeader(this.productHeaderDetails);

        this.getAvailabilities();

        this.preSetValues();
        this.versioningCtrl = this.productVersionId;
        this.availableVersions = this.productResponse.header.allVersions?.map(
          (vers) => ({ version: vers.versionId, isNew: false })
        ) ?? [{ version: this.productResponse.productVersionId, isNew: false }];
        this.getpolicyData(this.productHeaderDetails?.country?.[0] as string);
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Product details fetch failed',
          duration: 5000,
        });
      },
    });
  }

  private getAvailabilities(): void {
    this._availabilityService
      .getAvailability(this.productId, this.productVersionId)
      .subscribe({
        next: (res) => {
          this._loaderService.hide();
        },
        error: (err) => {
          this._loaderService.hide();
        },
      });
  }

  getpolicyData(country: string) {
    this._commands
      .execute(
        {
          commandName: 'HttpCommand',
          parameter: {
            url: `${this._appContextService.get(
              'referenceData.endpoints.COUNTRY_DATA'
            )}`,
            method: 'GET',
            disableCache: true,
            params: {
              country: country,
              language: 'en',
              requestId: `${uuidv4()}`,
            },
          },
        },
        {}
      )
      .then((countryData: any) => {
        this.region = (countryData.data[0].region as string).toLowerCase();

        this._polService
          .getPolicyCountForProduct(
            this.productId,
            this.productVersionId,
            this.region
          )
          .then((response: any) => {
            this.polSearchResp = {
              response: <PolSearchResponse>response,
              version: this.productResponse.productVersionId,
            };
            this.setVersioning();
          });
      });
  }

  private switchVersion() {
    if (this.versioningCtrl === this.productVersionId) {
      return;
    }
    this.productVersionId = this.versioningCtrl;
    combineLatest([
      this._productService.getProduct(
        this.productId,
        this.productVersionId,
        true
      ),
      this._polService.getPolicyCountForProduct(
        this.productId,
        this.productVersionId,
        this.region
      ),
    ]).subscribe({
      next: (response) => {
        this.productResponse = response[0];
        this.productHeaderDetails = response[0].header;
        this.preSetValues();
        localStorage.setItem('productVersionId', this.productVersionId);
        this.polSearchResp = {
          response: <PolSearchResponse>response[1],
          version: this.productResponse.productVersionId,
        };
        this.versioningCtrl = this.productVersionId;
        this.setVersioning();
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Product details fetch failed',
          duration: 5000,
        });
      },
    });
  }

  private preSetValues() {
    /**
     * 'limitsCurrency' will decide to display limitsCurrency dropdown or not,
     * so based on that value here it will decide checkbox need to enable or not.
     */
    const { limitsCurrency } = this.productHeaderDetails || {};
    if (!isNullOrUndefined(limitsCurrency) && limitsCurrency.value !== '') {
      this.isLimitsCurrencyEnable = true;
      this.limitsCurrencyValue = limitsCurrency.value;
    } else {
      this.isLimitsCurrencyEnable = false;
    }
    this.bindProductDetails(this.productResponse);
  }

  /**
   * Updating form control data with product information
   * @param productDetails
   */
  bindProductDetails(productDetails: ProductRequest) {
    setTimeout(() => {
      const { productId, productVersionId, header, requestId } = productDetails;
      const {
        description,
        effectiveDate,
        expiryDate,
        productName,
        status,
        premiumCurrency,
        limitsCurrency,
        country,
        marketingName,
      } = header;
      this._productContextService._setProductContext(
        productId,
        productVersionId,
        requestId,
        country ?? [],
        country ?? [],
        status?.value ?? ''
      );
      this._productContextService._setProductVersions(
        header.allVersions?.map((vers) => ({
          versionId: vers.versionId ?? '',
          status: vers.status ?? {},
        })) ?? [{ versionId: productVersionId, status: header.status ?? {} }]
      );
      const statusVal =
        this._productContextService.isProductDisabled() ||
        this._productContextService._getProductContext().status ===
          Statuskeys.DELETE;

      this.product = this._fb.group({
        productName: [
          { value: productName?.trim(), disabled: statusVal },
          [Validators.required, Validators.maxLength(500)],
        ],
        productId: [{ value: productId, disabled: true }, []],
        description: [
          {
            value: description?.trim(),
            disabled: statusVal,
          },
          [Validators.maxLength(2000)],
        ],
        dateRange: this._fb.group(
          {
            effectiveDate: [
              {
                value: this.datepipe
                  .transform(effectiveDate, 'yyyy-MM-dd')
                  ?.toString(),
                disabled: statusVal,
              },
              Validators.required,
            ],
            expiryDate: [
              {
                value: this.datepipe
                  .transform(expiryDate, 'yyyy-MM-dd')
                  ?.toString(),
                disabled: statusVal,
              },
            ],
          },
          { validators: this.validateDateRange }
        ),
        status: [
          {
            value: status?.value?.toString(),
            disabled: this._productContextService.isReadonlyProduct(),
          },
          [Validators.required],
        ],
        productVersionId: [{ value: productVersionId, disabled: true }],
        premiumCurrency: [
          {
            value: premiumCurrency?.value?.toString(),
            disabled: statusVal,
          },
        ],
        limitsCurrency: [
          {
            value: this.isLimitsCurrencyEnable
              ? limitsCurrency?.value?.toString()
              : '',
            disabled: statusVal,
          },
        ],
        country: [
          { value: country?.[0].toString(), disabled: true },
          [Validators.required],
        ],
        marketingName: [
          { value: marketingName?.trim(), disabled: statusVal },
          [Validators.maxLength(500)],
        ],
      });
      this.isDisable = statusVal;
      this.canSaveExit = this._productContextService.isProductDisabled();
      const currentErrors = this.field['dateRange'].errors;
      if (
        !this.isNewVersion(this.productVersionId) &&
        this.availableVersions &&
        currentErrors &&
        currentErrors['isEffectiveDatePast']
      ) {
        delete currentErrors['isEffectiveDatePast'];
        this.field['dateRange'].setErrors(currentErrors);
      }
      this.loadCurrencyDetails(country?.[0].toString());
      this.selectedCountry = country?.[0].toString()
        ? country[0].toString()
        : '';
    }, 10);
  }

  get field(): { [key: string]: AbstractControl } {
    return this.product.controls;
  }

  get effectiveDateValidation(): any {
    return this.product.get('dateRange.effectiveDate');
  }
  get expiryDateValidation(): any {
    return this.product.get('dateRange.expiryDate');
  }

  private setVersioning() {
    if (
      this.availableVersions &&
      this.availableVersions?.some((e) => e.isNew)
    ) {
      return;
    }
    this.versioning =
      this.polSearchResp.response.numberOfPolicies > 0 &&
      this.polSearchResp.version === this.versioningCtrl;
    this.tooltipTextForNewVers = this.constants.toolTip['noPolicy'];
  }

  /**
   * Limits currency will display based on user choice.
   */
  // When user toggle the button, do we need to reset limits currency.
  toggleLimitsCurrency(limitsCurrency?: string | undefined) {
    this.isLimitsCurrencyEnable = !this.isLimitsCurrencyEnable;
    if (this.isLimitsCurrencyEnable) {
      this.product.addControl(
        'limitsCurrency',
        this._fb.control(
          limitsCurrency ? limitsCurrency : '',
          Validators.required
        )
      );
      this.product.controls['limitsCurrency'].addValidators([
        Validators.required,
      ]);
    } else {
      this.product.removeControl('limitsCurrency');
      this.product.controls['limitsCurrency'].removeValidators(
        Validators.required
      );
    }
  }

  /**
   * While user chnage the limits currency, the selected value will be assigned to
   * 'limitsCurrencyValue'. It will useful while the product update.
   */
  updateLimitsCurrency() {
    this.limitsCurrencyValue = !isNullOrUndefined(
      this.product.get('limitsCurrency')?.value
    )
      ? this.product.get('limitsCurrency')?.value
      : '';
  }

  saveAndExit() {
    this.updateProduct('products');
  }
  /**
   * Save the product informaton.
   */
   updateProduct(navigateToPage: string) {
    const {
      productName,
      description,
      premiumCurrency,
      limitsCurrency,
      status,
      dateRange,
      marketingName,
    } = this.product.getRawValue();
    const { effectiveDate, expiryDate } = dateRange;

    const data = this.statusData?.filter((x) => x.code === status);
    const headerData: ProductHeader = {
      productName: productName.trim(),
      createdOn: this.productHeaderDetails.createdOn,
      updatedOn: new Date(),
      description: description?.trim(),
      status: {
        value: data[0]?.code,
        category: Category.PRODUCTSTATUS,
      },
      premiumCurrency: {
        value: premiumCurrency,
        category: Category.CURRENCY,
      },
      effectiveDate: effectiveDate,
      expiryDate: expiryDate,
      country: this.productResponse.header.country,
      lockStatus: this._productContextService.isProductLocked(),
      allowedLockStatusUsers:
        this.productResponse?.header?.allowedLockStatusUsers ?? [],
      marketingName: marketingName?.trim(),
    };
    this.updateproductRequest = {
      productId: this.product.get('productId')?.value,
      productVersionId: this.product.get('productVersionId')?.value,
      header: headerData,
      rating: {
        premiumRatingFactors: [],
      },
      requestId: '1',
    };
    if (
      this.isLimitsCurrencyEnable &&
      limitsCurrency != '' &&
      !isNullOrUndefined(limitsCurrency)
    ) {
      this.updateproductRequest.header.limitsCurrency = {
        value:
          limitsCurrency != '' && !isNullOrUndefined(limitsCurrency)
            ? limitsCurrency
            : '',
        category: Category.CURRENCY,
      };
    } else {
      this.updateproductRequest.header.limitsCurrency = null;
    }

    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: `${this.productId} Product details updated successfully`,
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: `${this.productId} Product details update failed`,
        duration: 5000,
      },
      warning: {
        severity: 'info',
        message: `${this.productId} Product is in Final status`,
        duration: 5000,
      },
    };

    this._productService
      .updateProduct(this.updateproductRequest, this.productVersionId)
      .subscribe({
        next: (res) => {
          this.updateLocalStorage();
          this._productService
            .getProduct(this.productId, this.productVersionId)
            .subscribe((res) => {
              this.productResponse = res;
            });
          this.editProduct = false;
          this._layoutService.showMessage(
            toastMessageConfig[`${res === false ? 'error' : 'success'}`]
          );
          this._productContextService._setProductContext(
            this.productResponse.productId,
            this.productVersionId,
            this.requestId,
            this.productResponse.header.country ?? [],
            this.productResponse.header.country ?? [],
            data[0]?.code ?? ''
          );
          this._productContextService._setProductVersions(
            this.productResponse.header.allVersions?.map((vers) => ({
              versionId: vers.versionId ?? '',
              status: vers.status ?? {},
            })) ?? [
              {
                versionId: this.productVersionId,
                status: this.productResponse.header.status ?? {},
              },
            ]
          );
        },
        error: (res) => {
          if (String(res.error).includes('not allowed for update operation')) {
            this._layoutService.showMessage(toastMessageConfig['warning']);
          } else {
            this._layoutService.showMessage(toastMessageConfig['error']);
          }
        },
      });
    if (navigateToPage === 'products') {
      this._router.navigate(['products']);
    }
    this.nextEvent.emit('next');
  }

  // Need to check with team, it's using any where or not
  LoadOverview() {
    this.editProduct = false;
  }

  private addIsCurrentVersionToAvailability(
    availability: Availability
  ): Availability {
    availability?.standards?.map((standard: StandardAvalability) => {
      return standard.states?.map((state: MainState) => {
        state.isCurrentVersion = false;
        return state;
      });
    });
    return availability;
  }

  private updateIsCurrentVersionInSubCoverages(
    subCoverages: SubCoverage[]
  ): SubCoverage[] {
    return subCoverages.map((subCoverage: SubCoverage) => {
      subCoverage.isCurrentVersion = false;
      return subCoverage;
    });
  }

  private updateIsCurrentVersionInExclusions(
    exclusions: Exclusion[]
  ): Exclusion[] {
    return exclusions.map((exclusion: Exclusion) => {
      exclusion.isCurrentVersion = false;
      return exclusion;
    });
  }

  private updateIsCurrentVersionInCoverageVariantLevel(
    coverageVariantLevels: CoverageVariantLevel[]
  ): CoverageVariantLevel[] {
    return coverageVariantLevels?.map(
      (coverageVariantLevel: CoverageVariantLevel) => {
        coverageVariantLevel.isCurrentVersion = false;
        return coverageVariantLevel;
      }
    );
  }

  private updateIsCurrentVersionInInsuredObject(
    insuredObjects: InsuredObject[]
  ): InsuredObject[] {
    return insuredObjects.map((insuredObject: InsuredObject) => {
      insuredObject.isCurrentVersion = false;
      insuredObject.customAttributes =
        this.updateIsCurrentVersionInCustomAttribute(
          insuredObject.customAttributes
        );
      insuredObject.allowedParties?.map((allowedPartie: AllowedParty) => {
        allowedPartie.customAttributes =
          this.updateIsCurrentVersionInCustomAttribute(
            allowedPartie.customAttributes
          );
      });
      return insuredObject;
    });
  }

  private updateIsCurrentVersionInInsured(
    insured: CoverageVariantInsured
  ): CoverageVariantInsured {
    if (!isEmpty(insured.individual)) {
      insured.individual.customAttributes?.map((customAttribute: any) => {
        customAttribute.isCurrentVersion = false;
        return customAttribute;
      });
      insured.individual.insuredTypes?.map((insuredType: InsuredType) => {
        insuredType.isCurrentVersion = false;
        return insuredType.insuredGroupTypes?.map(
          (insuredGroupType: InsuredGroupType) => {
            insuredGroupType.isCurrentVersion = false;
            return insuredGroupType;
          }
        );
      });
    }
    insured.entities?.map((entitie: Entity) => {
      return entitie.customAttributes?.map((customAttribute: any) => {
        customAttribute.isCurrentVersion = false;
        return customAttribute;
      });
    });
    return insured;
  }

  private updateIsCurrentVersionInCustomAttribute(
    customAttributes: CustomAttribute[]
  ): CustomAttribute[] {
    return customAttributes.map((customAttribute: CustomAttribute) => {
      customAttribute.isCurrentVersion = false;
      return customAttribute;
    });
  }

  private updateIsCurrentVersionInCoverageVariant(
    coverageVariants: CoverageVariant[]
  ): CoverageVariant[] {
    return coverageVariants.map((item: CoverageVariant) => {
      item.isCurrentVersion = false;
      if (item.availability) {
        item.availability = this.addIsCurrentVersionToAvailability(
          item.availability
        );
      }
      if (item.insured) {
        item.insured = this.updateIsCurrentVersionInInsured(item.insured);
      }
      if (item.insuredObjects) {
        item.insuredObjects = this.updateIsCurrentVersionInInsuredObject(
          item.insuredObjects
        );
      }
      if (item.coverageVariantLevels) {
        item.coverageVariantLevels =
          this.updateIsCurrentVersionInCoverageVariantLevel(
            item.coverageVariantLevels
          );
      }
      if (item.subCoverages) {
        item.subCoverages = this.updateIsCurrentVersionInSubCoverages(
          item.subCoverages
        );
      }
      if (item.exclusions) {
        item.exclusions = this.updateIsCurrentVersionInExclusions(
          item.exclusions
        );
      }
      return item;
    });
  }

  private addIsCurrentVersion(data: any): any {
    data.availability = this.addIsCurrentVersionToAvailability(
      data.availability
    );
    data.coverageVariants = this.updateIsCurrentVersionInCoverageVariant(
      data.coverageVariants
    );
    data.customAttributes = this.updateIsCurrentVersionInCustomAttribute(
      data.customAttributes
    );
    return cloneDeep(data);
  }

  next(): void {
    this.productVersionId = this.versioningCtrl;

    if (!this.isNewVersion(this.versioningCtrl)) {
      if (!this._productContextService.isProductDisabled()) {
        this.updateProduct('availability');
      }
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    } else {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: `Product ${this.productId} with version ${this.versioningCtrl} successfully created and set to 'Design' status.`,
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: `Product ${this.productId} creation with version ${this.versioningCtrl} - failed.`,
          duration: 5000,
        },
      };
      this._productService
        .getAllByVersion(this.productId, this.productResponse.productVersionId)
        .subscribe({
          next: (res) => {
            res = this.addIsCurrentVersion(res);
            const {
              productName,
              description,
              premiumCurrency,
              limitsCurrency,
              dateRange,
              marketingName,
            } = this.product.getRawValue();
            const { effectiveDate, expiryDate } = dateRange;

            const newHeader: ProductHeader = {
              ...this.productHeaderDetails,
              effectiveDate: effectiveDate,
              expiryDate: expiryDate,
              status: {
                value: Statuskeys.DESIGN,
                category: Category.PRODUCTSTATUS,
              },
              productName,
              marketingName,
              description,
              premiumCurrency: {
                value: premiumCurrency,
                category: Category.CURRENCY,
              },
              limitsCurrency:
                !isNull(limitsCurrency) && !isEmpty(limitsCurrency)
                  ? { value: limitsCurrency, category: Category.CURRENCY }
                  : null,
              allVersions: undefined,
            };
            const productNameTrim = newHeader?.productName?.trim();
            newHeader.productName = productNameTrim;

            const marketingNameTrim = newHeader?.marketingName?.trim();
            newHeader.marketingName = marketingNameTrim;

            const productDescriptionTrim = newHeader?.description?.trim();
            newHeader.description = productDescriptionTrim;

            const newVersBulkData: object = {
              ...res,
              header: newHeader,
              productVersionId: this.versioningCtrl,
            };
            this._productService.createNewVersion(newVersBulkData).subscribe({
              next: () => {
                localStorage.setItem('productVersionId', this.versioningCtrl);
                this._sharedService.nextButtonClicked.next({ stepCount: 1 });
                this._productContextService._setProductContext(
                  this.productResponse.productId,
                  this.versioningCtrl,
                  this.requestId,
                  this.productResponse.header.country ?? [],
                  this.productResponse.header.country ?? [],
                  Statuskeys.DESIGN
                );
                this._layoutService.showMessage(toastMessageConfig['success']);
                this.fetchProductDetails();
                this.createMappingForNewVersion(
                  this.productResponse.productId,
                  this.versioningCtrl,
                  this.polSearchResp.version
                );
              },
              error: () => {
                this._layoutService.showMessage(toastMessageConfig['error']);
              },
            });
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
  }

  previous(): void {
    this._router.navigate([`products`]);
  }

  isNewVersion(versionId: string) {
    return this.availableVersions?.find(
      (vers) => vers.version === versionId && vers.isNew
    );
  }

  onVersionChange() {
    const anyNew = this.availableVersions?.some((e) => e.isNew);
    if (!this.isNewVersion(this.versioningCtrl)) {
      this.showDiscardButton = false;
      this.versioning = !anyNew;
      this.tooltipTextForNewVers = this.constants.toolTip['exstNew'];
      this.switchVersion();
    } else {
      this.showDiscardButton = anyNew;
      this.versioning = false;
      this.preSetValuesForNewVers();
      this.field['status'].disable();
      this.field['description'].disable();
    }
  }

  onStatusChange() {
    const newStatus = this.product?.get('status')?.value;
    const data = this.statusData?.find((x) => x.code === newStatus);
    const defaultError = `${this.productId} Product status was not updated`;
    if (
      this.productHeaderDetails.status?.value?.toString() === Statuskeys.FINAL
    ) {
      if (data?.description) {
        this._productService
          .updateStatus(
            this.productId,
            this.productVersionId,
            data?.description
          )
          .subscribe({
            next: () => {
              if (
                newStatus === Statuskeys.WITHDRAW ||
                newStatus === Statuskeys.DELETE
              ) {
                this.clearCache();
              }
              this._layoutService.showMessage({
                severity: 'success',
                message: `${this.productId} Product status updated successfully`,
                duration: 5000,
              });
              this._productContextService._setProductContext(
                this.productResponse.productId,
                this.productResponse.productVersionId,
                this.requestId,
                this.productResponse.header.country ?? [],
                this.productResponse.header.country ?? [],
                newStatus ?? ''
              );
              this._productContextService._setProductVersions(
                this.productResponse.header.allVersions?.map((vers) => ({
                  versionId: vers.versionId ?? '',
                  status: vers.status ?? {},
                })) ?? [
                  {
                    versionId: this.productVersionId,
                    status: this.productResponse.header.status ?? {},
                  },
                ]
              );
              this.productResponse.header.status = {
                value: data.code,
                category: Category.PRODUCTSTATUS,
              };
              this.initializeProduct(true);
            },
            error: (err) => {
              if (err?.error?.errors) {
                const errors = err.error.errors;
                for (const key in errors) {
                  this._layoutService.showMessage({
                    severity: 'error',
                    message: errors[key] || defaultError,
                  });
                }
              }
              this.product.patchValue({
                status: Statuskeys.FINAL,
              });
            },
          });
      }
    } else if (
      this.productHeaderDetails.status?.value?.toString() === Statuskeys.DESIGN
    ) {
      if (data?.description) {
        this._productService
          .updateStatus(
            this.productId,
            this.productVersionId,
            data?.description
          )
          .subscribe({
            next: () => {
              this._layoutService.showMessage({
                severity: 'success',
                message: `${this.productId} Product status updated successfully`,
                duration: 5000,
              });
              if (newStatus === Statuskeys.FINAL) {
                this.clearCache();
              }
              this._productContextService._setProductContext(
                this.productResponse.productId,
                this.productResponse.productVersionId,
                this.requestId,
                this.productResponse.header.country ?? [],
                this.productResponse.header.country ?? [],
                newStatus ?? ''
              );
              this._productContextService._setProductVersions(
                this.productResponse.header.allVersions?.map((vers) => ({
                  versionId: vers.versionId ?? '',
                  status: vers.status ?? {},
                })) ?? [
                  {
                    versionId: this.productVersionId,
                    status: this.productResponse.header.status ?? {},
                  },
                ]
              );
              this.productResponse.header.status = {
                value: data.code,
                category: Category.PRODUCTSTATUS,
              };
              this.initializeProduct(true);
            },
            error: (err) => {
              console.log(err);
              if (err?.error?.errors) {
                const errors = err.error.errors;
                for (const key in errors) {
                  this._layoutService.showMessage({
                    severity: 'error',
                    message: errors[key] || defaultError,
                  });
                }
              }
              this.product.patchValue({
                status: Statuskeys.DESIGN,
              });
            },
          });
      }
    }
  }

  /**
   * Custom validations for date range.
   * @param c It contain the controls
   * @returns It will return null if no errors, otherwise it will return true for 'dateRangeInvalid'
   */
  validateDateRange(
    c: AbstractControl
  ):
    | { dateRangeInvalid: boolean }
    | { effectiveDateInvalid: boolean }
    | { expiryDateInvalid: boolean }
    | { isEffectiveDatePast: boolean }
    | null {
    const effectiveDate = new Date(c.get('effectiveDate')?.value);
    const expiryDate =
      c.get('expiryDate')?.value != null
        ? new Date(c.get('expiryDate')?.value)
        : null;
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    if (!isNaN(effectiveDate.getDate())) {
      if (!(effectiveDate >= today)) {
        return { isEffectiveDatePast: true };
      }
    }

    if (expiryDate !== null && effectiveDate >= expiryDate) {
      c.setAsyncValidators;
      c.markAsTouched;
      c.get('effectiveDate')?.markAsDirty;
      return { dateRangeInvalid: true };
    }
    if (!c.get('effectiveDate')?.pristine && isNaN(effectiveDate.getTime())) {
      return { effectiveDateInvalid: true };
    }
    if (
      !c.get('expiryDate')?.pristine &&
      expiryDate != null &&
      isNaN(expiryDate.getTime())
    ) {
      return { expiryDateInvalid: true };
    }
    return null;
  }

  discardAndExit() {
    this.sidebarVisible = true;
  }

  closeModal() {
    this.sidebarVisible = false;
  }

  onDiscardVersion() {
    this.sidebarVisible = false;
    this.availableVersions = this.availableVersions?.filter(
      (val) => val.version !== this.versioningCtrl
    );
    this.versioningCtrl = this.polSearchResp.version;
    (this.effectiveDateValidation as AbstractControl<any>).disable();
    (this.effectiveDateValidation as AbstractControl<any>).setValue(
      this.productResponse.header.effectiveDate
    );
    this.productVersionId = this.versioningCtrl;
    this.product.patchValue({
      productVersionId: this.versioningCtrl,
      premiumCurrency: this.productResponse.header.premiumCurrency?.value,
      status: this.productResponse.header.status?.value,
    });
    this.showDiscardButton = false;
    this.versioning =
      this.polSearchResp.response.numberOfPolicies > 0 &&
      this.polSearchResp.version === this.versioningCtrl;
    this.tooltipTextForNewVers = this.constants.toolTip['noPolicy'];
    this.bindProductDetails(this.productResponse);
  }

  createProductVersion() {
    this.showDiscardButton = true;
    //sorting versions by createdDate
    this.field['description'].enable();
    this.field['status'].enable();
    const lastVersion = this.productHeaderDetails.allVersions
      ?.map((vers) => {
        return {
          version: vers.versionId,
          date: new Date(vers.createdDate),
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? {
      version: '1.0',
    };
    const newVersion = (parseFloat(lastVersion.version) + 1.0).toFixed(1);
    this.availableVersions.push({ version: newVersion, isNew: true });
    this.versioningCtrl = newVersion;
    this.productVersionId = newVersion;
    this.newEffDate = this.productHeaderDetails.effectiveDate;
    this.newExpiryDate = this.productHeaderDetails.expiryDate;
    this.preSetValuesForNewVers();
  }

  createMappingForNewVersion(
    productId: string,
    currversionId: string,
    prevVersionId: string
  ) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Rating to the Input Mapped Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to Map to the Input Mapping , error occured.',
        duration: 5000,
      },
    };
    this._cohereMappingService.getMappings(productId, prevVersionId).subscribe({
      next: (res) => {
        this._cohereMappingService
          .saveMappings(productId, currversionId, res)
          .subscribe({
            next: () => {
              this._layoutService.showMessage(toastMessageConfig['success']);
            },
            error: () => {
              this._layoutService.showMessage(toastMessageConfig['error']);
            },
          });
      },
      error: () => {
        this._layoutService.showMessage(toastMessageConfig['error']);
      },
    });
  }

  preSetValuesForNewVers() {
    this.product.patchValue({
      productVersionId: this.versioningCtrl,
      productName: this.productResponse.header.productName,
      description: this.productResponse.header.description,
      status: Statuskeys.DESIGN,
      premiumCurrency: this.productResponse.header.premiumCurrency?.value,
      dateRange: {
        effectiveDate: this.newEffDate,
        expiryDate: this.newExpiryDate ?? null,
      },
    });

    (this.effectiveDateValidation as AbstractControl<any>).enable();
    (this.expiryDateValidation as AbstractControl<any>).enable();
  }
  getCountrySettingList(countryResponse: any) {
    const countrySettingUrl =
      '/canvas/api/catalyst/country-settings?languageKey=229';
    this._productService.getCountrySettings(countrySettingUrl).subscribe({
      next: (settingsRes) => {
        this.countrySettingsData = settingsRes.data;

        this.processCountryData(countryResponse, settingsRes.data, true);
        this.loadCurrencyDetails(this.selectedCountry);
      },
      error: (settingsErr) => {
        console.error('Error fetching country settings:', settingsErr);
      },
    });
  }

  processCountryData(
    countryResponse: any,
    countrySettings: any,
    isCountrySelected: boolean,
    countryCode?: string
  ) {
    if (isCountrySelected) {
      countrySettings.forEach((setting: any) => {
        const countryMatch = countryResponse.find(
          (country: any) => country.code === setting.countryCode
        );
        if (countryMatch) {
          this.countryList.push({
            id: countryMatch.id,
            description: setting.country,
            rank: countryMatch.rank,
            code: setting.countryCode,
          });
        }
      });
    } else {
      // this.loadCurrencyDetails(this.selectedCountry);
      const filteredCountries = countrySettings.filter(
        (x: any) => x.countryCode === countryCode
      );
      this.currency = [];
      filteredCountries.forEach((setting: any) => {
        const currencyList = setting.currency; //.split(',');
        currencyList.forEach((list: any) => {
          const currencyMatch = countryResponse.find(
            (currency: any) => currency.description == list
          );
          if (currencyMatch) {
            this.currency.push({
              id: currencyMatch.id,
              description: list,
              rank: currencyMatch.rank,
              code: currencyMatch.code,
            });
          }
        });
      });
    }
  }

  clearCache(): void {
    const payload = {
      keys: [`Product:${this.productId}-${this.productVersionId}`],
    };
    this._polService
      .clearProductCacheWithVersion(payload, this.region)
      .then((response: any) => {});
  }
}
