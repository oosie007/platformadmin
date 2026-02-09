/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { StudioCommand } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import {
  AppContextService,
  RegionService,
  RegionValues,
} from '@canvas/services';
import { AuthService } from '@canvas/shared/data-access/auth';
import {
  CbButtonModule,
  CbColorTheme,
  CbDateInputModule,
  CbDropdownMenuModule,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbSelectChoiceModule,
  CbTextAreaModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { MenuItem } from 'primeng/api/menuitem';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TooltipModule } from 'primeng/tooltip';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { StandardAvalability } from '../../types/availability';
import {
  GetProductRequest,
  MasterData,
  ProductModel,
  ProductRequest,
  Statuskeys,
  UpdateProductRequest,
} from '../../types/product';
import { Category } from '../../types/ref-data';
import { CreateProductLabels } from './model/create-product.model';

@Component({
  selector: 'canvas-create-product',
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
    CbIconModule,
    TooltipModule,
    CbTooltipModule,
    inputUnselectPipe,
  ],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateProductComponent implements OnInit {
  currency: MasterData[] = [];
  countryList: MasterData[] = [];
  productResponse!: ProductRequest;
  productId!: string;
  productVersionId!: string;
  updateproductRequest!: UpdateProductRequest;
  productData!: GetProductRequest;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  protected iconSize: CbIconSize = CbIconSize.REGULAR;
  showLimitsCurrency = false;
  currencyToggle = false;
  isDisabledNext = true;
  status: MasterData[] = [
    { description: 'Published' },
    { description: 'Active' },
  ];
  defaultStatusCode = Statuskeys.DESIGN;
  items: MenuItem[] = [
    {
      label: 'BASIC INFORMATION',
      visible: true,
    },
  ];

  cbToolTipColorTheme = CbColorTheme.DEFAULT;

  createProductDetails: ProductModel = {
    productName: '',
    productId: '',
    productDescription: '',
    effectiveDate: new Date(),
    expiryDate: new Date(),
    status: '',
    productVersion: '1.0',
    productLimitsAndPremiumCurrency: '',
    premiumCurrency: '',
    limitsCurrency: '',
    country: [],
    requestId: '1',
  };

  product: FormGroup;
  effectiveDate: Date = new Date(new Date().setDate(new Date().getDate() - 1));
  expiryDate: Date = new Date();
  limitsCurrencyValue: string;
  isLimitsCurrencyEnable = false;
  availabilityRequest: StandardAvalability = {
    country: '',
    states: [],
    locale: '',
    blacklistZipCodes: [''],
  };
  getCountryDetails: StudioCommand;
  regionCountryList: any = [];
  countrySettingsData: any = [];
  labels: CreateProductLabels;

  constructor(
    private _productService: ProductsService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _router: Router,
    private _fb: FormBuilder,
    private readonly _appContext: AppContextService,
    private _productContextService: ProductContextService,
    private _availabilityservice: AvailabilityService,
    protected regionService: RegionService,
    protected readonly _authService: AuthService
  ) {
    this.labels = this._appContext.get(
      'pages.product.create-product.labels'
    ) as CreateProductLabels;
    this.loadStatusDetails();
    this.loadCountryDetails();
    this._updateLayout();
  }

  ngOnInit() {
    this.productDetails();
  }

  /**
   * Product detail page
   */
  productDetails() {
    this.product = this._fb.group({
      productName: ['', [Validators.required, Validators.maxLength(500)]],
      productId: [
        '',
        [
          Validators.required,
          Validators.maxLength(10),
          this._productService.noSpecialCharactersValidator,
        ],
      ],
      description: ['', [Validators.maxLength(2000)]],
      dateRange: this._fb.group(
        {
          effectiveDate: ['', Validators.required],
          expiryDate: [''],
        },
        { validators: this.validateDateRange }
      ),
      status: [Statuskeys.DESIGN, [Validators.required]],
      productVersionId: ['1.0', Validators.pattern(/^(?!00)\d+\.0{1,}$/)],
      premiumCurrency: ['', [Validators.required]],
      limitsCurrency: [''],
      country: ['', [Validators.required]],
      marketingName: ['', [Validators.maxLength(500)]],
    });
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

  private _updateLayout() {
    this._layoutService.updateBreadcrumbs([
      { label: 'Home', routerLink: 'home' },
      { label: 'Products', routerLink: '/products' },
    ]);
    this._layoutService.caption$.next('');
  }

  onCountryChange() {
    const country = this.product?.value?.['country'];
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
  loadStatusDetails() {
    this._productService.getStatus().subscribe({
      next: (data) => {
        this.status = data;
        this.createProductDetails['status'] =
          data.find((obj) => obj.code === this.defaultStatusCode)
            ?.description || '';
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

  loadCountryDetails() {
    const selectedRegion = this.regionService.getRegion() as RegionValues;
    this._productService
      .getCountryList(selectedRegion.toUpperCase())
      .subscribe({
        next: (data) => {
          this.getCountrySettingList(data);
        },
        error: () => {
          this._layoutService.showMessage({
            severity: 'error',
            message: 'Unable to fetch country(s)',
            duration: 5000,
          });
        },
      });
  }

  createAvailability() {
    const { country } = this.product?.value;
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Availability added successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to add Availability.',
        duration: 5000,
      },
    };
    this.availabilityRequest.country = country;
    this.availabilityRequest.locale = `en`;
    this._availabilityservice
      .createStandard(
        this.availabilityRequest,
        this.productId,
        this.productVersionId
      )
      .subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
  }

  saveAndExit() {
    const {
      productName,
      productId,
      description,
      premiumCurrency,
      limitsCurrency,
      status,
      productVersionId,
      country,
      marketingName,
    } = this.product?.value;
    const { effectiveDate, expiryDate } = this.product?.value?.dateRange;
    const statusdata = this.status.filter((x) => x.code === status);
    const data: ProductRequest = {
      productId: productId,
      productVersionId: productVersionId,
      requestId: '1',
      header: {
        productName: productName.trim(),
        productVersionName: productName,
        shortName: productName,
        marketingName: marketingName,
        description: description.trim(),
        status: {
          value: statusdata[0].code,
          category: Category.PRODUCTSTATUS,
        },

        premiumCurrency: {
          value: premiumCurrency,
          category: Category.CURRENCY,
        },
        country: [country],
        effectiveDate: effectiveDate,
        expiryDate: expiryDate,
      },
      rating: {
        premiumRatingFactors: [],
      },
    };
    localStorage.setItem('country', country);
    if (this.isLimitsCurrencyEnable) {
      data.header.limitsCurrency = {
        value: limitsCurrency ? limitsCurrency : '',
        category: Category.CURRENCY,
      };
    } else {
      data.header.limitsCurrency = null;
    }

    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: `${productId} Product details created successfully`,
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Product details creation failed',
        duration: 5000,
      },
    };
    this._productService.create(data).subscribe({
      next: (res) => {
        this.updateLocalStorage(res.productId, res.productVersionId);
        this.isDisabledNext = false;
        const { productId, productVersionId } = res;
        const { country, status } = res?.header;
        this._productContextService._setProductContext(
          productId,
          productVersionId,
          crypto.randomUUID(),
          country ?? [],
          country ?? [],
          status?.value ?? ''
        );
        /**
         * After creating the product we are redirecting to Product overview page.
         */
        this.createAvailability();
        this._router.navigate([`/products/${res.productId}/update`]);
        this._layoutService.showMessage(toastMessageConfig['success']);
      },
      error: (e) => {
        this.setProductIdExistsMessage(e);
        if (
          e.error.errors &&
          e.error.errors.PMERR000024[0] ===
            `Product ${productId} already exists.`
        ) {
          this._layoutService.showMessage({
            severity: 'error',
            message: `Product ID ${productId} already exists`,
          });
        } else {
          this._layoutService.showMessage(toastMessageConfig['error']);
        }
      },
    });
  }

  /**
   * It will return product id error if already exists.
   * @param e is a HttpErrorResponse from API call if it fails.
   */
  setProductIdExistsMessage(e: HttpErrorResponse) {
    const { status, ok, error, statusText } = e;
    const { productId } = this.product?.value;
    if (
      (status === 409 &&
        ok === false &&
        error === `Product ${productId} already exists.`) ||
      (e.error.errors &&
        e.error.errors.PMERR000024[0] ===
          `Product ${productId} already exists.`)
    ) {
      this.product.controls['productId'].setErrors({
        exists: `Product ID ${productId} already exists.`,
      });
    }
  }

  updateLocalStorage(productId: string, productVersionId: string) {
    localStorage.setItem('productId', productId);
    localStorage.setItem('productVersionId', productVersionId || '');
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      this.productVersionId = localStorage.getItem('productVersionId') || '';
      this.productId = localStorage.getItem('productId') || '';
    }
  }

  next(): void {
    this._sharedService.nextButtonClicked.next({ stepCount: 1 });
  }

  previous(): void {
    this._router.navigate([`products`]);
  }

  onInput(): void {
    this.showLimitsCurrency = this.currencyToggle ? true : false;
  }

  /**
   * While user chnage the limits currency, the selected value will be assigned to
   * 'limitsCurrencyValue'. It will useful while the product save.
   */
  updateLimitsCurrency() {
    this.limitsCurrencyValue = !isNullOrUndefined(
      this.product.get('limitsCurrency')?.value
    )
      ? this.product.get('limitsCurrency')?.value
      : '';
  }

  /**
   * Limits currency will display based on user choice.
   */
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

  get dateRange() {
    return this.product.get('dateRange')?.value;
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
    const expiryDate = new Date(c.get('expiryDate')?.value);
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    if (!isNaN(effectiveDate.getDate())) {
      if (effectiveDate < today) {
        return { isEffectiveDatePast: true };
      }
    }
    if (effectiveDate >= expiryDate) {
      c.setAsyncValidators;
      c.markAsTouched;
      c.get('effectiveDate')?.markAsDirty;
      return { dateRangeInvalid: true };
    }
    if (!c.get('effectiveDate')?.pristine && isNaN(effectiveDate.getTime())) {
      return { effectiveDateInvalid: true };
    }
    if (!c.get('expiryDate')?.pristine && isNaN(expiryDate.getTime())) {
      return { expiryDateInvalid: true };
    }
    return null;
  }

  getCurrency(country: string) {}
  getCountrySettingList(countryResponse: any) {
    const countrySettingUrl =
      '/canvas/api/catalyst/country-settings?languageKey=229';
    this._productService.getCountrySettings(countrySettingUrl).subscribe({
      next: (settingsRes) => {
        this.countrySettingsData = settingsRes.data;
        this.countrySettingsData.forEach((setting: any) => {
          this.countryList.push({
            id: '',
            description: setting.country,
            rank: 0,
            code: setting.countryCode,
          });
        });

        // this.processCountryData(countryResponse, settingsRes.data, true);
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
}
