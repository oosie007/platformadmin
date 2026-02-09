import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  TemplateRef,
  ViewChild,
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
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import {
  CanvasFormComponent,
  FieldConfig,
  LayoutComponent,
  LayoutService,
  ReactiveFieldConfig,
  ReactiveFormComponent,
  TableComponent,
} from '@canvas/components';
import { ColumnOptions, TableOptions } from '@canvas/components/types';
import { AppContextService, TableService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbModalModule,
  CbSelectChoiceModule,
} from '@chubb/ui-components';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isNullOrUndefined } from 'is-what';
import * as _ from 'lodash';
import { cloneDeep, isEmpty } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { combineLatest, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { SubCoverageLevelService } from '../../../services/sub-coverage-level.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant, CvlPermutations } from '../../../types/coverage';
import {
  AdditionalInfoModal,
  CoverageFactorCombinations,
  CoverageFactorMapping,
  CoverageFactorTableRow,
  CoverageVariantLevel,
  Deductible,
  DeductibleValueTypes,
  DependentTypeKeys,
  Duration,
  FactorSet,
  InsuredFormModel,
  InsuredLevel,
  InsuredType,
  Limit,
  limitsFormModel,
  PostCoverageVariantLevelRequest,
} from '../../../types/coverage-variant-level';
import { MasterData } from '../../../types/product';
import { MsgIds } from '../../../types/ref-data';
import { SubCoverage } from '../../../types/sub-coverage';
import {
  MiVariantLevelLabels,
  PopUpModalConfig,
} from '../mi-variant-level/model/mi-variant-level.model';

enum ButtonAction {
  DISCARD_AND_EXIT = 'discardAndExit',
  OPEN_CREATE_MODAL = 'openCreateModal',
  OPEN_EDIT_MODAL = 'openEditModal',
  DISCARD_EDIT_CHANGES = 'discardEditChanges',
  CLEAR_All = 'clearAll',
  CLOSE_MODAL = 'closeModal',
  CANCEL_MODAL = 'cancel',
  SAVE_CHANGES = 'saveChanges',
}

@UntilDestroy()
@Component({
  selector: 'canvas-adult-variant-level',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormComponent,
    TableComponent,
    FieldConfig,
    FormsModule,
    LayoutComponent,
    CbButtonModule,
    ReactiveFormsModule,
    AccordionModule,
    CbInputModule,
    CbIconModule,
    CbSelectChoiceModule,
    CanvasFormComponent,
    CbModalModule,
    inputUnselectPipe,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './adult-variant-level.component.html',
  styleUrls: ['./adult-variant-level.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdultVariantLevelComponent implements OnInit {
  limitsFormConfigFields: ReactiveFieldConfig[];
  limitsFormModel: limitsFormModel;
  @ViewChild('limitsFormConfig')
  limitsFormConfig!: ReactiveFormComponent;
  @ViewChild('limitsFormConfigRef')
  limitsFormConfigRef!: TemplateRef<unknown>;
  emptylimitsFormModel: limitsFormModel = {
    aggregateLimitType: '',
    aggregateamountValue: 0,
    aggregratePercentOf: '',
  };
  modalConfig!: PopUpModalConfig;
  @ViewChild('additionalInfoForm')
  additionalInfoForm!: ReactiveFormComponent;
  @ViewChild('additionalInfoFormRef')
  additionalInfoFormRef!: TemplateRef<unknown>;
  minMaxValidator: ValidatorFn = (control: AbstractControl) => {
    const formGroup = control as FormGroup;
    const min = Number(formGroup.get('minAmount')?.value);
    const max = Number(formGroup.get('maxAmount')?.value);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      return { minGreaterThanMax: true };
    }
    return null;
  };
  additionalInfoFormFields: ReactiveFieldConfig[];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;
  coverageVariants!: CoverageVariant[];
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  variantLevelForm: FormGroup;
  retrieveDataControl: FormControl;
  newRetrieveDataControl: FormControl;
  insuredFormConfigFields: ReactiveFieldConfig[];
  insuredFormModel = {} as InsuredFormModel;
  minMaxTypes: MasterData[] = [];
  durationTypes: MasterData[] = [];
  limitScopes: MasterData[] = [];
  waitingPeriodList: MasterData[] = [];
  deductibleTypes: MasterData[] = [];
  valueTypes: MasterData[] = [];
  subCoverageList: SubCoverage[] = [];
  insuredTypes: MasterData[] = [];
  aggregateType: MasterData[] = [];
  coverageVariantLevels: CoverageVariantLevel[];
  retrieveDataOptions: MasterData[];
  selectedInsuredTypes: InsuredType[] = [];
  currentInsuredTypeIndex: number;
  activeInsuredType: InsuredType;
  deductibleValueTypes: MasterData[] = [];
  isRetrieveDataActivated = false;
  openModal: boolean;
  selectedSubCoverageIndex: number | null;
  cvLevelId!: string;
  rootData: any;
  coverageVariantName: string;
  DeductibleValueTypes = DeductibleValueTypes;
  percentValueTypes: MasterData[] = [];
  disableEdit = false;
  isLimits = false;
  MaxValue: number;
  MaxAmount: number;
  aggregateMaxPercentage: string;
  labels: MiVariantLevelLabels;
  protected options: TableOptions;
  sidebarVisible: boolean;
  additionalInfo: CoverageFactorTableRow;
  selectedRow: CoverageFactorTableRow | null = null;
  disable: boolean = false;
  coverageFactorCombinationData: CvlPermutations[][] = [];
  tableData: CoverageFactorTableRow[];
  showAddInfoAccordinContainer: boolean = false;
  emptyAdditionalInfo: AdditionalInfoModal = {
    limitId: '',
    minAmount: 0,
    maxAmount: 0,
    limitScope: '',
    limitValue: '',
    durationValue: '',
    deductibleId: '',
    valueType: '',
    amountValue: 0,
    durationId: '',
    type: '',
    quantity: '',
  };
  editDrawerModel: AdditionalInfoModal;
  emptyInsuredFormModel: InsuredFormModel = {
    coverageVaraintLevel: '',
  };
  get formArray(): FormArray {
    return this.variantLevelForm.get(
      'subCoveragesForm.subCoverage'
    ) as FormArray;
  }

  get maxLimitsValue(): string {
    return this.variantLevelForm.get('limitsForm')?.get('maxLimitType')?.value;
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

  get aggregateMaxLimitsValue(): string {
    return this.variantLevelForm.get('limitsForm')?.get('aggregateLimitType')
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
  additionalConfigColumns: ColumnOptions[];
  constructor(
    private _layoutService: LayoutService,
    private _fb: FormBuilder,
    private _router: Router,
    private _variantLevelService: VariantLevelService,
    private _productService: ProductsService,
    private _subCoverageLevelService: SubCoverageLevelService,
    private _productContextService: ProductContextService,
    private _route: ActivatedRoute,
    private _coverageVariantService: CoverageVariantService,
    private readonly _commands: StudioCommands,
    private readonly _tableService: TableService,
    private readonly _appContext: AppContextService,
    private _sharedService: SharedService
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

    this.additionalConfigColumns = <ColumnOptions[]>(
      this._appContext.get('pages.product.mi-variant.additionalConfigColumns')
    );

    this.disable = this._productContextService.isProductDisabled();
    this.insuredFormConfigFields = this._appContext.get(
      'pages.product.mi-variant.insuredFormConfig'
    ) as ReactiveFieldConfig[];
    this.limitsFormConfigFields = this._appContext.get(
      'pages.product.mi-variant.limitsFormConfig'
    ) as ReactiveFieldConfig[];
    this.additionalInfoFormFields = this._appContext.get(
      'pages.product.mi-variant.additionalInfoFormFields'
    ) as ReactiveFieldConfig[];

    this.labels = this._appContext.get(
      'pages.product.mi-variant.labels'
    ) as MiVariantLevelLabels;

    this._commands.add('EditAdditionalInfo', {
      commandName: 'EditAdditionalInfo',
      canExecute: () => true,
      execute: (data: { item: CoverageFactorTableRow }) => {
        this.sidebarVisible = true;
        this.additionalInfo = data.item;

        // Get permutations for the item
        const selectedPermutations = this.getSelectedPermutations(
          this.additionalInfo
        );

        // Use the refactored method to get the updated coverage factor combination
        const coverageFactorCombination =
          this.getUpdatedCoverageFactorCombination(selectedPermutations);
        this.editDrawerModel = this.emptyAdditionalInfo;

        if (coverageFactorCombination) {
          // Handle percentage field logic
          const isPercentage =
            coverageFactorCombination.deductible.type === 'PERCENTAGE';
          const hasPercentageField = this.additionalInfoFormFields.some(
            (f) => f.control === 'percentage'
          );
          const idx = this.additionalInfoFormFields.findIndex(
            (f) => f.control === 'valueType'
          );

          if (isPercentage && !hasPercentageField && idx !== -1) {
            this.additionalInfoFormFields.splice(idx + 1, 0, {
              control: 'percentage',
              label: 'Percentage',
              type: 'dropdown',
              emitOnBlur: true,
              placeholder: 'Select the percentage',
              options: [],
              required: false,
              disabled: false,
              class: 'form-width-first-half addInfo__durType-field',
            });
            this.additionalInfoFormFields = [...this.additionalInfoFormFields];
            this._sharedService._bindDomainData(
              this.additionalInfoFormFields,
              this.percentValueTypes,
              'percentage',
              'code',
              'description'
            );
          } else if (!isPercentage && hasPercentageField) {
            this.additionalInfoFormFields =
              this.additionalInfoFormFields.filter(
                (f) => f.control !== 'percentage'
              );
          }

          this.prepareDrawerModel(coverageFactorCombination);
        }

        setTimeout(() => this.setMinMaxValidator(), 0);

        this.modalConfig = {
          title: this.labels.addInfoModalTitle,
          description: '',
          secondaryBtnLabel: this.labels.secondaryBtnLabelOfAddInfoModal,
          primaryBtnLabel: this.labels.primaryBtnLabelOfAddInfoModal,
          tertiaryBtnLabel: this.labels.tertiaryBtnLabelOfAddInfoModal,
          primaryAction: ButtonAction.SAVE_CHANGES,
          secondaryAction: ButtonAction.CLEAR_All,
          tertiaryAction: ButtonAction.CANCEL_MODAL,
          contentPlaceholder: this.additionalInfoFormRef,
          primaryBtnVariant: 'primary',
          primaryButtonDisableFn: () =>
            !this.additionalInfoForm?.formGroup?.valid,
        };

        return Promise.resolve(true);
      },
    });

    this._updateLayout();
    this._generateOptions();
  }

  ngOnInit(): void {
    this._route?.paramMap?.subscribe((params: ParamMap) => {
      this.cvLevelId = params.get('cvLevelId') ?? '';
    });
    this._fetchPrefillData();
    this._fetchReferenceData();
    this._initForm();
    this._observeAndSetValidators();
  }

  private _generateOptions() {
    const statusVal = this._productContextService.isProductDisabled() ?? false;
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [10, 15, 20, 25],
      columns: statusVal
        ? this.additionalConfigColumns.map((col) => {
            if (col.fieldName === '') {
              col.actions = col.actions?.map((act) => {
                act = {
                  ...act,
                  disabled: act.label === 'Clone' || act.label === 'Delete',
                  label: act.label === 'Edit' ? 'View' : act.label,
                  icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon,
                };
                return act;
              });
            }
            return col;
          })
        : this.additionalConfigColumns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
  }

  addSubCoverage(): void {
    this.formArray.push(this._subCoverageLevelService.initSubCoverage());
    this.updateSubCoverageList();
  }

  cloneSubCoverage(index: number, item: any): void {
    const newIndex = index + 1;
    const currentSubCoverage =
      this.formArray.controls[index]?.get('selectSubCoverage')?.value;
    const data = _.cloneDeep(item);
    this.formArray.controls.splice(newIndex, 0, data);
    this.formArray.controls[newIndex]?.get('selectSubCoverage')?.setValue('');
    this.formArray.controls[newIndex]?.get('subCoverageLevelId')?.setValue('');
    this.formArray.controls[index]
      ?.get('selectSubCoverage')
      ?.setValue(currentSubCoverage);
    this.updateSubCoverageList();
  }

  onClear(): void {
    this.variantLevelForm.reset(this._initForm());
  }

  saveAndNext(): void {
    this.saveAndExit(true);
  }

  async saveAndExit(moveToNextStep?: boolean): Promise<void> {
    if (this.showAddInfoAccordinContainer) {
      await this.validateForm();
      this.variantLevelForm?.markAllAsTouched();
      this.variantLevelForm?.updateValueAndValidity();
      if (this.variantLevelForm?.invalid || this.disableEdit) {
        if (this.disableEdit) {
          this.moveToNextStep(true);
        }
        return;
      }
    }
    if (this.disableEdit) {
      this.moveToNextStep(true);
      return;
    }

    if (isEmpty(this.tableData)) {
      let newCoverageVariantLevels: any[] = [];

      try {
        const shouldPatch = !isEmpty(
          this.coverageVariantLevels?.[0]?.coverageVariantLevelId ||
            !isNullOrUndefined(this.cvLevelId)
        );
        const patchCoverageVariantLevelId =
          isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
            ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
            : this.cvLevelId;

        let apiCall: Observable<any>;
        if (shouldPatch) {
          apiCall = this._variantLevelService.patchCoverageVariantLevel(
            this.productId,
            this.productVersionId,
            this.coverageVariantId,
            patchCoverageVariantLevelId ?? '',
            this._preparePatchRequestObject(patchCoverageVariantLevelId ?? '')
          );
        } else {
          apiCall = this._variantLevelService.upsertCoverageVariantLevel(
            this.productId,
            this.productVersionId,
            this.coverageVariantId,
            this._preparePostRequestObject()
          );
        }

        apiCall.subscribe({
          next: (res) => {
            this._layoutService.showMessage({
              severity: 'success',
              message: 'Coverage Variant Level Saved Successfully.',
              duration: 5000,
            });
            const editedForm = this.isRetrieveDataActivated
              ? this.formArray.controls
              : this.formArray.controls.filter(
                  (item: any) => item?.pristine === false
                );
            if (editedForm?.length > 0) {
              this._variantLevelService
                .getCoverageVaraintLevels(
                  this.productId,
                  this.productVersionId,
                  this.coverageVariantId
                )
                .subscribe({
                  next: (res: any) => {
                    const cvLevelId =
                      patchCoverageVariantLevelId != null &&
                      patchCoverageVariantLevelId?.length > 0
                        ? patchCoverageVariantLevelId
                        : res[0].coverageVariantLevelId;
                    const subCoverageLevelRequestBody =
                      this._subCoverageLevelService.prepareSubCoverageLevel(
                        this.formArray.controls,
                        this.activeInsuredType,
                        this.isRetrieveDataActivated,
                        cvLevelId
                      );
                    if (!isNullOrUndefined(res) && res?.length > 0) {
                      newCoverageVariantLevels = res;
                      this.submitSubCoverages(
                        moveToNextStep ?? false,
                        newCoverageVariantLevels,
                        this.rootData,
                        subCoverageLevelRequestBody,
                        this.activeInsuredType,
                        cvLevelId
                      );
                    } else {
                      this.errorMessage(
                        'Unable to save data. Please try again later.'
                      );
                    }
                  },
                  error: (error: any) => {
                    this.errorMessage(
                      'Unable to save data. Please try again later.'
                    );
                  },
                });
            } else {
              this.moveToNextStep(moveToNextStep ?? false);
            }
          },
          error: (error) => {
            this.errorMessage('Unable to save data. Please try again later.');
          },
        });
      } catch (error) {
        this.errorMessage('Unable to save data. Please try again later.');
        this.moveToNextStep(true);
      }

      this.rootData.coverageVariantLevels = newCoverageVariantLevels;
    } else {
      this.saveAdditionalConfig(moveToNextStep ?? false);
    }
  }

  errorMessage(message: string) {
    this._layoutService.showMessage({
      severity: 'error',
      message: message,
      duration: 5000,
    });
  }

  async submitSubCoverages(
    moveToNextStep: boolean,
    coverageVariantLevels: CoverageVariantLevel[],
    rootData: any,
    subCoverageLevelRequestBody: SubCoverage[],
    activeInsuredType: InsuredType,
    cvLevelId: string
  ) {
    const updatedSubCoverages =
      await this._subCoverageLevelService.updateSubCoverageList(
        rootData,
        subCoverageLevelRequestBody,
        activeInsuredType,
        cvLevelId
      );
    const finalRequest = this.rootData;
    finalRequest.coverageVariantLevels = coverageVariantLevels;
    finalRequest.subCoverages = updatedSubCoverages;
    this._variantLevelService
      .patchSubCoverageVariantLevel2(
        this.productId,
        this.productVersionId,
        this.coverageVariantId,
        finalRequest
      )
      .subscribe({
        next: (res) => {
          this._layoutService.showMessage({
            severity: 'success',
            message: 'Sub Coverage Variant Level Saved Successfully.',
            duration: 5000,
          });
          this.moveToNextStep(moveToNextStep);
        },
        error: (error) => {
          this._layoutService.showMessage({
            severity: 'error',
            message:
              'Unable to save Sub Coverage Variant Level data. Please try again later.',
            duration: 5000,
          });
          console.log(error);
          this.moveToNextStep(moveToNextStep);
        },
      });
  }

  moveToNextStep(moveToNextStep: boolean) {
    if (moveToNextStep) {
      this._navigateIndividualVariantLevels(1);
    } else {
      this._router.navigate(['products']);
    }
  }

  previous(): void {
    this._navigateIndividualVariantLevels(-1);
  }

  _navigateIndividualVariantLevels(stepAdj?: number): void {
    const navObj =
      this.selectedInsuredTypes[this.currentInsuredTypeIndex + (stepAdj || 0)];
    this._variantLevelService.selectVariant(
      navObj?.value,
      this.productId,
      this.cvLevelId,
      this.coverageVariantId
    );
  }

  _preparePatchRequestObject(
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

    const insuredLevels: InsuredLevel[] = !isNullOrUndefined(covVariantLevel)
      ? covVariantLevel?.insuredLevel
      : [];

    const insuredLevel = this._prepareInsuredLevel();
    const adultDataIndex = insuredLevels.findIndex(
      (ele) => ele.insuredType?.value === DependentTypeKeys.ADULT
    );
    if (adultDataIndex > -1) {
      insuredLevels[adultDataIndex] = insuredLevel;
    } else {
      insuredLevels.push(insuredLevel);
    }
    if (this._productContextService._getProductAggregateLimitValue() > 0) {
      this.MaxAmount = Number(
        this._productContextService._getProductAggregateLimitValue()
      );
    } else {
      this.MaxAmount = Number(covVariantLevel?.aggregateMaxValue);
    }
    return {
      coverageVariantLevelId: patchCoverageVariantLevelId || uuidv4(),
      description: this.insuredForm.get('coverageVaraintLevel')?.value,
      insuredLevel: insuredLevels,
      ruleSet: [],
      insuredObjectLevel: [],
      multipleFactor: this.coverageVariantLevels.find(
        (level) => level.coverageVariantLevelId == patchCoverageVariantLevelId
      )?.multipleFactor,
      requestId: uuidv4(),
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
      insuredEventLevel: [],
    };
  }

  _preparePostRequestObject(): PostCoverageVariantLevelRequest {
    const insuredLevels: InsuredLevel[] = [];
    insuredLevels.push(this._prepareInsuredLevel());
    return {
      requestId: '1',
      coverageVariantLevels: [
        {
          coverageVariantLevelId:
            this.coverageVariantLevels?.[0]?.coverageVariantLevelId || uuidv4(),
          description: this.insuredForm.get('coverageVaraintLevel')?.value,
          insuredLevel: insuredLevels,
          ruleSet: [],
          insuredObjectLevel: [],
          requestId: uuidv4(),
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
          insuredEventLevel: [],
        },
      ],
    };
  }

  _prepareInsuredLevel(): InsuredLevel {
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
      insuredLevelId: uuidv4(),
      insuredType: this.activeInsuredType,
      limit: {
        limitId: uuidv4(),
        minType: this.minLimitsValue ?? '',
        minAmount:
          Number(this.additionalFieldsForm?.get('amountValue')?.value) ?? 0,
        maxType: this.maxLimitsValue,
        maxAmount: Number(this.limitsForm.get('amountValue')?.value) ?? 0,
        scope: this.additionalFieldsForm?.get('limitScope')?.value ?? '',
        scopeValue: this.additionalFieldsForm?.get('scopeValue')?.value ?? '',
        duration: this.additionalFieldsForm.get('durationValue')?.value ?? '',
        durationType:
          this.additionalFieldsForm?.get('durationType')?.value ?? '',
        waitingPeriod:
          this.additionalFieldsForm?.get('waitingPeriod')?.value ?? '',
        waitingPeriodValue:
          this.additionalFieldsForm?.get('waitingPeriodValue')?.value ?? '',
        basecoverLevelId: '',
        options: [],
        aggregateLimitType: this.aggregateMaxLimitsValue ?? '',
        aggregateMaxValue: Number(this.MaxValue) ?? 0,
        aggregateCoverageVariantPercentage:
          this.limitsForm.get('aggregratePercentOf')?.value ?? '',
      },
      deductible: {
        id: uuidv4(),
        deductibleType: this.deductiblesForm.get('deductibleType')?.value ?? '',
        type: this.deductiblesForm.get('valueType')?.value ?? '',
        amount: Number(this.deductiblesForm.get('amountValue')?.value) ?? 0,
        baseCoverLevelId: '',
        options: [],
        percentageType: this.deductiblesForm.get('percentOf')?.value ?? '',
      },
      duration: {
        durationId: uuidv4(),
        type: this.additionalFieldsForm.get('durationType')?.value ?? '',
        quantity: this.additionalFieldsForm.get('durationValue')?.value ?? '',
      },
    };
  }

  _observeAndSetValidators(): void {
    this.retrieveDataControl.valueChanges.subscribe((val) => {
      if (!isEmpty(this.retrieveDataOptions)) {
        this._prefillForm(
          this.retrieveDataOptions.find((ele) => ele.code === val.code)
        );
      }
      this.isRetrieveDataActivated = this.retrieveDataControl?.pristine
        ? false
        : true;
    });
    this.newRetrieveDataControl.valueChanges.subscribe((val) => {
      if (!isEmpty(this.retrieveDataOptions)) {
        const selectedOption = this.retrieveDataOptions.find(
          (ele) => ele.code === val.code
        );
        this._fillLimitsFormModal();
        this.tableData = this.transformApiResponse(
          this.coverageFactorCombinationData,
          this.getInsuredLevelByType(selectedOption)?.coverageFactorMapping
        );
      }
    });
    this.deductiblesForm
      ?.get('valueType')
      ?.valueChanges.subscribe((val: string) => {
        if (val.toUpperCase() === DeductibleValueTypes.PERCENTAGE) {
          this.deductiblesForm
            ?.get('percentOf')
            ?.setValidators(Validators.required);
        } else {
          this.deductiblesForm?.get('percentOf')?.clearValidators();
          this.deductiblesForm?.get('percentOf')?.reset();
          this.deductiblesForm?.get('percentOf')?.updateValueAndValidity();
        }
      });
    this.variantLevelForm
      .get('limitsForm')
      ?.get('maxLimitType')
      ?.valueChanges.subscribe((val: string) => {
        if (val.toLowerCase() === 'amount') {
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
  }
  onSelectionChange() {
    const selectedVal = this.limitsForm?.get('aggregateLimitType')?.value;
    if (
      selectedVal != undefined &&
      selectedVal.toLowerCase() === 'percentage'
    ) {
      this.isLimits = true;
    } else {
      this.isLimits = false;
    }
    this._updateValidation(selectedVal);
  }
  _updateValidation(val: string) {
    if (val != undefined && val.toLowerCase() === 'amt') {
      this.variantLevelForm
        .get('limitsForm')
        ?.setValidators(Validators.required);
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregratePercentOf')
        ?.clearValidators();

      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregateMaxPercentOf')
        ?.clearValidators();
    } else if (val != undefined && val.toLowerCase() === 'percentage') {
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregratePercentOf')
        ?.setValidators(Validators.required);
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregateMaxPercentOf')
        ?.setValidators(Validators.required);
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregateamountValue')
        ?.clearValidators();
    } else {
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregateamountValue')
        ?.clearValidators();
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregratePercentOf')
        ?.clearValidators();
      this.variantLevelForm
        .get('limitsForm')
        ?.get('aggregateMaxPercentOf')
        ?.clearValidators();
    }
    this.variantLevelForm
      .get('limitsForm')
      ?.get('aggregratePercentOf')
      ?.updateValueAndValidity();
    this.variantLevelForm
      .get('limitsForm')
      ?.get('aggregateMaxPercentOf')
      ?.updateValueAndValidity();
    this.variantLevelForm
      .get('limitsForm')
      ?.get('aggregateamountValue')
      ?.updateValueAndValidity();
  }

  _fetchReferenceData(): void {
    combineLatest([
      this._productService.getMinMaxLimitTypes(),
      this._productService.getDurationTypes(),
      this._productService.getLimitScopes(),
      this._productService.getWaitingPeriodList(),
      this._productService.getDeductibleTypes(),
      this._productService.getDeductibleValueTypes(),
      this._productService.getPercentageValueTypes(MsgIds.MAIN_INS),
    ]).subscribe({
      next: (response) => {
        this.aggregateType = this.minMaxTypes = response[0];
        this.durationTypes = response[1];
        this.limitScopes = response[2];
        this.waitingPeriodList = response[3];
        this.deductibleTypes = response[4];
        this.deductibleValueTypes = response[5];
        this.percentValueTypes = response[6];
        this._sharedService._bindDomainData(
          this.limitsFormConfigFields,
          this.aggregateType,
          'aggregateLimitType',
          'code',
          'description'
        );
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.durationTypes,
          'durationType',
          'code',
          'description'
        );
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.limitScopes,
          'limitScope',
          'code',
          'description'
        );
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.waitingPeriodList,
          'waitingPeriod',
          'code',
          'description'
        );
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.deductibleTypes,
          'deductilbleType',
          'code',
          'description'
        );
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.deductibleValueTypes,
          'valueType',
          'code',
          'description'
        );
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

  _fetchPrefillData(): void {
    combineLatest([
      this._productService.getInsuredTypes(),
      this._variantLevelService.getCoverageVaraintLevels(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._productService.getDependentTypes(),
      this._variantLevelService.getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._coverageVariantService.getCoverageVariants(
        this.productId,
        this.productVersionId
      ),
      this._variantLevelService.getCoverageVariantLevelPermutations(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
    ]).subscribe({
      next: (res) => {
        const [
          insuredTypes,
          variantLevelResponse,
          dependentTypes,
          rootData,
          coverageVariant,
          permutations,
        ] = res;
        this.rootData = rootData;
        this.coverageVariants = coverageVariant.filter(
          (coverageid) => coverageid.coverageVariantId != this.coverageVariantId
        );
        // subCoveragesFilter will contain filtered data.
        const coverageVariantLevelId =
          isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
            ? this.rootData?.coverageVariantLevels?.[0]?.coverageVariantLevelId
            : this.cvLevelId;
        const subCoveragesFilter =
          this._subCoverageLevelService.filterCoverLevelId(
            _.cloneDeep(this.rootData),
            coverageVariantLevelId ?? ''
          );
        this.subCoverageList = subCoveragesFilter?.subCoverages;
        this.selectedInsuredTypes =
          rootData.insured?.individual.insuredTypes[0].insuredGroupTypes.map(
            (group) => group.individual
          ) || [];
        this.currentInsuredTypeIndex = this.selectedInsuredTypes.findIndex(
          (ins) => ins.value === DependentTypeKeys.ADULT
        );
        this.insuredTypes = [...insuredTypes, ...dependentTypes];

        this.coverageVariantLevels = variantLevelResponse;
        this.showAddInfoAccordinContainer = permutations.length === 0;
        this.prefillRetrieveDataControl(coverageVariantLevelId);

        this.activeInsuredType = this._subCoverageLevelService.getInsuredType(
          this.insuredTypes,
          DependentTypeKeys.ADULT
        );
        this.coverageFactorCombinationData = permutations ?? [];

        this.prefillNewFlowData();
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

  async _prefillForm(selectedOption: MasterData | undefined) {
    const coverageVariantLevelId =
      isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
        ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
        : this.cvLevelId;
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? this.coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : this.coverageVariantLevels[0];
    const filteredVariantLevelData = coverageVariantLevel?.insuredLevel.find(
      (ele) => ele.insuredType.value === selectedOption?.code
    );
    if (!isEmpty(coverageVariantLevel?.description)) {
      this.insuredForm.patchValue({
        coverageVaraintLevel: coverageVariantLevel?.description,
      });
    }
    if (
      filteredVariantLevelData?.limit?.aggregateLimitType?.toLowerCase() ===
      'percentage'
    ) {
      this.isLimits = true;
    } else {
      this.isLimits = false;
    }
    this.variantLevelForm.patchValue({
      limitsForm: {
        maxLimitType: filteredVariantLevelData?.limit.maxType ?? '',
        amountValue: filteredVariantLevelData?.limit.maxAmount ?? '',
        percentOf: filteredVariantLevelData?.limit.maxAmount ?? '',
        aggregateLimitType:
          filteredVariantLevelData?.limit.aggregateLimitType ?? '',
        aggregateamountValue:
          filteredVariantLevelData?.limit.aggregateMaxValue.toString() ?? '',
        aggregratePercentOf:
          filteredVariantLevelData?.limit.aggregateCoverageVariantPercentage ??
          '',
        aggregateMaxPercentOf:
          filteredVariantLevelData?.limit.aggregateMaxValue.toString() ?? '',
      },
      additionalFieldsForm: {
        minLimitType: filteredVariantLevelData?.limit.minType ?? '',
        amountValue: filteredVariantLevelData?.limit.minAmount ?? '',
        percentOf: filteredVariantLevelData?.limit.minAmount ?? '',
        durationType: filteredVariantLevelData?.duration.type ?? '',
        durationValue: filteredVariantLevelData?.duration.quantity ?? '',
        limitScope: filteredVariantLevelData?.limit.scope ?? '',
        scopeValue: filteredVariantLevelData?.limit.scopeValue ?? '',
        waitingPeriod: filteredVariantLevelData?.limit.waitingPeriod ?? '',
        waitingPeriodValue:
          filteredVariantLevelData?.limit.waitingPeriodValue ?? '',
      },
      deductiblesForm: {
        deductibleType:
          filteredVariantLevelData?.deductible.deductibleType ?? '',
        valueType: filteredVariantLevelData?.deductible.type ?? '',
        amountValue: filteredVariantLevelData?.deductible.amount ?? '',
        percentOf: filteredVariantLevelData?.deductible.percentageType ?? '',
      },
    });
    await this._prefillSubCoverageForm(selectedOption);
  }

  async _prefillSubCoverageForm(selectedOption: MasterData | undefined) {
    this.formArray.clear();
    const subCoverageList = await this.getSubCoverageList(selectedOption);
    if (!isNullOrUndefined(subCoverageList)) {
      subCoverageList &&
        subCoverageList?.forEach((item: any) => {
          const subCoverageLevels = item;
          if (!isNullOrUndefined(subCoverageLevels)) {
            const subCoverageForm = this._fb.group({
              selectSubCoverage: [item?.description ?? '', []],
            });
            const limitsForm = this._fb.group({
              maxLimitType: [subCoverageLevels?.limit?.maxType ?? '', []],
              amountValue: [subCoverageLevels?.limit?.maxAmount ?? '', []],
              percentOf: [subCoverageLevels?.limit?.maxAmount ?? '', []],
              aggregateLimitType: [
                subCoverageLevels?.limit.aggregateMaxLimitsValue ?? '',
                [],
              ],
              aggregateMaxValue: [
                subCoverageLevels?.limit.aggregateMaxValue ?? 0,
                [],
              ],
              aggregateCoverageVariantPercentage: [
                subCoverageLevels?.limit?.aggregratePercentOf ?? '',
                [],
              ],
            });
            const additionalFieldsForm = this._fb.group({
              minLimitType: [subCoverageLevels?.limit?.minType ?? '', []],
              amountValue: [subCoverageLevels?.limit?.minAmount ?? '', []],
              percentOf: [subCoverageLevels?.limit?.minAmount ?? '', []],
              durationType: [subCoverageLevels?.duration?.type ?? '', []],
              durationValue: [subCoverageLevels?.duration?.quantity ?? '', []],
              limitScope: [subCoverageLevels?.limit?.scope ?? '', []],
              scopeValue: [subCoverageLevels?.limit?.scopeValue ?? '', []],
              waitingPeriod: [
                subCoverageLevels?.limit?.waitingPeriod ?? '',
                [],
              ],
              waitingPeriodValue: [
                subCoverageLevels?.limit?.waitingPeriodValue ?? '',
                [],
              ],
            });
            const deductiblesForm = this._fb.group({
              deductibleType: [
                subCoverageLevels?.deductible?.deductibleType ?? '',
                [],
              ],
              valueType: [subCoverageLevels?.deductible?.type ?? '', []],
              amountValue: [subCoverageLevels?.deductible?.amount ?? '', []],
              percentOf: [
                subCoverageLevels?.deductible?.percentageType ?? '',
                [],
              ],
            });
            this.formArray.push(
              this._fb.group({
                limitsForm,
                subCoverageForm,
                subCoverageLevelId: [item?.subCoverLevelId],
                additionalFieldsForm,
                deductiblesForm,
              })
            );
          }
        });
    }
    this.updateSubCoverageList();
  }

  _updateLayout() {
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

  private disableForm(): void {
    this.newRetrieveDataControl.disable();
    this.variantLevelForm.get('limitsForm')?.disable();
    this.retrieveDataControl.disable();
    this.variantLevelForm.get('additionalFieldsForm')?.disable();
    this.variantLevelForm.get('deductiblesForm')?.disable();
  }

  _initForm(): void {
    this.disableEdit = this._productContextService.isProductDisabled() ?? false;
    this.retrieveDataControl = this._fb.control(
      { value: '', disabled: this.disableEdit ? true : false },
      []
    );
    this.newRetrieveDataControl = this._fb.control(
      { value: '', disabled: this.disableEdit ? true : false },
      []
    );
    let limitsForm;
    if (this.coverageFactorCombinationData.length > 0) {
      limitsForm = this._subCoverageLevelService.createLimitsForm([
        'aggregateLimitType',
        'aggregateamountValue',
        'aggregratePercentOf',
        'aggregateMaxPercentOf',
      ]);
    } else {
      limitsForm = this._subCoverageLevelService.createLimitsForm([
        'maxLimitType',
        'amountValue',
        'percentOf',
        'aggregateLimitType',
        'aggregateamountValue',
        'aggregratePercentOf',
        'aggregateMaxPercentOf',
      ]);
    }
    const additionalFieldsForm =
      this._subCoverageLevelService.initAdditionalFields();
    const deductiblesForm = this._subCoverageLevelService.initDeductibles();

    if (this.disableEdit) {
      limitsForm.disable();
      additionalFieldsForm.disable();
      deductiblesForm.disable();
    }

    this.variantLevelForm = this._fb.group({
      insuredForm: this._fb.group({
        coverageVaraintLevel: this._fb.control(
          { value: 'Coverage level 1', disabled: true },
          [Validators.maxLength(50)]
        ),
      }),
      limitsForm,
      additionalFieldsForm,
      deductiblesForm,
      subCoveragesForm: this._fb.group({
        subCoverage: this._fb.array([]),
      }),
    });
  }

  async getSubCoverageList(selectedOption: MasterData | undefined) {
    const subCoverageLevels: any = [];
    this.subCoverageList?.forEach((subList) => {
      if (
        subList?.subCoverageLevels &&
        subList?.subCoverageLevels?.length > 0
      ) {
        subList.subCoverageLevels
          ?.filter((ele) => ele?.insuredType?.value === selectedOption?.code)
          .forEach((item) => {
            subCoverageLevels.push(item);
          });
      }
    });
    return await subCoverageLevels;
  }

  /**
   * Delete sub coverage level variant
   */

  removeSubCoverage(index: number): void {
    this.selectedSubCoverageIndex = index;
    const item = this.formArray.controls[
      this.selectedSubCoverageIndex
    ] as FormGroup;
    const subCoverageLevelId = item?.controls?.['subCoverageLevelId']?.value;
    if (
      subCoverageLevelId &&
      this.retrieveDataControl?.value?.code === DependentTypeKeys.ADULT
    ) {
      this.openModal = true;
    } else {
      this.formArray.removeAt(this.selectedSubCoverageIndex);
    }
  }

  /**
   * Toggle the delete modal.
   */
  handleModal() {
    this.openModal = !this.openModal;
  }

  /**
   * On confirmation record will delete.
   */
  onConfirm(): void {
    this.openModal = false;
    if (this.selectedSubCoverageIndex !== null) {
      const item = this.formArray.controls[
        this.selectedSubCoverageIndex
      ] as FormGroup;
      const subCoverageId = item?.controls?.['selectSubCoverage']?.value;
      const subCoverageLevelId = item?.controls?.['subCoverageLevelId']?.value;
      if (
        subCoverageLevelId &&
        this.retrieveDataControl?.value?.code === DependentTypeKeys.ADULT
      ) {
        this._variantLevelService
          .deleteSubCoverageVariantLevel(
            this.productId,
            this.productVersionId,
            this.coverageVariantId,
            subCoverageId,
            subCoverageLevelId
          )
          .subscribe({
            next: (res) => {
              this._layoutService.showMessage({
                severity: 'success',
                message: 'Sub Coverage Variant Level deleted Successfully.',
                duration: 5000,
              });
              const updatedRootData =
                this._subCoverageLevelService.removeRecord(
                  _.cloneDeep(this.rootData),
                  subCoverageLevelId
                );
              this.rootData.subCoverages = updatedRootData?.subCoverages;
              if (!isNullOrUndefined(this.selectedSubCoverageIndex)) {
                this.formArray.removeAt(this.selectedSubCoverageIndex);
              }
            },
            error: (error) => {
              this._layoutService.showMessage({
                severity: 'error',
                message:
                  'Unable to delete Sub Coverage Variant Level data. Please try again later.',
                duration: 5000,
              });
            },
          });
      }
      this.updateSubCoverageList();
    }
  }

  /**
   * It will update 'subCoverageList' with new property 'selected'.
   */
  updateSubCoverageList() {
    this.subCoverageList =
      this._subCoverageLevelService.updateSubCoverageListStatus(
        this.subCoverageList,
        this.formArray.controls
      );
  }

  /**
   * Form validations
   */
  validateForm() {
    this._subCoverageLevelService.validateForm(this.variantLevelForm);
  }

  onButtonAction(action: ButtonAction): void {
    if (action === 'saveChanges') {
      this.saveAdditionalConfig(false, this.editDrawerModel);
    } else if (action === 'clearAll') {
      this.additionalInfoForm.formGroup.reset();
    } else {
      this.sidebarVisible = false;
      this.editDrawerModel = this.emptyAdditionalInfo;
    }
  }

  onAdditionalInfoSelectValueChange(event: any) {
    const percentageField = {
      control: 'percentage',
      label: 'Percentage',
      type: 'dropdown',
      emitOnBlur: true,
      placeholder: 'Select the percentage',
      options: [],
      required: false,
      disabled: false,
      class: 'form-width-first-half addInfo__durType-field',
    };
    let selectedValue = event.selectedValue.split(':')[1].trimStart();
    if (event.fieldName === 'valueType') {
      const hasPercentage = this.additionalInfoFormFields.some(
        (f) => f.control === 'percentage'
      );
      if (selectedValue === 'PERCENTAGE' && !hasPercentage) {
        const idx = this.additionalInfoFormFields.findIndex(
          (f) => f.control === 'valueType'
        );
        this.additionalInfoFormFields.splice(idx + 1, 0, percentageField);
        this._sharedService._bindDomainData(
          this.additionalInfoFormFields,
          this.percentValueTypes,
          'percentage',
          'code',
          'description'
        );
      } else if (selectedValue !== 'PERCENTAGE' && hasPercentage) {
        this.additionalInfoFormFields = this.additionalInfoFormFields.filter(
          (f) => f.control !== 'percentage'
        );
      }
      this.additionalInfoFormFields = [...this.additionalInfoFormFields];
    }
  }

  // Save additional config and handle UI feedback
  saveAdditionalConfig(
    moveToNextStep: boolean,
    modelData?: AdditionalInfoModal
  ): void {
    const currentCoverageVariantLevelId =
      this.getCurrentCoverageVariantLevelId();
    const toastMessageConfig = this.getToastMessageConfig();
    const coverageVariantLevel = this.prepareRequestPayload(modelData);

    const saveObservable = currentCoverageVariantLevelId
      ? this._variantLevelService.patchCoverageVariantLevel(
          this.productId,
          this.productVersionId,
          this.coverageVariantId,
          currentCoverageVariantLevelId ?? '',
          coverageVariantLevel
        )
      : this._variantLevelService.upsertCoverageVariantLevel(
          this.productId,
          this.productVersionId,
          this.coverageVariantId,
          this.prepareRequestPayloadRequest(coverageVariantLevel)
        );

    saveObservable.subscribe({
      next: () => {
        this._layoutService.showMessage(toastMessageConfig.success);
        this.sidebarVisible = false;
        if (isEmpty(modelData)) {
          this.moveToNextStep(moveToNextStep);
        } else {
          this._variantLevelService
            .getCoverageVariantDetails(
              this.productId,
              this.productVersionId,
              this.coverageVariantId
            )
            .subscribe({
              next: (res) => {
                this.rootData = res;
                this.coverageVariantLevels =
                  this.rootData.coverageVariantLevels;
                const coverageVariantLevelId =
                  isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
                    ? this.rootData?.coverageVariantLevels?.[0]
                        ?.coverageVariantLevelId
                    : this.cvLevelId;
                this.prefillRetrieveDataControl(coverageVariantLevelId);
                this.prefillNewFlowData();
              },
              error: (err) => {
                if (err?.error?.errors) {
                  this.showErrorMessage(err.error.errors);
                }
              },
            });
        }
      },
      error: (err) => {
        if (err?.error?.errors) {
          this.showErrorMessage(err.error.errors);
        }
      },
    });
  }

  // Prepare request payload for API
  prepareRequestPayloadRequest(
    coverageVariantLevel: CoverageVariantLevel
  ): PostCoverageVariantLevelRequest {
    const { requestId } = this._productContextService._getProductContext();
    return {
      requestId,
      coverageVariantLevels: [coverageVariantLevel],
    };
  }

  private getToastMessageConfig() {
    return {
      success: {
        severity: 'success',
        message: this.labels.createSucessMessage,
      },
      error: {
        severity: 'error',
        message: this.labels.createErrorMessage,
      },
    };
  }

  // Prepare request payload for coverage variant level
  prepareRequestPayload(modelData?: AdditionalInfoModal): CoverageVariantLevel {
    const covVariantLevel = this.getCurrentCoverageVariantLevel();
    const insuredLevels: InsuredLevel[] = covVariantLevel?.insuredLevel ?? [];
    const insuredLevel = this._preparePatchRequestObjectWithFactors(
      insuredLevels,
      modelData
    );
    const miDataIndex = insuredLevels.findIndex(
      (ele) => ele.insuredType?.value === DependentTypeKeys.ADULT
    );
    const { requestId } = this._productContextService._getProductContext();

    if (miDataIndex > -1) {
      insuredLevels[miDataIndex] = insuredLevel;
    } else {
      insuredLevels.push(insuredLevel);
    }

    const maxAmount =
      this._productContextService._getProductAggregateLimitValue() > 0
        ? Number(this._productContextService._getProductAggregateLimitValue())
        : Number(covVariantLevel?.aggregateMaxValue ?? 0);

    return {
      coverageVariantLevelId: this.getCurrentCoverageVariantLevelId(),
      description: this.insuredForm.get('coverageVaraintLevel')?.value,
      insuredLevel: insuredLevels,
      ruleSet: [],
      insuredObjectLevel: [],
      multipleFactor: covVariantLevel?.multipleFactor,
      requestId,
      aggregateLimitType:
        covVariantLevel?.aggregateLimitType ??
        this._productContextService._getProductAggregateLimitType() ??
        '',
      aggregateMaxValue: maxAmount,
      aggregateCoverageVariantPercentage:
        covVariantLevel?.aggregateCoverageVariantPercentage ??
        this._productContextService._getproductAggregatePercentageType() ??
        '',
      isCurrentVersion: covVariantLevel?.isCurrentVersion ?? true,
      insuredEventLevel: [],
    };
  }

  // Prepare patch request object with factors
  _preparePatchRequestObjectWithFactors(
    insuredLevels: InsuredLevel[],
    modelData?: AdditionalInfoModal
  ): InsuredLevel {
    const miDataIndex = insuredLevels.findIndex(
      (ele) => ele.insuredType?.value === DependentTypeKeys.ADULT
    );
    const miInsuredLevel: InsuredLevel = {
      insuredLevelId:
        miDataIndex > -1 ? insuredLevels[miDataIndex].insuredLevelId : '',
      insuredType:
        miDataIndex > -1
          ? insuredLevels[miDataIndex].insuredType
          : this.activeInsuredType,
      limit: {} as Limit,
      deductible: {} as Deductible,
      duration: {} as Duration,
      coverageFactorMapping: this._prepareCoverageFactorMapping(modelData),
    };
    return miInsuredLevel;
  }

  // Prepare coverage factor mapping
  _prepareCoverageFactorMapping(
    modelData?: AdditionalInfoModal
  ): CoverageFactorMapping {
    const coverageFactorCombinations =
      this.getCurrentInsuredLevel()?.coverageFactorMapping
        ?.coverageFactorCombinations ?? [];
    if (isEmpty(modelData)) {
      this.tableData.forEach((data: CoverageFactorTableRow) => {
        const selectedPermutations = this.getSelectedPermutations(data);

        const updatedCoverageFactorCombination =
          this.getUpdatedCoverageFactorCombination(selectedPermutations);
        let combination: CoverageFactorCombinations =
          this._updateCoverageFactorCombinations(
            updatedCoverageFactorCombination
          );
        combination.limit.maxAmount = data.maxLimit ?? 0;
        combination.factorSet = selectedPermutations ?? [];
        const { coverageFactorCombinationId } = combination;
        const idx = coverageFactorCombinations?.findIndex(
          (ele) =>
            coverageFactorCombinationId &&
            ele.coverageFactorCombinationId === coverageFactorCombinationId
        );
        if (coverageFactorCombinations && idx !== undefined && idx > -1) {
          coverageFactorCombinations[idx] = combination;
        } else {
          coverageFactorCombinations?.push(combination);
        }
      });
    } else {
      const { coverageFactorCombinationId } = modelData;
      const idx = coverageFactorCombinations?.findIndex(
        (ele) =>
          coverageFactorCombinationId &&
          ele.coverageFactorCombinationId === coverageFactorCombinationId
      );
      const combination = this._prepareCoverageFactorCombinations(modelData);
      if (coverageFactorCombinations && idx !== undefined && idx > -1) {
        coverageFactorCombinations[idx] = combination;
      } else {
        coverageFactorCombinations?.push(combination);
      }
    }
    return {
      aggregateMaxValue: this.getFormValue(
        this.limitsFormConfig,
        'aggregateamountValue',
        0
      ),
      aggregateLimitType: this.getFormValue(
        this.limitsFormConfig,
        'aggregateLimitType',
        ''
      ),
      aggregateCoverageVariantPercentage: this.getFormValue(
        this.limitsFormConfig,
        'aggregratePercentOf',
        ''
      ),
      coverageFactorCombinations: coverageFactorCombinations ?? [],
    };
  }

  // Update coverage factor combinations with defaults
  _updateCoverageFactorCombinations(
    combination: CoverageFactorCombinations | undefined
  ): CoverageFactorCombinations {
    return {
      coverageFactorCombinationId: combination?.coverageFactorCombinationId,
      limit: {
        limitId: combination?.limit?.limitId ?? '',
        minAmount: combination?.limit?.minAmount ?? 0,
        maxAmount: combination?.limit?.maxAmount ?? 0,
        scope: combination?.limit?.scope ?? '',
        scopeValue: combination?.limit?.scopeValue ?? '',
        duration: combination?.limit?.duration ?? '',
        durationType: combination?.limit?.durationType ?? '',
        waitingPeriod: combination?.limit?.waitingPeriod ?? '',
        waitingPeriodValue: combination?.limit?.waitingPeriodValue ?? '',
        basecoverLevelId: '',
        options: [],
      },
      deductible: {
        id: combination?.deductible?.id ?? '',
        deductibleType: combination?.deductible?.deductibleType ?? '',
        type: combination?.deductible?.type ?? '',
        amount: combination?.deductible?.amount ?? 0,
        baseCoverLevelId: '',
        options: [],
        percentageType: combination?.limit?.limitId ?? '',
      },
      duration: {
        durationId: combination?.duration?.durationId ?? '',
        type: combination?.duration?.type ?? '',
        quantity: combination?.duration?.quantity ?? '',
      },
      factorSet: [],
    };
  }

  // Prepare coverage factor combinations from model data
  _prepareCoverageFactorCombinations(
    modelData?: AdditionalInfoModal
  ): CoverageFactorCombinations {
    const factorSet = this.getSelectedPermutations(this.additionalInfo);
    return {
      coverageFactorCombinationId: modelData?.coverageFactorCombinationId,
      limit: {
        limitId: modelData?.limitId ?? '',
        minAmount: Number(
          this.getFormValue(this.additionalInfoForm, 'minAmount', 0)
        ),
        maxAmount: Number(
          this.getFormValue(this.additionalInfoForm, 'maxAmount', 0)
        ),
        scope: this.getFormValue(this.additionalInfoForm, 'limitScope', ''),
        scopeValue: this.getFormValue(
          this.additionalInfoForm,
          'limitValue',
          ''
        ),
        duration: this.getFormValue(
          this.additionalInfoForm,
          'durationValue',
          ''
        ),
        durationType: this.getFormValue(
          this.additionalInfoForm,
          'durationType',
          ''
        ),
        waitingPeriod: this.getFormValue(
          this.additionalInfoForm,
          'waitingPeriod',
          ''
        ),
        waitingPeriodValue: this.getFormValue(
          this.additionalInfoForm,
          'waitingPeriodValue',
          ''
        ),
        basecoverLevelId: '',
        options: [],
      },
      deductible: {
        id: modelData?.deductibleId ?? '',
        deductibleType: this.getFormValue(
          this.additionalInfoForm,
          'deductibleType',
          ''
        ),
        type: this.getFormValue(this.additionalInfoForm, 'valueType', ''),
        amount: Number(
          this.getFormValue(this.additionalInfoForm, 'amountValue', 0)
        ),
        baseCoverLevelId: '',
        options: [],
        percentageType: this.getFormValue(
          this.additionalInfoForm,
          'percentage',
          ''
        ),
      },
      duration: {
        durationId: modelData?.durationId ?? '',
        type: this.getFormValue(this.additionalInfoForm, 'durationType', ''),
        quantity: this.getFormValue(
          this.additionalInfoForm,
          'durationValue',
          ''
        ),
      },
      factorSet: factorSet ?? [],
    };
  }

  // Helper to safely get form values
  private getFormValue(form: any, key: string, defaultValue: any = ''): any {
    return form?.formGroup?.get(key)?.value ?? defaultValue;
  }

  showErrorMessage(errors: any): void {
    for (const key in errors) {
      this._layoutService.showMessage({
        severity: 'error',
        message: errors[key] || this.labels.createErrorMessage,
      });
    }
  }

  // Prefill table data and update UI state
  prefillTableData(res: CvlPermutations[][]): void {
    this.tableData = this.transformApiResponse(
      res,
      this.getCurrentInsuredLevel()?.coverageFactorMapping
    );
    const isDisabled = this._productContextService.isProductDisabled() ?? false;
    this.additionalInfoFormFields.forEach(
      (item) => (item.disabled = isDisabled)
    );
  }

  // Transform API response to table rows
  transformApiResponse(
    apiResponse: CvlPermutations[][],
    coverageFactorMapping: CoverageFactorMapping | undefined
  ): CoverageFactorTableRow[] {
    const isDisabled = this._productContextService.isProductDisabled() ?? false;
    return apiResponse.map((factorArray) => {
      const age = factorArray.find((f) => f.factorType === 'AGE');
      const gender = factorArray.find((f) => f.factorType === 'GENDER');
      const combination = this.getSelectedCoverageFactorCombination(
        coverageFactorMapping?.coverageFactorCombinations,
        factorArray
      );
      return {
        ageBand: age?.value ?? '',
        gender: gender?.value ?? '',
        maxLimit: combination?.limit.maxAmount ?? null,
        ageValueId: age?.valueId ?? '',
        genderValueId: gender?.valueId ?? '',
        isReadOnly: isDisabled,
      };
    });
  }

  // Get current insured level
  getCurrentInsuredLevel(): InsuredLevel | undefined {
    const currentLevel = this.getCurrentCoverageVariantLevel();
    return !isEmpty(currentLevel)
      ? currentLevel.insuredLevel?.find(
          (ele) => ele.insuredType?.value === DependentTypeKeys.ADULT
        )
      : undefined;
  }

  // Get current coverage variant level
  getCurrentCoverageVariantLevel(): CoverageVariantLevel | undefined {
    const id = this.getCurrentCoverageVariantLevelId();
    return id
      ? this.coverageVariantLevels.find(
          (item) => item.coverageVariantLevelId === id
        )
      : undefined;
  }

  // Get current coverage variant level ID
  getCurrentCoverageVariantLevelId(): string | undefined {
    return isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
      ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
      : this.cvLevelId;
  }

  // Get selected permutations for a table row
  getSelectedPermutations(
    item: CoverageFactorTableRow
  ): CvlPermutations[] | undefined {
    const result = this.coverageFactorCombinationData.find((factorArray) => {
      const age = factorArray.find((f) => f.factorType === 'AGE');
      const gender = factorArray.find((f) => f.factorType === 'GENDER');

      // Both age and gender available
      if (age && gender) {
        return (
          age.value === item.ageBand &&
          age.valueId === item.ageValueId &&
          gender.value === item.gender &&
          gender.valueId === item.genderValueId
        );
      }

      // Only age available
      if (age && !gender) {
        return age.value === item.ageBand && age.valueId === item.ageValueId;
      }

      // Only gender available
      if (!age && gender) {
        return (
          gender.value === item.gender && gender.valueId === item.genderValueId
        );
      }

      // Neither available
      return false;
    });

    return result?.map(({ factorType, valueId }) => ({ factorType, valueId }));
  }

  // Get selected coverage factor combination
  getSelectedCoverageFactorCombination(
    coverageFactorCombinations: CoverageFactorCombinations[] | undefined,
    item: CvlPermutations[] | undefined
  ): CoverageFactorCombinations | undefined {
    return coverageFactorCombinations?.find((combination) =>
      this.factorSetsMatch(combination.factorSet, item)
    );
  }

  // Compare factor sets for equality
  factorSetsMatch(
    factorSet1: FactorSet[],
    factorSet2: CvlPermutations[] | undefined
  ): boolean {
    if (factorSet1.length !== factorSet2?.length) return false;
    return factorSet1.every((f1) =>
      factorSet2?.some(
        (f2) => f1.factorType === f2.factorType && f1.valueId === f2.valueId
      )
    );
  }

  // Prepare drawer model for editing
  prepareDrawerModel(
    coverageFactorCombinations: CoverageFactorCombinations | undefined
  ): void {
    const MaxValue = this.tableData.map((row) => row.maxLimit);
    this.editDrawerModel = !isEmpty(coverageFactorCombinations)
      ? {
          coverageFactorCombinationId:
            coverageFactorCombinations.coverageFactorCombinationId,
          limitId: coverageFactorCombinations.limit.limitId,
          minAmount: coverageFactorCombinations.limit.minAmount,
          maxAmount: Number(MaxValue)
            ? Number(MaxValue)
            : coverageFactorCombinations.limit.maxAmount,
          limitScope: coverageFactorCombinations.limit.scope,
          limitValue: coverageFactorCombinations.limit.scopeValue,
          durationValue: coverageFactorCombinations.limit.duration,
          durationType: coverageFactorCombinations.limit.durationType,
          waitingPeriod: coverageFactorCombinations.limit.waitingPeriod,
          waitingPeriodValue:
            coverageFactorCombinations.limit.waitingPeriodValue,
          deductibleId: coverageFactorCombinations.deductible.id,
          deductilbleType: coverageFactorCombinations.deductible.deductibleType,
          valueType: coverageFactorCombinations.deductible.type,
          amountValue: coverageFactorCombinations.deductible.amount,
          percentage: coverageFactorCombinations.deductible.percentageType,
          durationId: coverageFactorCombinations.duration.durationId,
          type: coverageFactorCombinations.duration.type,
          quantity: coverageFactorCombinations.duration.quantity,
        }
      : this.emptyAdditionalInfo;
  }

  allTableRowsHaveMaxLimit(): boolean {
    if (!this.tableData || this.tableData.length === 0) return false;
    return this.tableData.every(
      (row) =>
        row.maxLimit !== null && row.maxLimit !== undefined && row.maxLimit
    );
  }

  onLimitsFormSelectValueChange(event: any) {
    if (event.fieldName === 'aggregateLimitType') {
      const aggType = event.selectedValue.split(':')[1].trimStart();
      this.limitsFormConfigFields = this.limitsFormConfigFields.map((field) => {
        if (field.control === 'aggregratePercentOf') {
          this._sharedService._bindDomainData(
            this.limitsFormConfigFields,
            this.coverageVariants,
            'aggregratePercentOf',
            'coverageVariantId',
            'coverageVariantId'
          );
          return { ...field, hidden: aggType !== 'PERCENTAGE' };
        }
        return field;
      });
      this.limitsFormConfigFields = [...this.limitsFormConfigFields];
    }
  }

  getSelectedOption(): MasterData | undefined {
    let miData = this.retrieveDataOptions?.find(
      (ele) => ele['code'] === DependentTypeKeys.ADULT
    );
    if (!isEmpty(this.newRetrieveDataControl?.value)) {
      miData = this.newRetrieveDataControl.value;
    }
    return miData;
  }

  prefillRetrieveDataControl(coverageVariantLevelId: string | undefined): void {
    const currentCoverageVariantLevel = this.coverageVariantLevels.find(
      (item) => item.coverageVariantLevelId === coverageVariantLevelId
    );
    if (!isEmpty(currentCoverageVariantLevel)) {
      if (!currentCoverageVariantLevel.isCurrentVersion) {
        this.disableEdit = true;
        this.disableForm();
      }
      this.retrieveDataOptions = currentCoverageVariantLevel?.insuredLevel?.map(
        (ele) => {
          return {
            code: ele.insuredType?.value,
            description: this.insuredTypes.find(
              (ins) => ins.code == ele.insuredType?.value
            )?.description,
          };
        }
      );
    }
    const dpDataAvailable =
      !!this.retrieveDataOptions &&
      this.retrieveDataOptions.find(
        (ele) => ele['code'] === DependentTypeKeys.ADULT
      );
    if (!isEmpty(dpDataAvailable)) {
      this.showAddInfoAccordinContainer
        ? this.retrieveDataControl.patchValue(dpDataAvailable)
        : this.newRetrieveDataControl.patchValue(dpDataAvailable);
    }
  }

  prefillNewFlowData(): void {
    if (this.coverageFactorCombinationData.length > 0) {
      this._fillLimitsFormModal();
      this.prefillTableData(this.coverageFactorCombinationData);
    }
  }

  _fillLimitsFormModal(): void {
    const desc = this.getCoverageVariantLevelDescription(
      this.cvLevelId,
      this.coverageVariantLevels
    );
    this.insuredFormModel = !isEmpty(desc)
      ? {
          coverageVaraintLevel: desc,
        }
      : this.emptyInsuredFormModel;
    const selectedOption = this.getSelectedOption();
    let currentInsuredlvl = this.getCurrentInsuredLevel();
    if (!isEmpty(selectedOption)) {
      currentInsuredlvl = this.getInsuredLevelByType(selectedOption);
    }
    const covFactors = currentInsuredlvl?.coverageFactorMapping;
    const isPercentage = covFactors?.aggregateLimitType === 'PERCENTAGE';
    const hasPercentageField = this.limitsFormConfigFields.some(
      (f) => f.control === 'aggregratePercentOf'
    );
    this.insuredFormModel.coverageVaraintLevel =
      this.getCurrentCoverageVariantLevel()?.description;
    if (isPercentage && hasPercentageField) {
      this._sharedService._bindDomainData(
        this.limitsFormConfigFields,
        this.coverageVariants,
        'aggregratePercentOf',
        'coverageVariantId',
        'coverageVariantId'
      );
      this.limitsFormConfigFields = this.limitsFormConfigFields.map((field) => {
        if (field.control === 'aggregratePercentOf') {
          return { ...field, hidden: !isPercentage };
        }
        return field;
      });
      this.limitsFormConfigFields = [...this.limitsFormConfigFields];
    }
    this.limitsFormModel = !isEmpty(covFactors)
      ? {
          aggregateLimitType: covFactors.aggregateLimitType,
          aggregateamountValue: covFactors.aggregateMaxValue,
          aggregratePercentOf: covFactors.aggregateCoverageVariantPercentage,
        }
      : this.emptylimitsFormModel;
    const isDisabled = this._productContextService.isProductDisabled() ?? false;
    this.limitsFormConfigFields.forEach((item) => (item.disabled = isDisabled));
  }

  setMinMaxValidator() {
    if (this.additionalInfoForm && this.additionalInfoForm.formGroup) {
      this.additionalInfoForm.formGroup.setValidators(this.minMaxValidator);
      this.additionalInfoForm.formGroup.updateValueAndValidity();
    }
  }

  // Get insured level by type
  getInsuredLevelByType(
    selectedOption: MasterData | undefined
  ): InsuredLevel | undefined {
    const currentLevel = this.getCurrentCoverageVariantLevel();
    return !isEmpty(currentLevel)
      ? currentLevel.insuredLevel?.find(
          (ele) => ele.insuredType?.value === selectedOption?.code
        )
      : undefined;
  }

  getUpdatedCoverageFactorCombination(
    item: CvlPermutations[] | undefined
  ): CoverageFactorCombinations | undefined {
    const selectedOption = this.getSelectedOption();
    const currentCoverageFactorMapping =
      this.getCurrentInsuredLevel()?.coverageFactorMapping;
    const coverageFactorMapping =
      this.getInsuredLevelByType(selectedOption)?.coverageFactorMapping;

    const coverageFactorCombination = cloneDeep(
      this.getSelectedCoverageFactorCombination(
        coverageFactorMapping?.coverageFactorCombinations,
        item
      )
    );
    const currentCoverageFactorCombination =
      this.getSelectedCoverageFactorCombination(
        currentCoverageFactorMapping?.coverageFactorCombinations,
        item
      );
    if (!isEmpty(coverageFactorCombination)) {
      coverageFactorCombination.coverageFactorCombinationId =
        currentCoverageFactorCombination?.coverageFactorCombinationId;
    }
    return coverageFactorCombination;
  }

  getCoverageVariantLevelDescription(
    cvLevelId: string | undefined,
    coverageVariantLevels: CoverageVariantLevel[]
  ): string {
    // Determine the correct coverageVariantLevelId
    const coverageVariantLevelId =
      isNullOrUndefined(cvLevelId) || isEmpty(cvLevelId)
        ? coverageVariantLevels?.[0]?.coverageVariantLevelId
        : cvLevelId;
    // Find the coverageVariantLevel object
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : coverageVariantLevels[0];

    // Return the description if available, else empty string
    return !isEmpty(coverageVariantLevel?.description)
      ? coverageVariantLevel?.description!
      : '';
  }
}
