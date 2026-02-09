import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  CanvasFormComponent,
  LayoutService,
  TableComponent,
} from '@canvas/components';
import {
  ColumnOptions,
  SortOrder,
  StepConfiguration,
  TableOptions,
} from '@canvas/components/types';
import { AppContextService, TableService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbDateInputModule,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbSelectChoiceModule,
  CbToggleModule,
} from '@chubb/ui-components';
import { combineLatest } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { AvailabilityRequest } from '../../types/availability';
import { CountryCodes } from '../../types/constants';
import { MasterData } from '../../types/master-data';
import { MinimumPremiumLabels } from '../../types/minimum-premium';
import { CommissionRoutine } from '../../types/policy-configuration';
import { Countries, ProductRequest } from '../../types/product';
import { Category, MsgIds } from '../../types/ref-data';
import { PolicyConfigurationLabels } from './model/policy-configuration.model';

@Component({
  selector: 'canvas-policy-configuration',
  standalone: true,
  imports: [
    CommonModule,
    CbIconModule,
    CbButtonModule,
    CbSelectChoiceModule,
    CbToggleModule,
    CbInputModule,
    ReactiveFormsModule,
    CbDateInputModule,
    FormsModule,
    CanvasFormComponent,
    inputUnselectPipe,
    TableComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe],
  templateUrl: './policy-configuration.component.html',
  styleUrls: ['./policy-configuration.component.scss'],
})
export class PolicyConfigurationComponent implements OnInit {
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  policyConfigurationForm: FormGroup;
  isTerm = false;
  isAutoRenewalType = false;
  isRenewalType = false;
  policyType: MasterData[];
  refundType: MasterData[];
  refundValueType: MasterData[];
  refundFreqType: MasterData[];
  policyPeriodType: MasterData[];
  coolingPeriodType: MasterData[];
  taxCharge: MasterData[];
  commissionRoutine: MasterData[];
  roundingTypes: MasterData[];
  termEnd: MasterData[];
  renewalType: MasterData[];
  policyNumberRenewal: MasterData[];
  renewalReferralSetting: MasterData[];
  productId: string;
  productVersionId: string;
  productResponse!: ProductRequest;
  premium = false;
  protected iconSize: CbIconSize = CbIconSize.REGULAR;
  isDisable = false;
  minimumPremiumList!: any;
  options!: TableOptions;
  avilabilityDetails: AvailabilityRequest;
  labels!: MinimumPremiumLabels;
  fetchTableData = false;
  currentCountry: string;
  isMinimumPremiumValid: boolean;
  isPerpetual = true;

  stateColumn: ColumnOptions[];
  countryColumn: ColumnOptions[];

  RenewalNoticePeriodDays: number;
  nonRenewalNotificationDate: Date = new Date(
    new Date().setDate(new Date().getDate() - 1)
  );

  policyLabels!: PolicyConfigurationLabels;

  numberPattern = '^[0-9]*$';

