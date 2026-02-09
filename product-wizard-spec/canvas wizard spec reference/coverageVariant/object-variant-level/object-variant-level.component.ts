import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  CanvasFormComponent,
  LayoutComponent,
  LayoutService,
} from '@canvas/components';
import { messageKey } from '@canvas/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbSelectChoiceModule,
} from '@chubb/ui-components';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isNullOrUndefined } from 'is-what';
import { isEmpty } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SubCoverageLevelService } from '../../../services/sub-coverage-level.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant } from '../../../types/coverage';
import {
  CoverageVariantLevel,
  DeductibleValueTypes,
  InsuredObjectLevel,
  InsuredType,
  PostCoverageVariantLevelRequest,
} from '../../../types/coverage-variant-level';
import { MasterData } from '../../../types/product';
import { Category, MsgIds } from '../../../types/ref-data';
import { SubCoverage } from '../../../types/sub-coverage';
@UntilDestroy()
@Component({
  selector: 'canvas-object-variant-level',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    CbButtonModule,
    ReactiveFormsModule,
    AccordionModule,
    CbInputModule,
    CbIconModule,
    CbSelectChoiceModule,
    CanvasFormComponent,
    inputUnselectPipe,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './object-variant-level.component.html',
  styleUrls: ['./object-variant-level.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ObjectVariantLevelComponent implements OnInit {
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;
  coverageVariants!: CoverageVariant[];
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  variantLevelForm: FormGroup;
  retrieveDataControl: FormControl;
  aggregateType: MasterData[] = [];
  minMaxTypes: MasterData[] = [];
  durationTypes: MasterData[] = [];
  limitScopes: MasterData[] = [];
  waitingPeriodList: MasterData[] = [];
  deductibleTypes: MasterData[] = [];
  valueTypes: MasterData[] = [];
  subCoverageList: SubCoverage[] = [];
  objectTypes: MasterData[] = [];
  coverageVariantLevels: CoverageVariantLevel[];
  retrieveDataOptions: MasterData[] = [];
  selectedObjectTypes: InsuredType[];
  objectParam: string;
  objectTypeToRenderIndex: number;
  objectTypeToRender: InsuredType | undefined;
  formPrefetch: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  coverageVariantName: string;
  MaxValue: number;
  isLimits = false;
  cvLevelId: string;
  rootData: any;
  MaxAmount: number;
  DeductibleValueTypes = DeductibleValueTypes;
  percentValueTypes: MasterData[] = [];
  disableEdit = false;

  get formArray(): FormArray {
    return (<FormGroup>this.variantLevelForm.get('subCoveragesForm'))?.controls[
      'subCoverage'
    ] as FormArray;
  }

  get maxLimitsValue(): string {
    return this.variantLevelForm.get('limitsForm')?.get('maxLimitType')?.value;
  }
  get aggregateMaxLimitsValue(): string {
    return this.variantLevelForm.get('limitsForm')?.get('aggregateLimitType')
      ?.value;
  }
  get minLimitsValue(): string {
    return this.variantLevelForm
      .get('additionalFieldsForm')
      ?.get('minLimitType')?.value;
  }

  get deductiblesValue(): string {
    return this.variantLevelForm.get('deductiblesForm')?.get('valueType')
      ?.value;
  }

  get limitsForm(): FormGroup {
    return this.variantLevelForm.get('limitsForm') as FormGroup;
  }

  get insuredForm(): FormGroup {
    return this.variantLevelForm.get('insuredForm') as FormGroup;
  }

  get additionalFieldsForm(): FormGroup {
    return this.variantLevelForm.get('additionalFieldsForm') as FormGroup;
  }

  get deductiblesForm(): FormGroup {
    return this.variantLevelForm.get('deductiblesForm') as FormGroup;
  }

  constructor(
    private _layoutService: LayoutService,
    private _fb: FormBuilder,
    private _router: Router,
    private _variantLevelService: VariantLevelService,
    private _route: ActivatedRoute,
    private _productContextService: ProductContextService,
    private _productService: ProductsService,
    private _coverageVariantService: CoverageVariantService,
    private _subCoverageLevelService: SubCoverageLevelService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this.coverageVariantId = localStorage?.getItem('coverageVariantId') || '';
    if (
      localStorage.getItem('coverageVariantName') != null ||
      localStorage.getItem('coverageVariantName') != undefined
    ) {
      this.coverageVariantName =
        localStorage.getItem('coverageVariantName') || '';
    }
    this._updateLayout();
  }

  ngOnInit(): void {
    this._route?.paramMap?.subscribe((params: ParamMap) => {
      this.cvLevelId = params.get('cvLevelId') ?? '';
    });
    this._route.queryParams.subscribe((params) => {
      if (params['key']) {
        this.formPrefetch.next(false);
        this.objectParam = params['key'];
        this._fetchPrefillAndReferenceData();
        this._observeAndSetValidators();
      } else {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Object id not found.',
          duration: 5000,
        });
      }
    });
  }

  addSubCoverage(): void {
    this.formArray.push(this._initSubCoverage());
  }

  removeSubCoverage(index: number): void {
    this.formArray.removeAt(index);
  }

  onClear(): void {
    this.variantLevelForm.reset(this._initForm());
  }

  saveAndNext(): void {
    this.saveAndExit(true);
  }

  async saveAndExit(moveToNextStep?: boolean): Promise<void> {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message:
          'Maximum value (aggregate) should not exceed the Cumulative limit value.',
        duration: 5000,
      },
    };
    await this.validateForm();
    this._markAllFieldsDirty(this.variantLevelForm);
    this.variantLevelForm?.updateValueAndValidity();
    if (this.variantLevelForm.invalid || this.disableEdit) {
      if (this.disableEdit) {
        this._navigate(1);
      }
      return;
    } else {
      if (!this._setValidationOnlimit()) {
        this._layoutService.showMessage(toastMessageConfig['error']);
        return;
      } else {
        const shouldPatch =
          !isEmpty(
            (this.coverageVariantLevels?.[0]?.coverageVariantLevelId ?? '') ||
              !isNullOrUndefined(this.cvLevelId)
          ) &&
          this.variantLevelForm.dirty &&
          this.variantLevelForm.touched;
        const patchCoverageVariantLevelId =
          isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
            ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
            : this.cvLevelId;
        if (shouldPatch) {
          this._variantLevelService
            .patchCoverageVariantLevel(
              this.productId,
              this.productVersionId,
              this.coverageVariantId,
              patchCoverageVariantLevelId ?? '',
              this._preparePatchRequestObject(patchCoverageVariantLevelId ?? '')
            )
            .subscribe({
              next: (res) => {
                this._layoutService.showMessage({
                  severity: 'success',
                  message: 'Coverage Variant Level Saved Successfully.',
                  duration: 5000,
                });
                this._productContextService._setProductAggregateLimitType('');
                this._productContextService._setProductAggregateLimitValue(0);
                this._productContextService._setProductAggregateMaxValue(0);
                this._productContextService._setproductAggregatePercentageType(
                  ''
                );
                this._navigate(1);
              },
              error: (e) => {
                if (e.error.errors && e.error.errors['PMERR000337']) {
                  this._layoutService.showMessage({
                    severity: 'error',
                    message: e.error.errors['PMERR000337'],
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
        } else {
          this._variantLevelService
            .upsertCoverageVariantLevel(
              this.productId,
              this.productVersionId,
              this.coverageVariantId,
              this._preparePostRequestObject()
            )
            .subscribe({
              next: () => {
                this._layoutService.showMessage({
                  severity: 'success',
                  message: 'Coverage Variant Level Saved Successfully.',
                  duration: 5000,
                });
                this._productContextService._setProductAggregateLimitType('');
                this._productContextService._setProductAggregateLimitValue(0);
                this._productContextService._setProductAggregateMaxValue(0);
                this._productContextService._setproductAggregatePercentageType(
                  ''
                );
                this._navigate(1);
                if (!moveToNextStep) {
                  this._router.navigate(['products']);
                }
              },
              error: (e) => {
                if (e.error.errors && e.error.errors['PMERR000337']) {
                  this._layoutService.showMessage({
                    severity: 'error',
                    message: e.error.errors['PMERR000337'],
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
    }
  }

  _setValidationOnlimit(): boolean {
    const aggregateamount = this.limitsForm.get('aggregateamountValue')?.value;
    let isvalid = true;
    const filteredData = this.coverageVariantLevels?.filter(
      (x) => x.coverageVariantLevelId === this.cvLevelId
    )[0];

    const cumulativeLimit = filteredData?.aggregateMaxValue
      ? filteredData.aggregateMaxValue
      : this._productContextService._getProductAggregateLimitValue();
    if (this.aggregateMaxLimitsValue?.toLowerCase() === 'amt') {
      this._productContextService._setProductAggregateMaxValue(
        Number(aggregateamount)
      );
      if (
        Number(aggregateamount) > 0 &&
        Number(cumulativeLimit) > 0 &&
        Number(aggregateamount) > Number(cumulativeLimit)
      ) {
        return (isvalid = false);
      } else return (isvalid = true);
    } else {
      const aggregatepercentage = this.limitsForm.get(
        'aggregateMaxPercentOf'
      )?.value;
      this._productContextService._setProductAggregateMaxValue(
        Number(aggregatepercentage)
      );
      if (
        Number(aggregatepercentage) > 0 &&
        Number(cumulativeLimit) > 0 &&
        Number(aggregatepercentage) > Number(cumulativeLimit)
      ) {
        return (isvalid = false);
      } else return (isvalid = true);
    }

    return isvalid;
  }
  _setValidationOnType(): boolean {
    const cumulativeType =
      this._productContextService._getProductAggregateLimitType();
    if (
      cumulativeType != '' &&
      cumulativeType.toLowerCase() !==
        this.aggregateMaxLimitsValue?.toLowerCase()
    ) {
      return false;
    } else return true;
  }

  maximumAmountChange() {
    const aggregateamount = this.aggregateMaxLimitsValue;
    const amountval = this.limitsForm.get('amountValue')?.value;
  }

  previous(): void {
    if (this.coverageVariantLevels.length != this.selectedObjectTypes.length) {
      this._navigate(-1);
    } else {
      if (this.cvLevelId === '') {
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
        ]);
      } else {
        this._navigate(-1);
      }
    }
  }

  private _navigate(stepAdj?: number): void {
    const navObj =
      this.selectedObjectTypes[this.objectTypeToRenderIndex + (stepAdj || 0)];

    if (
      !isEmpty(navObj) &&
      this.cvLevelId !== '' &&
      this.cvLevelId !== undefined
    ) {
      this._router.navigate(
        [
          `products/${
            this.productId
          }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
            this.cvLevelId
          }/edit`,
        ],
        { queryParams: { key: navObj.value } }
      );
    } else if (!isEmpty(navObj)) {
      this._router.navigate(
        [`/products/${this.productId}/coveragevariant/objectVariantLevel`],
        { queryParams: { key: navObj.value } }
      );
    } else if (this.cvLevelId === '') {
      this._router.navigate([
        `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
      ]);
    } else {
      this._router.navigate(
        [
          `products/${
            this.productId
          }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
            this.cvLevelId
          }/edit`,
        ],
        { queryParams: { key: this.objectParam } }
      );
    }
    this.onClear();
  }

  private _preparePatchRequestObject(
    patchCoverageVariantLevelId: string
  ): CoverageVariantLevel {
    const covVariantLevel =
      isNullOrUndefined(patchCoverageVariantLevelId) ||
      isEmpty(patchCoverageVariantLevelId)
        ? this.coverageVariantLevels?.[0]
        : this.coverageVariantLevels.find(
            (level) =>
              level.coverageVariantLevelId == patchCoverageVariantLevelId
          );

    const insuredObjectLevels: InsuredObjectLevel[] = !isNullOrUndefined(
      covVariantLevel
    )
      ? covVariantLevel?.insuredObjectLevel
      : [];

    const insuredLevel = this._prepareInsuredLevel();
    const miDataIndex = insuredObjectLevels?.findIndex(
      (ele) => ele.insuredObjectType.value === this.objectParam
    );
    if (miDataIndex > -1) {
      insuredObjectLevels[miDataIndex] = insuredLevel;
    } else {
      insuredObjectLevels.push(insuredLevel);
    }
    if (this._productContextService._getProductAggregateLimitValue() > 0) {
      this.MaxAmount = Number(
        this._productContextService._getProductAggregateLimitValue()
      );
    } else {
      this.MaxAmount = Number(covVariantLevel?.aggregateMaxValue);
    }
    return {
      coverageVariantLevelId:
        patchCoverageVariantLevelId || crypto.randomUUID(),
      description: this.insuredForm.get('coverageVaraintLevel')?.value,
      insuredObjectLevel: insuredObjectLevels,
      ruleSet: [],
      insuredLevel: [],
      requestId: crypto.randomUUID(),
      aggregateLimitType: covVariantLevel?.aggregateLimitType
        ? covVariantLevel?.aggregateLimitType
        : this._productContextService._getProductAggregateLimitType() ?? '',
      aggregateMaxValue: this.MaxAmount,
      aggregateCoverageVariantPercentage:
        covVariantLevel?.aggregateCoverageVariantPercentage
          ? covVariantLevel?.aggregateCoverageVariantPercentage
          : this._productContextService._getproductAggregatePercentageType() ??
            '',
      isCurrentVersion: covVariantLevel?.isCurrentVersion ?? true,
      insuredEventLevel: []
    };
  }

  private _preparePostRequestObject(): PostCoverageVariantLevelRequest {
    const insuredLevels: InsuredObjectLevel[] = [];
    insuredLevels.push(this._prepareInsuredLevel());

    return {
      requestId: '1',
      coverageVariantLevels: [
        {
          coverageVariantLevelId:
            this.coverageVariantLevels?.[0]?.coverageVariantLevelId ||
            crypto.randomUUID(),
          description: this.insuredForm.get('coverageVaraintLevel')?.value,
          insuredObjectLevel: insuredLevels,
          ruleSet: [],
          insuredLevel: [],
          requestId: crypto.randomUUID(),
          aggregateLimitType:
            this._productContextService._getProductAggregateLimitType() ?? '',
          aggregateMaxValue:
            Number(
              this._productContextService._getProductAggregateLimitValue()
            ) ?? 0,
          aggregateCoverageVariantPercentage:
            this._productContextService._getproductAggregatePercentageType() ??
            '',
          isCurrentVersion: true,
          insuredEventLevel: []
        },
      ],
    };
  }

  private _prepareInsuredLevel(): InsuredObjectLevel {
    if (this.aggregateMaxLimitsValue?.toLowerCase() === 'percentage') {
      this.MaxValue = Number(
        this.limitsForm.get('aggregateMaxPercentOf')?.value
      );
    } else {
      this.MaxValue = Number(
        this.limitsForm.get('aggregateamountValue')?.value
      );
    }
    return {
      insuredObjectLevelId: crypto.randomUUID(),
      insuredObjectType: this.selectedObjectTypes
        .filter((ele) => ele.value === this.objectParam)
        ?.map((ele: messageKey) => {
          return {
            key: ele.key,
            value: this.objectParam,
            category: Category.INSUREDOBJECT,
          };
        })[0],
      limit: {
        limitId: crypto.randomUUID(),
        minType: this.minLimitsValue ?? '',
        minAmount:
          Number(this.additionalFieldsForm?.get('amountValue')?.value) ?? 0,
        maxType: this.maxLimitsValue,
        maxAmount: Number(this.limitsForm.get('amountValue')?.value) ?? 0,
        scope: this.additionalFieldsForm?.get('limitScope')?.value ?? '',
        scopeValue: this.additionalFieldsForm?.get('scopeValue')?.value ?? '',
        waitingPeriod:
          this.additionalFieldsForm?.get('waitingPeriod')?.value ?? '',
        duration: this.additionalFieldsForm?.get('durationValue')?.value ?? '',
        durationType:
          this.additionalFieldsForm?.get('durationType')?.value ?? '',
        basecoverLevelId: '',
        options: [],
        aggregateLimitType: this.aggregateMaxLimitsValue ?? '',
        aggregateMaxValue: Number(this.MaxValue) ?? 0,
        aggregateCoverageVariantPercentage:
          this.limitsForm.get('aggregratePercentOf')?.value ?? '',
      },
      deductible: {
        id: crypto.randomUUID(),
        type: this.deductiblesValue ?? '',
        amount: Number(this.deductiblesForm.get('amountValue')?.value) ?? 0,
        deductibleType: this.deductiblesForm.get('deductibleType')?.value ?? '',
        baseCoverLevelId: '',
        options: [],
        percentageType: this.deductiblesForm.get('percentOf')?.value ?? '',
      },
      duration: {
        durationId: crypto.randomUUID(),
        type: this.additionalFieldsForm.get('durationType')?.value ?? '',
        quantity: this.additionalFieldsForm.get('durationValue')?.value ?? '',
      },
    };
  }

  private _markAllFieldsDirty(form: AbstractControl): void {
    form?.markAsDirty();
    if (form instanceof FormGroup && form.controls) {
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        control?.markAsDirty();
        control?.markAsTouched();
        this._markAllFieldsDirty(control as FormGroup);
      });
    }
    if (form instanceof FormArray) {
      for (let i = 0; i < form.length; i++) {
        Object.keys((form.controls[i] as FormGroup).controls).forEach((key) => {
          const control = form.controls[i].get(key);
          control?.markAsDirty();
          control?.markAsTouched();
        });
      }
    }
  }

 _observeAndSetValidators(): void {
    this.retrieveDataControl?.valueChanges.subscribe((val) => {
      if (!isEmpty(this.retrieveDataOptions)) {
        this._prefillForm(
          this.retrieveDataOptions.find((ele) => ele.code === val.code)
        );
      }
      this.variantLevelForm.markAsDirty();
      this.variantLevelForm.markAsTouched();
    });
    this.variantLevelForm
      .get('limitsForm')
      ?.get('maxLimitType')
      ?.valueChanges.subscribe((val: string) => {
        if (val && val.toLowerCase() === 'amount') {
          this.variantLevelForm
            .get('limitsForm')
            ?.get('amountValue')
            ?.setValidators(Validators.required);
          this.variantLevelForm
            .get('limitsForm')
            ?.get('percentOf')
            ?.clearValidators();
        } else {
          this.variantLevelForm
            .get('limitsForm')
            ?.get('percentOf')
            ?.setValidators(Validators.required);
          this.variantLevelForm
            .get('limitsForm')
            ?.get('amountValue')
            ?.clearValidators();
        }
      });
    this.variantLevelForm
      .get('limitsForm')
      ?.get('aggregateLimitType')
      ?.valueChanges.subscribe((val: string) => {
        if (val && val.toLowerCase() === 'amount') {
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateamountValue')
            ?.setValidators(Validators.required);
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregatePercentOf')
            ?.clearValidators();
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateMaxPercentOf')
            ?.patchValue('');
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateMaxPercentOf')
            ?.clearValidators();
        } else {
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregatePercentOf')
            ?.setValidators(Validators.required);
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateamountValue')
            ?.clearValidators();
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateMaxPercentOf')
            ?.setValidators(Validators.required);
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateamountValue')
            ?.patchValue('');
          this.variantLevelForm
            .get('limitsForm')
            ?.get('aggregateMaxPercentOf')
            ?.patchValue('0');
        }
      });

    this.deductiblesForm
      ?.get('valueType')
      ?.valueChanges.subscribe((val: string) => {
        if (val?.toUpperCase() === DeductibleValueTypes.PERCENTAGE) {
          this.deductiblesForm
            ?.get('percentOf')
            ?.setValidators(Validators.required);
        } else {
          this.deductiblesForm?.get('percentOf')?.clearValidators();
          this.deductiblesForm?.get('percentOf')?.reset();
          this.deductiblesForm?.get('percentOf')?.updateValueAndValidity();
        }
      });
  }

  private _fetchPrefillAndReferenceData(): void {
    combineLatest([
      this._productService.getMinMaxLimitTypes(),
      this._productService.getDurationTypes(),
      this._productService.getLimitScopes(),
      this._productService.getWaitingPeriodList(),
      this._productService.getDeductibleTypes(),
      this._variantLevelService.getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._variantLevelService.getCoverageVaraintLevels(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._coverageVariantService.getCoverageVariants(
        this.productId,
        this.productVersionId
      ),
      this._productService.getPercentageValueTypes(MsgIds.WATCH),
    ]).subscribe({
      next: (response) => {
        this.aggregateType = this.minMaxTypes = response[0];
        this.durationTypes = response[1];
        this.limitScopes = response[2];
        this.waitingPeriodList = response[3];
        this.deductibleTypes = response[4];
        this.rootData = response[5];
        this.subCoverageList = response[5].subCoverages;
        this.percentValueTypes = response[8];
        this.selectedObjectTypes =
          response[5].insuredObjects?.map((obj) => obj.type) || [];
        this.objectTypeToRenderIndex = this.selectedObjectTypes.findIndex(
          (obj) => obj.value === this.objectParam
        );
        if (
          isEmpty(this.selectedObjectTypes) ||
          this.objectTypeToRenderIndex <= -1
        ) {
          this._layoutService.showMessage({
            severity: 'error',
            message: 'No Insured Objects for this product.',
            duration: 5000,
          });
        }
        this.objectTypeToRender =
          this.selectedObjectTypes[this.objectTypeToRenderIndex];
        this.coverageVariantLevels = response[6];
        this.coverageVariants = response[7];
        this.coverageVariants = this.coverageVariants.filter(
          (coverageid) => coverageid.coverageVariantId != this.coverageVariantId
        );
        const isCurrentVersion =
          this.coverageVariantLevels?.filter(
            (item) => item.coverageVariantLevelId === this.cvLevelId
          )?.[0]?.isCurrentVersion ?? true;
        this.disableEdit =
          this._productContextService.isProductDisabled() || !isCurrentVersion;
        this._initForm();
        this._prepareForPrefill();
        this.formPrefetch.next(true);
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

  private _prepareForPrefill(): void {
    this.retrieveDataOptions =
      !!this.coverageVariantLevels &&
      this.coverageVariantLevels[0]?.insuredObjectLevel?.map((ele) => {
        return {
          code: ele.insuredObjectType?.value,
          description: ele.insuredObjectType?.value,
        };
      });
    const insuredObjectAvailable =
      !!this.retrieveDataOptions &&
      this.retrieveDataOptions.find((ele) => ele['code'] === this.objectParam);
    if (!isEmpty(insuredObjectAvailable)) {
      this.retrieveDataControl.patchValue(insuredObjectAvailable);
      this._prefillForm(insuredObjectAvailable);
    }
  }

  private _prefillForm(selectedOption: MasterData | undefined) {
    const coverageVariantLevelId =
      isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
        ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
        : this.cvLevelId;
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? this.coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : this.coverageVariantLevels[0];

    const filteredVariantLevelData =
      coverageVariantLevel?.insuredObjectLevel?.find(
        (ele) => ele.insuredObjectType.value === selectedOption?.code
      );
    if (
      filteredVariantLevelData?.limit?.aggregateLimitType?.toLowerCase() ===
      'percentage'
    ) {
      this.isLimits = true;
    } else {
      this.isLimits = false;
    }
    if (!isEmpty(coverageVariantLevel?.description)) {
      this.insuredForm.patchValue({
        coverageVaraintLevel: coverageVariantLevel?.description,
      });
    }
    this.variantLevelForm.patchValue({
      limitsForm: {
        maxLimitType: filteredVariantLevelData?.limit.maxType ?? '',
        amountValue: filteredVariantLevelData?.limit.maxAmount ?? '',
        percentOf: filteredVariantLevelData?.limit.maxAmount ?? '',
        aggregateLimitType:
          filteredVariantLevelData?.limit.aggregateLimitType ?? '',
        aggregateamountValue:
          filteredVariantLevelData?.limit.aggregateMaxValue ?? '',
        aggregratePercentOf:
          filteredVariantLevelData?.limit.aggregateCoverageVariantPercentage ??
          '',
        aggregateMaxPercentOf:
          filteredVariantLevelData?.limit.aggregateMaxValue ?? '',
      },
      additionalFieldsForm: {
        minLimitType: filteredVariantLevelData?.limit.minType ?? '',
        amountValue: filteredVariantLevelData?.limit.minAmount ?? '',
        percentOf: filteredVariantLevelData?.limit.minAmount ?? '',
        durationType: filteredVariantLevelData?.duration.type ?? '',
        durationValue: filteredVariantLevelData?.duration.quantity ?? '',
        limitScope: filteredVariantLevelData?.limit.scope ?? '',
        scopeValue: filteredVariantLevelData?.limit.scopeValue ?? '',
      },
      deductiblesForm: {
        deductibleType:
          filteredVariantLevelData?.deductible.deductibleType ?? '',
        valueType: filteredVariantLevelData?.deductible.type ?? '',
        amountValue: filteredVariantLevelData?.deductible.amount ?? '',
        percentOf: filteredVariantLevelData?.deductible.percentageType ?? '',
      },
    });
  }

  onSelectionChange() {
    const selectedVal = this.limitsForm?.get('aggregateLimitType')?.value;
    if (selectedVal.toLowerCase() === 'percentage') {
      this.isLimits = true;
    } else {
      this.isLimits = false;
    }
    this._observeAndSetValidators();
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

  private _initForm(): void {
    this.retrieveDataControl = this._fb.control(
      { value: '', disabled: this.disableEdit ? true : false },
      []
    );
    this.variantLevelForm = this._fb.group({
      insuredForm: this._fb.group({
        coverageVaraintLevel: this._fb.control(
          { value: 'Coverage level 1', disabled: true },
          [Validators.maxLength(50)]
        ),
      }),
      limitsForm: this._fb.group({
        maxLimitType: this._fb.control(
          { value: '', disabled: this.disableEdit },
          [Validators.required]
        ),
        amountValue: this._fb.control(
          { value: '', disabled: this.disableEdit },
          [Validators.required]
        ),
        percentOf: this._fb.control(
          { value: '', disabled: this.disableEdit },
          []
        ),
        aggregateLimitType: this._fb.control(
          { value: '', disabled: this.disableEdit },
          []
        ),
        aggregateamountValue: this._fb.control(
          { value: '', disabled: this.disableEdit },
          []
        ),
        aggregratePercentOf: this._fb.control(
          { value: '', disabled: this.disableEdit },
          []
        ),
        aggregateMaxPercentOf: this._fb.control(
          { value: '', disabled: this.disableEdit },
          []
        ),
      }),
      additionalFieldsForm: this._initAdditionalFields(),
      deductiblesForm: this._initDeductibles(),
      subCoveragesForm: this._fb.group({
        subCoverage: this._fb.array([]),
      }),
    });
  }

  private _initDeductibles(): FormGroup {
    return this._fb.group({
      deductibleType: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      valueType: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      amountValue: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      percentOf: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
    });
  }

  private _initAdditionalFields(): FormGroup {
    return this._fb.group({
      minLimitType: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      amountValue: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      percentOf: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      durationType: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      durationValue: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      limitScope: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      scopeValue: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      waitingPeriod: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      waitingPeriodValue: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
    });
  }

  private _initSubCoverage(): FormGroup {
    return this._fb.group({
      selectSubCoverage: this._fb.control(
        { value: '', disabled: this.disableEdit },
        []
      ),
      additionalFieldsForm: this._initAdditionalFields(),
      deductiblesForm: this._initDeductibles(),
    });
  }
  /**
   * Form validations
   */
  validateForm() {
    this._subCoverageLevelService.validateForm(this.variantLevelForm);
  }
}