  constructor(
    private readonly _appContextService: AppContextService,
    private _sharedService: SharedService,
    private _fb: FormBuilder,
    private _layoutService: LayoutService,
    private datepipe: DatePipe,
    private _router: Router,
    private _productService: ProductsService,
    private _ref: ChangeDetectorRef,
    private readonly _tableService: TableService,
    private _availabilityService: AvailabilityService,
    private _productContextService: ProductContextService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this._fetchReferenceData();
    this._updateLayout();

    this.labels = <MinimumPremiumLabels>(
      this._appContextService.get('pages.minimumPremium.labels')
    );

    this.stateColumn = <ColumnOptions[]>(
      this._appContextService.get(
        'pages.product.policy-configuration.stateColumn'
      )
    );

    this.countryColumn = <ColumnOptions[]>(
      this._appContextService.get(
        'pages.product.policy-configuration.countryColumn'
      )
    );

    this.policyLabels = <PolicyConfigurationLabels>(
      this._appContextService.get('pages.product.policy-configuration.labels')
    );
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
        label: 'Policy configuration',
        routerLink: `/products/${this.productId}/policyconfiguration`,
      },
    ]);
    this._layoutService.caption$.next('');
  }
  ngOnInit(): void {
    const statusVal = this._productContextService.isProductDisabled();

    this.policyConfigurationForm = this._fb.group(
      {
        policyType: [{ value: '', disabled: statusVal }, [Validators.required]],
        policyPrefix: [
          { value: '', disabled: statusVal },
          [Validators.required, Validators.maxLength(3)],
        ],
        breakdownEventByCoverageVariant: [
          { value: false, disabled: statusVal },
        ],
        quoteSuffix: [{ value: '', disabled: statusVal }],
        allowMultiplePolicy: [{ value: true, disabled: statusVal }, []],
        freeCoveragePolicy: [
          { value: false, disabled: statusVal },
          [Validators.required],
        ],
        refundType: [{ value: '', disabled: statusVal }, []],
        refundValueType: [{ value: '', disabled: true }, []],
        refundValue: [
          { value: '', disabled: statusVal },
          [Validators.maxLength(50), Validators.pattern(this.numberPattern)],
        ],
        frequencyType: [{ value: '', disabled: statusVal }, []],
        frequencyValue: [
          { value: '', disabled: statusVal },
          [Validators.maxLength(50), Validators.pattern(this.numberPattern)],
        ],
        singlePremium: [{ value: false, disabled: statusVal }, []],
        policyPeriodType: [{ value: '', disabled: statusVal }],
        policyPeriodValue: [
          { value: '', disabled: statusVal },
          [Validators.maxLength(50), Validators.pattern(this.numberPattern)],
        ],
        coolingPeriodType: [{ value: '', disabled: statusVal }],
        coolingPeriodValue: [
          { value: '', disabled: statusVal },
          [Validators.maxLength(50), Validators.pattern(this.numberPattern)],
        ],
        taxCharge: [{ value: '', disabled: statusVal }, [Validators.required]],
        preRenewalPeriodDays: [{ value: null, disabled: statusVal }, []],
        nonRenewalNotificationDate: [{ value: null, disabled: statusVal }],
        renewalNoticePeriodDays: [{ value: null, disabled: statusVal }, []],
        renewalReferralSetting: [{ value: null, disabled: statusVal }, []],
        commissionRoutine: [
          { value: '', disabled: statusVal },
          [Validators.required],
        ],
        roundingRule: [{ value: 'ROUNDING_NEAREST', disabled: statusVal }, []],
        onTermEnd: [
          { value: 'PERPETUAL', disabled: statusVal },
          [Validators.required],
        ],
        renewalType: [{ value: '', disabled: statusVal }, []],
        policyNumber: [{ value: '', disabled: statusVal }, []],
      },
      { validators: this.preRenewalValidator() }
    );
    this.policyConfigurationForm
      .get('preRenewalPeriodDays')
      ?.valueChanges.subscribe(() => {
        this.policyConfigurationForm.updateValueAndValidity();
      });

    this.policyConfigurationForm
      .get('renewalNoticePeriodDays')
      ?.valueChanges.subscribe(() => {
        this.policyConfigurationForm.updateValueAndValidity();
      });
    this.setValidation();
    this.policyConfigurationForm
      .get('singlePremium')
      ?.valueChanges.subscribe((value) => {
        if (statusVal) {
          this.isTerm = false;
          this.isAutoRenewalType = false;
          this.policyConfigurationForm.get('policyPeriodType')?.disable();
          this.policyConfigurationForm.get('policyPeriodValue')?.disable();
          this.policyConfigurationForm.get('taxCharge')?.disable();
          this.policyConfigurationForm.get('roundingRule')?.disable();
          this.policyConfigurationForm.get('onTermEnd')?.disable();
          this.policyConfigurationForm.get('coolingPeriodType')?.disable();
          this.policyConfigurationForm.get('coolingPeriodValue')?.disable();
          this.policyConfigurationForm.get('preRenewalPeriodDays')?.disable();
          this.policyConfigurationForm
            .get('renewalNoticePeriodDays')
            ?.disable();
          this.policyConfigurationForm.get('renewalReferralSetting')?.disable();
        } else {
          if (!value) {
            this.policyConfigurationForm.get('policyPeriodType')?.enable();
            this.policyConfigurationForm.get('policyPeriodValue')?.enable();
            this.policyConfigurationForm.get('taxCharge')?.enable();
            this.policyConfigurationForm.get('roundingRule')?.enable();
            this.policyConfigurationForm.get('onTermEnd')?.enable();
            this.policyConfigurationForm.get('coolingPeriodType')?.enable();
            this.policyConfigurationForm.get('coolingPeriodValue')?.enable();
            this.policyConfigurationForm.get('preRenewalPeriodDays')?.enable();
            this.policyConfigurationForm
              .get('renewalNoticePeriodDays')
              ?.enable();
            this.policyConfigurationForm
              .get('renewalReferralSetting')
              ?.enable();
          } else {
            this.isTerm = false;
            this.isAutoRenewalType = false;
            this.policyConfigurationForm.get('policyPeriodType')?.disable();
            this.policyConfigurationForm.get('policyPeriodValue')?.disable();
            this.policyConfigurationForm.get('taxCharge')?.disable();
            this.policyConfigurationForm.get('roundingRule')?.disable();
            this.policyConfigurationForm.get('onTermEnd')?.disable();
            this.policyConfigurationForm.get('coolingPeriodType')?.disable();
            this.policyConfigurationForm.get('coolingPeriodValue')?.disable();
            this.policyConfigurationForm.get('preRenewalPeriodDays')?.disable();
            this.policyConfigurationForm
              .get('renewalNoticePeriodDays')
              ?.disable();
            this.policyConfigurationForm
              .get('renewalReferralSetting')
              ?.disable();
          }
        }
      });

    this.policyConfigurationForm
      .get('refundType')
      ?.valueChanges.subscribe((value) => {
        if (statusVal) {
          this.policyConfigurationForm.get('refundValueType')?.disable();
          this.policyConfigurationForm.get('refundValue')?.disable();
          this.policyConfigurationForm.get('frequencyType')?.disable();
          this.policyConfigurationForm.get('frequencyValue')?.disable();
          this.isDisable = true;
        } else {
          if (value === MsgIds.NO_REFUND) {
            this.policyConfigurationForm.get('refundValueType')?.disable();
            this.policyConfigurationForm.get('refundValue')?.disable();
            this.policyConfigurationForm.get('frequencyType')?.disable();
            this.policyConfigurationForm.get('frequencyValue')?.disable();
          } else {
            this.policyConfigurationForm.get('refundValueType')?.enable();
            this.policyConfigurationForm.get('refundValue')?.enable();
            this.policyConfigurationForm.get('frequencyType')?.enable();
            this.policyConfigurationForm.get('frequencyValue')?.enable();
          }
        }
      });
    this.policyConfigurationForm
      .get('onTermEnd')
      ?.valueChanges.subscribe((value) => {
        if (value === 'PERPETUAL') {
          this.isPerpetual = true;
        } else {
          this.isPerpetual = false;
        }
      });
    if (this.isCurrentCountryNonUS()) {
      this.setMinimumPremuimTableColumn();
    }
  }

  ngDoCheck() {
    this._ref.detectChanges();
  }

  removeControls(fields: string[]): void {
    fields?.map((field) => {
      this.policyConfigurationForm.removeControl(field);
    });
  }

  addRequiredValidator(fields: string[]): void {
    fields?.map((field) => {
      this.policyConfigurationForm
        .get(field)
        ?.addValidators(Validators.required);
    });
  }

  updatePolicyPeriodValidators(setValidator: boolean): void {
    const policyPeriodType =
      this.policyConfigurationForm.get('policyPeriodType');
    const policyPeriodValue =
      this.policyConfigurationForm.get('policyPeriodValue');
    if (setValidator) {
      policyPeriodType?.setValidators(Validators.required);
      policyPeriodValue?.setValidators([
        Validators.required,
        Validators.pattern(this.numberPattern),
      ]);
    } else {
      policyPeriodType?.removeValidators(Validators.required);
      policyPeriodValue?.removeValidators(Validators.required);
    }
  }

  onTermChange(data?: any) {
    if (data?.renewalNumber) {
      this.policyConfigurationForm.patchValue({
        renewalType: data?.renewalNumber,
      });
    }
    const temval = this.policyConfigurationForm.get('onTermEnd')?.value;
    if (temval === 'AUTO_RENEW') {
      this.isTerm = true;
      this.isPerpetual = false;
      this.isRenewalType = false;

      this.policyConfigurationForm.addControl(
        'renewalType',
        this._fb.control(
          data?.renewalNumber ? data?.renewalNumber : '',
          Validators.required
        )
      );

      this.addRequiredValidator(['renewalType']);

      this.removeControls([
        'preRenewalPeriodDays',
        'renewalNoticePeriodDays',
        'renewalReferralSetting',
        'renewalToggle',
      ]);
      this.updatePolicyPeriodValidators(true);
    } else if (temval === 'PERPETUAL') {
      this.isPerpetual = true;
      this.isTerm = false;
      this.isAutoRenewalType = false;
      this.isRenewalType = false;

      this.removeControls([
        'renewalType',
        'policyNumber',
        'preRenewalPeriodDays',
        'nonRenewalNotificationDate',
        'renewalNoticePeriodDays',
        'renewalReferralSetting',
        'renewalToggle',
      ]);

      this.updatePolicyPeriodValidators(false);

      if (data?.renewalNumber) {
        this.policyConfigurationForm.patchValue({
          renewalType: data?.renewalNumber,
        });
      }
    } else if (temval === 'RENEW') {
      this.isRenewalType = true;
      this.isPerpetual = false;
      this.isTerm = false;
      this.isAutoRenewalType = false;
      this.isRenewalType = true;
      if (!this.policyConfigurationForm.contains('renewalToggle')) {
        this.policyConfigurationForm.addControl(
          'renewalToggle',
          this._fb.control(false) // Default to false
        );
      }
      this.removeControls(['renewalType', 'policyNumber']);
      let defaultRenewalReferralSetting = 'RUNREFRULES';
      if (this.isCurrentCountryNonUS()) {
        defaultRenewalReferralSetting = 'SYSTEMAPPROVED';
      }

      if (data && data.renewalReferralSetting) {
        defaultRenewalReferralSetting = data.renewalReferralSetting;
      }

      this.policyConfigurationForm.addControl(
        'renewalReferralSetting',
        this._fb.control(null, Validators.required)
      );
      this.addRequiredValidator(['renewalReferralSetting']);

      this.policyConfigurationForm
        ?.get('renewalReferralSetting')
        ?.setValue(defaultRenewalReferralSetting);

      this.updatePolicyPeriodValidators(true);
      if (this.isCurrentCountryNonUS()) {
        this.policyConfigurationForm.addControl(
          'preRenewalPeriodDays',
          this._fb.control(data?.preRenewalPeriodDays, Validators.required)
        );
        this.policyConfigurationForm.addControl(
          'renewalNoticePeriodDays',
          this._fb.control(data?.preRenewalPeriodDays, Validators.required)
        );
        this.addRequiredValidator([
          'preRenewalPeriodDays',
          'renewalNoticePeriodDays',
        ]);
      }
    } else {
      this.isPerpetual = false;
      this.isTerm = false;
      this.isAutoRenewalType = false;
      this.isRenewalType = false;
      this.removeControls([
        'renewalToggle',
        'renewalType',
        'policyNumber',
        'preRenewalPeriodDays',
        'nonRenewalNotificationDate',
        'renewalNoticePeriodDays',
        'renewalReferralSetting',
      ]);
    }

    this.policyConfigurationForm
      .get('policyPeriodType')
      ?.updateValueAndValidity();
    this.policyConfigurationForm
      .get('policyPeriodValue')
      ?.updateValueAndValidity();
  }

  onRenewalChange(policyNum?: string) {
    const renval = this.policyConfigurationForm.get('renewalType')?.value;
    if (
      renval === 'Explicit Auto renewal' ||
      renval === 'EXPL_AUTO_REN' ||
      renval === '5541'
    ) {
      this.isAutoRenewalType = true;
      this.policyConfigurationForm.addControl(
        'policyNumber',
        this._fb.control(policyNum ? policyNum : '')
      );
      if (policyNum) {
        this.policyConfigurationForm.patchValue({
          policyNumber: policyNum,
        });
      }
      this.policyConfigurationForm
        .get('policyNumber')
        ?.addValidators(Validators.required);
    } else {
      this.removeControls(['policyNumber']);
      //this.policyConfigurationForm.removeControl('policyNumber');
      this.isAutoRenewalType = false;
    }
  }

  getStepConfig(): StepConfiguration {
    const stepConfig: StepConfiguration = {
      stepCount: this._productService.getStepCount(),
    };
    if (this._productService.getSelectedCountry() !== CountryCodes.US) {
      stepConfig.isRoute = true;
      stepConfig.routeOrFunction = `/products/${this.productId}/coveragevariant`;
    }
    return stepConfig;
  }

  submit() {
    this._sharedService.nextButtonClicked.next(this.getStepConfig());
  }

  next(): void {
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next(this.getStepConfig());
    } else {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Policy configuration Saved Successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'Unable to create policy configuration.',
          duration: 5000,
        },
        warning: {
          severity: 'warn',
          message: 'Product could not be updated as it is in Final status',
          duration: 5000,
        },
        minimumPremiumError: {
          severity: 'error',
          message: 'Please enter valid number in minimum premium amount',
          duration: 5000,
        },
      };
      if (this.isCurrentCountryNonUS()) {
        this.minimumPremiumdetailValidator();

        if (!this.isMinimumPremiumValid) {
          this._layoutService.showMessage(
            toastMessageConfig['minimumPremiumError']
          );
          return;
        }
      }

      this._markAllFieldsDirty(this.policyConfigurationForm);
      this._prepareRequestObject();
      this._productService
        .updatePolicy(this.productResponse, this.productVersionId)
        .subscribe({
          next: () => {
            this._sharedService.nextButtonClicked.next(this.getStepConfig());
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          complete: () => {
            this.updateMinimumPremiumdetail();
          },
        });
    }
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({
      stepCount: 1,
    });
  }

  saveAndExit(): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Policy configuration Saved Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to create policy configuration.',
        duration: 5000,
      },
      warning: {
        severity: 'warn',
        message: 'Product could not be updated as it is in Final status',
        duration: 5000,
      },
      minimumPremiumError: {
        severity: 'error',
        message: 'Please enter valid number in minimum premium amount',
        duration: 5000,
      },
    };

    if (this.isCurrentCountryNonUS()) {
      this.minimumPremiumdetailValidator();

      if (!this.isMinimumPremiumValid) {
        this._layoutService.showMessage(
          toastMessageConfig['minimumPremiumError']
        );
        return;
      }
    }

    this._markAllFieldsDirty(this.policyConfigurationForm);
    this._prepareRequestObject();
    this._productService
      .updatePolicy(this.productResponse, this.productVersionId)
      .subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
          this.updateMinimumPremiumdetail();
        },
        error: (res) => {
          if (String(res.error).includes('not allowed for update operation')) {
            // this._layoutService.showMessage(toastMessageConfig['warning']);
          } else {
            this._layoutService.showMessage(toastMessageConfig['error']);
          }
        },
        complete: () => {
          this.updateMinimumPremiumdetail();
        },
      });
    this._router.navigate(['products']);
  }

  private _fetchReferenceData(): void {
    combineLatest([
      this._productService.getReferenceData(Category.POLTYPE),
      this._productService.getReferenceData(Category.RFDTYPE),
      this._productService.getReferenceData(Category.RFDVAL),
      this._productService.getReferenceData(Category.REFREQTY),
      this._productService.getReferenceData(Category.POLPDTYPE),
      this._productService.getReferenceData(Category.PMTAX),
      this._productService.getReferenceData(Category.ROUNDING_TYPES),
      this._productService.getReferenceData(Category.TERMOPTION),
      this._productService.getReferenceData(Category.COMMISSIONROUTINE),
      this._productService.getReferenceData(Category.RENTYP),
      this._productService.getReferenceData(Category.POLNUM),
      this._productService.getReferenceData(Category.RENEWREFERRALSETTING),
      this._productService.getProduct(this.productId, this.productVersionId),
    ]).subscribe({
      next: (response) => {
        this.policyType = response[0];
        this.refundType = response[1];
        this.refundValueType = response[2];
        this.refundFreqType = response[3];
        this.coolingPeriodType = this.policyPeriodType = response[4];
        this.taxCharge = response[5];
        this.roundingTypes = response[6];
        this.termEnd = response[7];
        this.commissionRoutine = response[8];
        this.renewalType = response[9];
        this.policyNumberRenewal = response[10];
        this.renewalReferralSetting = response[11];
        this.productResponse = response[12];
        if (
          this.productResponse?.lifeCycle?.newPolicy != null &&
          this.productResponse?.lifeCycle?.newPolicy != undefined
        ) {
          this._prefillData(this.productResponse);
        }
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Unable to fetch data. please try again.',
          duration: 5000,
        });
      },
    });
  }

  setMinimumPremuimTableColumn() {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: this.labels.getErrorMessage,
        duration: 5000,
      },
    };
    this._availabilityService
      .getMinimumPremium(this.productId, this.productVersionId)
      .subscribe({
        next: (data) => {
          this.avilabilityDetails = data;
          const availabilityDetail = data.standards;
          this.currentCountry = availabilityDetail[0].country;
          const statusVal = this._productContextService.isProductDisabled();
          this.minimumPremiumList =
            this.currentCountry == Countries.USA
              ? availabilityDetail[0].states
              : availabilityDetail;
          if (statusVal) {
            this.minimumPremiumList.map((item: any) => {
              item.isReadOnly = statusVal;
              return item;
            });
          }
          const columns = (
            this.currentCountry === Countries.USA
              ? this.stateColumn
              : this.countryColumn
          ).reduce((coll, currCol) => {
            let col = currCol;
            if (['isRefundable'].includes(currCol.fieldName)) {
              col = {
                ...col,
                additionalProperties: {
                  ...(<object>col.additionalProperties),
                  readOnly: statusVal,
                },
              };
            }
            coll.push(col);
            return coll;
          }, [] as ColumnOptions[]);
          this.options = <TableOptions>{
            showPaginator: true,
            defaultSortField: 'isRefundable',
            defaultSortOrder: SortOrder.DESC,
            rowsPerPageOptions: [15, 30, 50, 100],
            columns: columns,
            customSort: (event) =>
              this._tableService.nativeSortWithFavoritesPriority(event),
          };
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
  }

  updateMinimumPremiumdetail() {
    if (this.isCurrentCountryNonUS()) {
      const availabilityDetail: AvailabilityRequest =
        this.minimumPremiumdetailValidator();
      this.fetchTableData = false;
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: this.labels.updateSuccessMessage,
        },
        error: {
          severity: 'error',
          message: this.labels.updateErrorMessage,
        },
      };

      this._availabilityService
        .updatestandard(
          availabilityDetail,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: (response) => {
            this.fetchTableData = true;
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          error: (error) => {
            this.fetchTableData = false;
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
  }

  minimumPremiumdetailValidator() {
    let availabilityDetail: AvailabilityRequest;
    if (this.currentCountry == Countries.USA) {
      const premiumList = this.minimumPremiumList;
      if (premiumList && premiumList.length > 0) {
        premiumList.map((premium: any) => {
          premium.minEarnedPremium = this.hasMinEarnedPremiumValue(
            premium.minEarnedPremium
          )
            ? Number(premium.minEarnedPremium)
            : null;
          if (
            premium.minEarnedPremium === null ||
            (typeof premium.minEarnedPremium == 'number' &&
              premium.minEarnedPremium >= 0)
          ) {
            this.isMinimumPremiumValid = true;
          } else {
            this.isMinimumPremiumValid = false;
          }
        });
      } else {
        this.isMinimumPremiumValid = true;
      }
      availabilityDetail = { ...this.avilabilityDetails, requestId: uuidv4() };
      availabilityDetail.standards[0].states = premiumList;
    } else {
      const premiumList = this.minimumPremiumList[0];
      premiumList.minEarnedPremium = this.hasMinEarnedPremiumValue(
        premiumList.minEarnedPremium
      )
        ? Number(premiumList.minEarnedPremium)
        : null;
      if (
        premiumList.minEarnedPremium === null ||
        (typeof premiumList.minEarnedPremium === 'number' &&
          premiumList.minEarnedPremium >= 0)
      ) {
        this.isMinimumPremiumValid = true;
      } else {
        this.isMinimumPremiumValid = false;
      }
      // delete premiumList.countryName;
      availabilityDetail = {
        ...this.avilabilityDetails,
        standards: [premiumList],
        requestId: uuidv4(),
      };
    }
    return availabilityDetail;
  }

  onRefundChange() {
    this.setValidation();
  }

  //#region Private methods
  private setValidation() {
    const renval = this.policyConfigurationForm.get('refundType')?.value;

    if (
      renval === MsgIds.ROP_FIXEDAMT ||
      renval === MsgIds.ROP_REFUND ||
      renval === MsgIds.ROP_REF_CANC ||
      renval === MsgIds.ROP_REF_FIXED_AMT
    ) {
      this.policyConfigurationForm.controls['refundValueType'].setValidators([
        Validators.required,
      ]);

      this.policyConfigurationForm.controls['refundValue'].setValidators([
        Validators.required,
        Validators.pattern(this.numberPattern),
      ]);
    } else {
      this.policyConfigurationForm.controls[
        'refundValueType'
      ].clearValidators();
      this.policyConfigurationForm.controls['refundValue'].removeValidators(
        Validators.required
      );
    }
  }
  get field(): { [key: string]: AbstractControl } {
    return this.policyConfigurationForm.controls;
  }
  private _markAllFieldsDirty(form: AbstractControl): void {
    form?.markAsDirty();
    if (form instanceof FormGroup && form.controls) {
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        control?.markAsDirty();
        this._markAllFieldsDirty(control as FormGroup);
      });
    }
    if (form instanceof FormArray) {
      for (let i = 0; i < form.length; i++) {
        Object.keys((form.controls[i] as FormGroup).controls).forEach((key) => {
          const control = form.controls[i].get(key);
          control?.markAsDirty();
        });
      }
    }
  }

  private _prepareRequestObject(): void {
    const poldata =
      this.policyConfigurationForm.get('refundValueType')?.value ?? '';
    const polPerioddata =
      this.policyConfigurationForm.get('policyPeriodType')?.value ?? '';
    const colPerioddata =
      this.policyConfigurationForm.get('coolingPeriodType')?.value ?? '';
    const renewdata =
      this.policyConfigurationForm.get('renewalType')?.value ?? '';
    const commissionRoutine =
      this.policyConfigurationForm.get('commissionRoutine')?.value ?? '';
    const polprefix =
      this.policyConfigurationForm.get('policyPrefix')?.value ?? '';
    const quoteSuffix =
      this.policyConfigurationForm.get('quoteSuffix')?.value ?? '';
    const polno = this.policyConfigurationForm.get('policyNumber')?.value ?? '';
    const roundingRule =
      this.policyConfigurationForm.get('roundingRule')?.value ?? '';
    const term = this.policyConfigurationForm.get('onTermEnd')?.value ?? '';
    const renewalToggle = this.policyConfigurationForm.get('renewalToggle')?.value ?? false;
    const tax = this.policyConfigurationForm.get('taxCharge')?.value ?? '';
    const freeCoveragePolicy =
      this.policyConfigurationForm.get('freeCoveragePolicy')?.value ?? false;
    const breakdownEventByCoverageVariant =
      this.policyConfigurationForm.get('breakdownEventByCoverageVariant')
        ?.value ?? false;
    const refundType =
      this.policyConfigurationForm.get('refundType')?.value ?? MsgIds.NO_REFUND;
    const refundFrequencyType =
      this.policyConfigurationForm.get('frequencyType')?.value;
    const poltype = this.policyConfigurationForm.get('policyType')?.value ?? '';
    const preRenewalPeriodDays =
      this.policyConfigurationForm.get('preRenewalPeriodDays')?.value ?? null;
    const nonRenewalNotificationDate =
      this.policyConfigurationForm.get('nonRenewalNotificationDate')?.value ??
      null;
    const renewalNoticePeriodDays =
      this.policyConfigurationForm.get('renewalNoticePeriodDays')?.value ??
      null;
    const renewalReferralSetting =
      this.policyConfigurationForm.get('renewalReferralSetting')?.value ?? '';
    this.productResponse.requestId = '1';
    this.productResponse.lifeCycle = {
      newPolicy: {
        policyPrefix: polprefix || '',
        quoteSuffix: quoteSuffix || '',
        allowedEffectiveDateTypes: '',
        restictedPolicyTransaction: [''],
        policyType: poltype ?? '',
        freeCoveragePolicy: freeCoveragePolicy,
        breakdownEventByCoverageVariant: breakdownEventByCoverageVariant,
        refundValueType: {
          value: poldata ?? '',
          category: Category.RFDVAL,
        },
        refundValue:
          this.policyConfigurationForm.get('refundValue')?.value ?? '',
        refundFrequencyValue:
          this.policyConfigurationForm.get('frequencyValue')?.value ?? '',
        policyPeriodType: {
          value: polPerioddata ?? '',
          category: Category.POLPDTYPE,
        },
        policyPeriodValue:
          this.policyConfigurationForm.get('policyPeriodValue')?.value ?? '',
        coolingPeriodType: {
          value: colPerioddata ?? '',
          category: Category.POLPDTYPE,
        },
        coolingPeriodValue:
          this.policyConfigurationForm
            .get('coolingPeriodValue')
            ?.value?.toString() ?? '',
        roundingType: {
          value: roundingRule ?? '',
          category: Category.ROUNDING_TYPES,
        },
        taxChargeRoutine: tax ?? '',
        renewalType: {
          value: renewdata ?? '',
          category: Category.RENTYP,
        },
        commissionRoutine: {
          value: commissionRoutine ?? '',
          category: Category.COMMISSIONROUTINE,
        },
        policyNumberAssignmentonRenewal: polno ?? '',
        isMicroPolicy: false,
        periodOfInsurance: {
          m: 0,
          endTerm: term ?? '',
          singlePremiumexpirationdateatregistration:
            this.policyConfigurationForm.get('singlePremium')?.value ?? false,
        },
        refundType: {
          value: refundType ?? '',
          category: Category.RFDTYPE,
        },
        refundFrequencyType: {
          value: refundFrequencyType ?? '',
          category: Category.REFREQTY,
        },
        isMultiplePoliciesAllowed:
          this.policyConfigurationForm.get('allowMultiplePolicy')?.value ??
          true,
        preRenewalPeriodDays,
        nonRenewalNotificationDate,
        renewalNoticePeriodDays,
        renewalReferralSetting: {
          value: renewalReferralSetting ?? '',
          category: Category.RENEWREFERRALSETTING,
        },
        isRenewalHandledByPartner: renewalToggle,
      },
    };
  }

  private _prefillData(productData: ProductRequest) {
    if (
      productData.lifeCycle?.newPolicy != null &&
      productData.lifeCycle.newPolicy != undefined
    ) {
      const preRenewalPeriodDays =
        productData?.lifeCycle?.newPolicy?.preRenewalPeriodDays ?? null;
      // Check if 'onTermEnd' is 'RENEW'
      const onTermEnd =
        productData?.lifeCycle?.newPolicy?.periodOfInsurance?.endTerm;
      if (onTermEnd === 'RENEW') {
        // Add the toggle control if not present
        if (!this.policyConfigurationForm.contains('renewalToggle')) {
          this.policyConfigurationForm.addControl(
            'renewalToggle',
            this._fb.control(false)
          );
        }
        // Patch the value from backend, default to false if not present
        this.policyConfigurationForm.patchValue({
          renewalToggle:
            productData?.lifeCycle?.newPolicy?.isRenewalHandledByPartner ??
            false,
        });
      } else {
        // Remove the toggle if not in RENEW mode
        if (this.policyConfigurationForm.contains('renewalToggle')) {
          this.policyConfigurationForm.removeControl('renewalToggle');
        }
      }
      const nonRenewalNotificationDate =
        this.datepipe
          .transform(
            productData?.lifeCycle?.newPolicy?.nonRenewalNotificationDate,
            'yyyy-MM-dd'
          )
          ?.toString() ?? null;
      const renewalNoticePeriodDays =
        productData?.lifeCycle?.newPolicy?.renewalNoticePeriodDays ?? null;
      const renewalReferralSetting =
        this.renewalReferralSetting
          ?.filter(
            (x) =>
              x?.code?.toLowerCase() ===
              productData?.lifeCycle?.newPolicy?.renewalReferralSetting?.value?.toLowerCase()
          )
          .map((x) => x?.code)[0] || '';
      this.policyConfigurationForm.patchValue({
        policyType:
          this.policyType
            .filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.policyType?.toLowerCase()
            )
            .map((x) => x.code)[0] ?? '',
        policyPrefix: productData?.lifeCycle?.newPolicy?.policyPrefix,
        quoteSuffix: productData?.lifeCycle?.newPolicy?.quoteSuffix,
        allowMultiplePolicy:
          productData?.lifeCycle?.newPolicy?.isMultiplePoliciesAllowed,
        freeCoveragePolicy:
          productData?.lifeCycle?.newPolicy?.freeCoveragePolicy,
        breakdownEventByCoverageVariant:
          productData?.lifeCycle?.newPolicy?.breakdownEventByCoverageVariant,
        refundType: productData?.lifeCycle?.newPolicy?.refundType?.value,
        refundValueType:
          this.refundValueType
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.refundValueType?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        refundValue: productData?.lifeCycle?.newPolicy?.refundValue,
        frequencyType:
          productData?.lifeCycle?.newPolicy?.refundFrequencyType?.value ||
          'DAY',
        frequencyValue: productData?.lifeCycle?.newPolicy?.refundFrequencyValue,
        singlePremium:
          productData?.lifeCycle?.newPolicy?.periodOfInsurance
            ?.singlePremiumexpirationdateatregistration,
        policyPeriodType:
          this.policyPeriodType
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.policyPeriodType?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        policyPeriodValue: productData?.lifeCycle?.newPolicy?.policyPeriodValue,
        coolingPeriodType:
          this.coolingPeriodType
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.coolingPeriodType?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        coolingPeriodValue:
          productData?.lifeCycle?.newPolicy?.coolingPeriodValue,
        roundingRule:
          this.roundingTypes
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.roundingType?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || 'ROUNDING_NEAREST',
        taxCharge:
          this.taxCharge
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.taxChargeRoutine?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        onTermEnd:
          this.termEnd
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.periodOfInsurance?.endTerm?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        renewalType:
          this.renewalType
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.renewalType?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        commissionRoutine:
          this.commissionRoutine
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.commissionRoutine?.value?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',
        policyNumber:
          this.policyNumberRenewal
            ?.filter(
              (x) =>
                x?.code?.toLowerCase() ===
                productData?.lifeCycle?.newPolicy?.policyNumberAssignmentonRenewal?.toLowerCase()
            )
            .map((x) => x?.code)[0] || '',

        renewalReferralSetting,
        preRenewalPeriodDays,
        nonRenewalNotificationDate,
        renewalNoticePeriodDays,
      });
      const renewalNumber =
        this.renewalType
          ?.filter(
            (x) =>
              x?.code?.toLowerCase() ===
              productData?.lifeCycle?.newPolicy?.renewalType?.value?.toLowerCase()
          )
          .map((x) => x?.code)[0] || '';
      const policyNum =
        this.policyNumberRenewal
          ?.filter(
            (x) =>
              x?.code?.toLowerCase() ===
              productData?.lifeCycle?.newPolicy?.policyNumberAssignmentonRenewal?.toLowerCase()
          )
          .map((x) => x?.code)[0] || '';
      const newPolicyData = {
        renewalNumber,
        preRenewalPeriodDays,
        nonRenewalNotificationDate,
        renewalNoticePeriodDays,
        renewalReferralSetting,
      };

      this.onTermChange(newPolicyData);
      this.onRenewalChange(policyNum);
    }
  }
  //#endregion

  isCommissionCodeValid(code: string): boolean {
    return Object.keys(CommissionRoutine).includes(code);
  }

  getCommissionTitle(code: string): string {
    if (code in CommissionRoutine) {
      return CommissionRoutine[code as keyof typeof CommissionRoutine];
    }
    return 'default';
  }

  hasMinEarnedPremiumValue(value: any): value is string {
    return value !== null && value !== undefined && value !== '';
  }

  isCurrentCountryNonUS(): boolean {
    return this._productService.getSelectedCountry() !== CountryCodes.US;
  }

  preRenewalValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const preRenewalPeriod = formGroup.get('preRenewalPeriodDays')?.value;
      const renewalNoticePeriod = formGroup.get(
        'renewalNoticePeriodDays'
      )?.value;

      if (
        preRenewalPeriod !== null &&
        renewalNoticePeriod !== null &&
        preRenewalPeriod < renewalNoticePeriod
      ) {
        return { preRenewalLessThanNotice: true };
      }

      return null;
    };
  }
}
