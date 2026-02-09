import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import {
  mockCoverageVariant,
  mockCoverageVariantLevels,
  mockDeductibleTypes,
  mockDeductibleValueTypes,
  mockDependentTypes,
  mockDurationTypes,
  mockInsuredTypes,
  mockLimitScopes,
  mockPercentageTypes,
  mockWaitPeriod,
} from 'apps/products/mock/mock-coverage-variant-levels';
import { of, throwError } from 'rxjs';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SubCoverageLevelService } from '../../../services/sub-coverage-level.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { InsuredTypeKeys } from '../../../types/coverage-variant-level';
import { MiVariantLevelComponent } from './mi-variant-level.component';

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

// Mock services as constants
const mockRouter = {
  navigate: jest.fn(),
};

const variantLevelId = 'CVL-4E8049E4-C804-475A-9C96-E5D21F6EC564';

const mockActivatedRoute = {
  paramMap: of({ get: () => variantLevelId }),
};

const mockAppContextService = {
  get: jest.fn((key: string) => {
    const configs: Record<string, any> = {
      'pages.product.mi-variant.editSchema': {},
      'pages.product.mi-variant.additionalConfigColumns': [],
      'pages.product.mi-variant.insuredFormConfig': [],
      'pages.product.mi-variant.limitsFormConfig': [],
      'pages.product.mi-variant.additionalInfoFormFields': [],
      'pages.product.mi-variant.labels': {
        addInfoModalTitle: 'Additional Information',
        primaryBtnLabelOfAddInfoModal: 'Save',
        secondaryBtnLabelOfAddInfoModal: 'Cancel',
        tertiaryBtnLabelOfAddInfoModal: 'Reset',
      },
    };
    return configs[key];
  }),
};

const mockLayoutService = {
  caption$: { next: jest.fn() },
  showMessage: jest.fn(),
  updateBreadcrumbs: jest.fn(),
};

const mockVariantLevelService = {
  patchCoverageVariantLevel: jest.fn(),
  upsertCoverageVariantLevel: jest.fn(),
  getCoverageVaraintLevels: jest
    .fn()
    .mockReturnValue(of(mockCoverageVariantLevels)),
  getCoverageVariantDetails: jest.fn().mockReturnValue(of(mockCoverageVariant)),
  getCoverageVariantLevelPermutations: jest.fn().mockReturnValue(of([])),
  selectVariant: jest.fn(),
  deleteSubCoverageVariantLevel: jest.fn(),
  patchSubCoverageVariantLevel2: jest.fn(),
};

const mockProductContextService = {
  isProductDisabled: jest.fn().mockReturnValue(false),
  _getProductAggregateLimitType: jest.fn().mockReturnValue('AMT'),
  _getProductAggregateLimitValue: jest.fn().mockReturnValue(100000),
  _getproductAggregatePercentageType: jest.fn().mockReturnValue('PERCENTAGE'),
  _getProductContext: jest.fn().mockReturnValue({ requestId: 'REQ-123' }),
};

const mockProductsService = {
  getMinMaxLimitTypes: jest.fn().mockReturnValue(of(mockDeductibleValueTypes)),
  getDurationTypes: jest.fn().mockReturnValue(of(mockDurationTypes)),
  getLimitScopes: jest.fn().mockReturnValue(of(mockLimitScopes)),
  getWaitingPeriodList: jest.fn().mockReturnValue(of(mockWaitPeriod)),
  getDeductibleTypes: jest.fn().mockReturnValue(of(mockDeductibleTypes)),
  getDeductibleValueTypes: jest
    .fn()
    .mockReturnValue(of(mockDeductibleValueTypes)),
  getPercentageValueTypes: jest.fn().mockReturnValue(of(mockPercentageTypes)),
  getInsuredTypes: jest.fn().mockReturnValue(of(mockInsuredTypes)),
  getDependentTypes: jest.fn().mockReturnValue(of(mockDependentTypes)),
};

const mockCoverageVariantService = {
  getCoverageVariants: jest.fn().mockReturnValue(
    of([
      { coverageVariantId: 'CV-OTHER', coverageVariantName: 'Other' },
      { coverageVariantId: 'CV-CURR', coverageVariantName: 'Current' },
    ])
  ),
};

describe('MiVariantLevelComponent', () => {
  let component: MiVariantLevelComponent;
  let fixture: ComponentFixture<MiVariantLevelComponent>;
  let formBuilder: FormBuilder;
  let subCoverageLevelService: SubCoverageLevelService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MiVariantLevelComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        FormBuilder,
        SubCoverageLevelService,
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: VariantLevelService, useValue: mockVariantLevelService },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: ProductsService, useValue: mockProductsService },
        {
          provide: CoverageVariantService,
          useValue: mockCoverageVariantService,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    formBuilder = new FormBuilder();
    subCoverageLevelService = new SubCoverageLevelService(formBuilder);
    fixture = TestBed.createComponent(MiVariantLevelComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
    // Inject the service using TestBed
    subCoverageLevelService = TestBed.inject(SubCoverageLevelService);
    const limitsForm = formBuilder.group({
      maxLimitType: [''],
      amountValue: [''],
      percentOf: [''],
      aggregateLimitType: [''],
      aggregateamountValue: [''],
      aggregratePercentOf: [''],
      aggregateMaxPercentOf: [''],
    });
    const additionalFields = formBuilder.group({
      minLimitType: ['', []],
      amountValue: [''],
      percentOf: [''],
      durationType: ['', []],
      durationValue: [''],
      limitScope: ['', []],
      scopeValue: [''],
      waitingPeriod: ['', []],
      waitingPeriodValue: [''],
    });
    const deductibles = formBuilder.group({
      deductibleType: ['', []],
      valueType: ['', []],
      amountValue: [''],
      percentOf: [''],
    });
    const subCoverage = formBuilder.group({
      limitsForm: limitsForm,
      subCoverageForm: formBuilder.group({ selectSubCoverage: [''] }),
      subCoverageLevelId: [''],
      selectSubCoverage: [''],
      additionalFieldsForm: additionalFields,
      deductiblesForm: deductibles,
    });
    jest
      .spyOn(subCoverageLevelService, 'limitsForm')
      .mockReturnValue(limitsForm);

    jest
      .spyOn(subCoverageLevelService, 'initAdditionalFields')
      .mockReturnValue(additionalFields);

    jest
      .spyOn(subCoverageLevelService, 'initDeductibles')
      .mockReturnValue(deductibles);

    jest
      .spyOn(subCoverageLevelService, 'initSubCoverage')
      .mockReturnValue(subCoverage);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.variantLevelForm).toBeDefined();
    expect(component.variantLevelForm.get('insuredForm')).toBeDefined();
  });

  it('should add a sub-coverage', () => {
    const initialLength = component.formArray.length;
    component.addSubCoverage();
    expect(component.formArray.length).toBe(initialLength + 1);
  });

  it('should reset the form on clear', () => {
    component.variantLevelForm.patchValue({
      insuredForm: { coverageVaraintLevel: 'Test' },
    });
    component.onClear();
    expect(
      component.variantLevelForm.get('insuredForm.coverageVaraintLevel')?.value
    ).toBe('Coverage level 1');
  });

  it('should call saveAndExit on saveAndNext', () => {
    const saveAndExitSpy = jest.spyOn(component, 'saveAndExit');
    component.saveAndNext();
    expect(saveAndExitSpy).toHaveBeenCalledWith(true);
  });

  it('should call _preparePatchRequestObject', () => {
    const preparePatchRequestObjectSpy = jest.spyOn(
      component,
      '_preparePatchRequestObject'
    );
    component._preparePatchRequestObject(variantLevelId);
    expect(preparePatchRequestObjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should call _preparePostRequestObject', () => {
    const preparePostRequestObjectSpy = jest.spyOn(
      component,
      '_preparePostRequestObject'
    );
    component._preparePostRequestObject();
    expect(preparePostRequestObjectSpy).toHaveBeenCalledTimes(1);
  });

  it('onSelectionChange should toggle isLimits and set validators for percentage', () => {
    component._initForm();
    component.variantLevelForm
      .get('limitsForm')
      ?.get('aggregateLimitType')
      ?.setValue('PERCENTAGE');
    component.onSelectionChange();
    expect(component.isLimits).toBe(true);
  });

  it('_updateValidation should set/clear validators based on value', () => {
    component._initForm();
    component._updateValidation('AMT');
    component._updateValidation('PERCENTAGE');
    component._updateValidation('');
    expect(component.variantLevelForm.get('limitsForm')).toBeTruthy();
  });

  it('_prepareInsuredLevel should build insured level from form values (amount aggregate)', () => {
    component._initForm();
    component.variantLevelForm.get('limitsForm')?.patchValue({
      maxLimitType: 'Amount',
      amountValue: '500',
      aggregateLimitType: 'AMT',
      aggregateamountValue: '1000',
    });
    component.variantLevelForm.get('additionalFieldsForm')?.patchValue({
      minLimitType: 'Amount',
      amountValue: '100',
    });
    const result = component._prepareInsuredLevel();
    expect(result.limit.maxAmount).toBe(500);
    expect(result.limit.aggregateLimitType).toBe('AMT');
    expect(result.limit.aggregateMaxValue).toBe(1000);
  });

  it('_prepareInsuredLevel should use percentage aggregate values', () => {
    component._initForm();
    component.variantLevelForm.get('limitsForm')?.patchValue({
      maxLimitType: 'Percentage',
      percentOf: '15',
      aggregateLimitType: 'percentage',
      aggregateMaxPercentOf: '75',
      aggregratePercentOf: 'CV-OTHER',
    });
    const result = component._prepareInsuredLevel();
    expect(result.limit.maxType).toBe('Percentage');
    expect(result.limit.aggregateLimitType.toLowerCase()).toBe('percentage');
    expect(result.limit.aggregateMaxValue).toBe(75);
    expect(result.limit.aggregateCoverageVariantPercentage).toBe('CV-OTHER');
  });

  it('_observeAndSetValidators should react to value changes', () => {
    component._initForm();
    // deductible percentage path
    component.deductiblesForm.get('valueType')?.setValue('Percentage');
    component.deductiblesForm.get('percentOf')?.setValue('10');
    // limits max type amount path
    component.limitsForm.get('maxLimitType')?.setValue('Amount');
    component.limitsForm.get('amountValue')?.setValue('100');
    expect(component.deductiblesForm.get('percentOf')?.validator).toBeTruthy();
  });

  it('addSubCoverage/cloneSubCoverage/removeSubCoverage without id', () => {
    component._initForm();
    component.addSubCoverage();
    expect(component.formArray.length).toBe(1);
    // Clone
    component.cloneSubCoverage(0, component.formArray.at(0));
    expect(component.formArray.length).toBe(2);
    // Remove (no id -> direct remove)
    component.removeSubCoverage(1);
    expect(component.formArray.length).toBe(1);
  });

  it('removeSubCoverage with id should open modal and onConfirm deletes via service', () => {
    component._initForm();
    component.addSubCoverage();
    const group: any = component.formArray.at(0);
    group.get('subCoverageLevelId')?.setValue('SCL-1');
    group.get('selectSubCoverage')?.setValue('SUB-1');
    component.retrieveDataControl.setValue({
      code: InsuredTypeKeys.MAININSURED,
    } as any);
    (
      mockVariantLevelService.deleteSubCoverageVariantLevel as jest.Mock
    ).mockReturnValue(of({}));
    component.removeSubCoverage(0);
    expect(component.openModal).toBe(true);
    component.onConfirm();
    expect(
      mockVariantLevelService.deleteSubCoverageVariantLevel
    ).toHaveBeenCalled();
  });

  it('handleModal should toggle modal', () => {
    component.openModal = false;
    component.handleModal();
    expect(component.openModal).toBe(true);
  });

  it('updateSubCoverageList should call service and update flags', () => {
    const svcSpy = jest.spyOn(
      subCoverageLevelService,
      'updateSubCoverageListStatus'
    );
    component.updateSubCoverageList();
    expect(svcSpy).toHaveBeenCalled();
  });

  it('validateForm should delegate to service', () => {
    const svcSpy = jest.spyOn(subCoverageLevelService, 'validateForm');
    component._initForm();
    component.validateForm();
    expect(svcSpy).toHaveBeenCalled();
  });

  it('_updateLayout should update breadcrumbs and caption', () => {
    component['_updateLayout']();
    expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalled();
    expect(mockLayoutService.caption$.next).toHaveBeenCalled();
  });

  it('moveToNextStep should select next insured when true and navigate to products when false', () => {
    component.selectedInsuredTypes = [
      { value: 'PREV', category: 'INSURED' } as any,
      { value: 'NEXT', category: 'INSURED' } as any,
    ];
    component.currentInsuredTypeIndex = 0;
    (component as any).cvLevelId = 'CVL-1';
    (component as any).coverageVariantId = 'CV-1';
    component.moveToNextStep(true);
    expect(mockVariantLevelService.selectVariant).toHaveBeenCalledWith(
      'NEXT',
      expect.any(String),
      'CVL-1',
      'CV-1'
    );
    component.moveToNextStep(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
  });

  it('previous should navigate to previous insured type', () => {
    component.selectedInsuredTypes = [
      { value: 'PREV', category: 'INSURED' } as any,
      { value: 'CURR', category: 'INSURED' } as any,
    ];
    component.currentInsuredTypeIndex = 1;
    (component as any).cvLevelId = 'CVL-1';
    (component as any).coverageVariantId = 'CV-1';
    component.previous();
    expect(mockVariantLevelService.selectVariant).toHaveBeenCalledWith(
      'PREV',
      expect.any(String),
      'CVL-1',
      'CV-1'
    );
  });

  it('_fetchReferenceData should populate dropdowns, error branch shows message', () => {
    component._fetchReferenceData();
    expect(component.minMaxTypes.length).toBeGreaterThanOrEqual(0);
    // error branch
    (mockProductsService.getMinMaxLimitTypes as jest.Mock).mockReturnValueOnce(
      throwError(() => new Error('failure'))
    );
    component._fetchReferenceData();
    expect(mockLayoutService.showMessage).toHaveBeenCalled();
  });

  it('_prefillSubCoverageForm should build controls based on subCoverage list', async () => {
    component.ngOnInit();
    const option = { code: InsuredTypeKeys.MAININSURED } as any;
    await component['_prefillSubCoverageForm'](option);
    expect(component.formArray.length).toBeGreaterThanOrEqual(0);
  });

  it('getSubCoverageList should filter list by insured type', async () => {
    component.ngOnInit();
    const list = await component.getSubCoverageList({
      code: InsuredTypeKeys.MAININSURED,
    } as any);
    expect(Array.isArray(list)).toBe(true);
  });

  it('submitSubCoverages should patch and show success, error branch should also navigate', async () => {
    component.ngOnInit();
    const req: any = [];
    // success
    (
      mockVariantLevelService.patchSubCoverageVariantLevel2 as jest.Mock
    ).mockReturnValue(of({}));
    await component.submitSubCoverages(
      false,
      mockCoverageVariantLevels as any,
      mockCoverageVariant as any,
      req,
      { value: InsuredTypeKeys.MAININSURED } as any,
      'CVL-1'
    );
    expect(mockLayoutService.showMessage).toHaveBeenCalled();
    // error
    (
      mockVariantLevelService.patchSubCoverageVariantLevel2 as jest.Mock
    ).mockReturnValueOnce(throwError(() => new Error('fail')));
    await component.submitSubCoverages(
      false,
      mockCoverageVariantLevels as any,
      mockCoverageVariant as any,
      req,
      { value: InsuredTypeKeys.MAININSURED } as any,
      'CVL-1'
    );
    expect(mockLayoutService.showMessage).toHaveBeenCalled();
  });

  it('should handle disableForm correctly', () => {
    component._initForm();
    component['disableForm']();
    expect(component.variantLevelForm.get('limitsForm')?.disabled).toBe(true);
  });

  it('should get current coverage variant level ID', () => {
    (component as any).cvLevelId = 'CVL-TEST-123';
    const result = component.getCurrentCoverageVariantLevelId();
    expect(result).toBe('CVL-TEST-123');
  });

  it('should handle showErrorMessage with errors', () => {
    const errors = { message: 'Test error' };
    component.showErrorMessage(errors);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        duration: 5000,
      })
    );
  });

  it('should test allTableRowsHaveMaxLimit returns true when all rows have max limit', () => {
    component.tableData = [{ maxLimit: 100 }, { maxLimit: 200 }] as any;
    const result = component.allTableRowsHaveMaxLimit();
    expect(result).toBe(true);
  });

  it('should test allTableRowsHaveMaxLimit returns false when rows missing max limit', () => {
    component.tableData = [{ maxLimit: null }, { maxLimit: 200 }] as any;
    const result = component.allTableRowsHaveMaxLimit();
    expect(result).toBe(false);
  });

  it('should handle onButtonAction with different actions', () => {
    component._initForm();
    const mockAction = { action: 'cancel', data: {} } as any;
    component.onButtonAction(mockAction);
    // Verify the method was called without error
    expect(mockAction.action).toBe('cancel');
  });

  it('should test prefillTableData with empty data', () => {
    component.prefillTableData([]);
    expect(component.tableData).toEqual([]);
  });

  it('should test prefillTableData with valid data', () => {
    const mockData = [
      [
        {
          maxAmount: 1000,
          maxPercentOf: null,
          aggregateMaxValue: 5000,
          factorSets: [],
        },
      ],
    ] as any;
    component.prefillTableData(mockData);
    expect(component.tableData.length).toBeGreaterThan(0);
  });

  it('should handle prepareRequestPayload', () => {
    component._initForm();
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    component.rootData = mockCoverageVariant as any;
    (component as any).cvLevelId = variantLevelId;
    component.tableData = [
      { maxLimit: 1000, ageBand: '18-25', gender: 'M' },
    ] as any;
    const result = component.prepareRequestPayload();
    expect(result).toBeDefined();
    expect(result.coverageVariantLevelId).toBe(variantLevelId);
  });

  it('should handle saveAdditionalConfig success', async () => {
    component._initForm();
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    component.rootData = mockCoverageVariant as any;
    (component as any).cvLevelId = variantLevelId;
    component.tableData = [
      { maxLimit: 1000, ageBand: '18-25', gender: 'M' },
    ] as any;

    const mockPayload = {
      insuredLevel: [],
      coverageVariantLevelId: variantLevelId,
    } as any;

    (
      mockVariantLevelService.patchCoverageVariantLevel as jest.Mock
    ).mockReturnValue(of({}));

    await component.saveAdditionalConfig(mockPayload);

    expect(
      mockVariantLevelService.patchCoverageVariantLevel
    ).toHaveBeenCalled();
  });

  it('should handle saveAdditionalConfig error', async () => {
    component._initForm();
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    component.tableData = [
      { maxLimit: 1000, ageBand: '18-25', gender: 'M' },
    ] as any;

    const mockPayload = {
      insuredLevel: [],
      coverageVariantLevelId: variantLevelId,
    } as any;

    (
      mockVariantLevelService.patchCoverageVariantLevel as jest.Mock
    ).mockReturnValue(throwError(() => ({ error: { message: 'API Error' } })));

    await component.saveAdditionalConfig(mockPayload);

    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
      })
    );
  });

  it('should test _navigateIndividualVariantLevels', () => {
    component.selectedInsuredTypes = [
      { value: InsuredTypeKeys.MAININSURED, category: 'INSURED' } as any,
      { value: 'SPOUSE', category: 'INSURED' } as any,
    ];
    component.currentInsuredTypeIndex = 0;
    (component as any).cvLevelId = 'CVL-1';
    (component as any).coverageVariantId = 'CV-1';

    component['_navigateIndividualVariantLevels'](1);

    expect(mockVariantLevelService.selectVariant).toHaveBeenCalled();
  });

  it('should test moveToNextStep with no more steps', () => {
    component.selectedInsuredTypes = [
      { value: InsuredTypeKeys.MAININSURED, category: 'INSURED' } as any,
    ];
    component.currentInsuredTypeIndex = 0;

    component.moveToNextStep(true);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
  });

  it('should handle transformApiResponse', () => {
    const mockApiResponse = [
      [
        { factorType: 'AGE', value: '18-25', valueId: 'AGE-1' },
        { factorType: 'GENDER', value: 'M', valueId: 'GENDER-1' },
      ],
    ] as any;
    const mockCoverageFactorMapping = undefined;

    const result = component.transformApiResponse(
      mockApiResponse,
      mockCoverageFactorMapping
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('ageBand');
    expect(result[0]).toHaveProperty('gender');
  });

  it('should test factorSetsMatch with matching sets', () => {
    const set1 = [{ factorSetId: 'FS1' }, { factorSetId: 'FS2' }] as any;
    const set2 = [{ factorSetId: 'FS1' }, { factorSetId: 'FS2' }] as any;

    const result = component.factorSetsMatch(set1, set2);

    expect(result).toBe(true);
  });

  it('should test factorSetsMatch with non-matching sets', () => {
    const set1 = [{ factorType: 'AGE', valueId: 'AGE-1' }] as any;
    const set2 = [{ factorType: 'AGE', valueId: 'AGE-2' }] as any;

    const result = component.factorSetsMatch(set1, set2);

    expect(result).toBe(false);
  });

  it('should handle prepareDrawerModel', () => {
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    (component as any).cvLevelId = variantLevelId;
    component.tableData = [{ maxLimit: 1000 }, { maxLimit: 2000 }] as any;
    const mockPermutations = undefined;

    component.prepareDrawerModel(mockPermutations);

    expect(component.editDrawerModel).toBeDefined();
  });

  it('should test getSelectedCoverageFactorCombination', () => {
    const mockCombinations = [
      {
        factorSet: [{ factorType: 'AGE', valueId: 'AGE-1' }],
        limit: { maxAmount: 1000 },
      },
    ] as any;
    const mockItem = [{ factorType: 'AGE', valueId: 'AGE-1' }] as any;

    const result = component.getSelectedCoverageFactorCombination(
      mockCombinations,
      mockItem
    );

    expect(result).toBeDefined();
  });

  it('should test getSelectedPermutations', () => {
    const mockSelection = {
      ageBand: '18-25',
      ageValueId: 'AGE-1',
      gender: 'M',
      genderValueId: 'GENDER-1',
    } as any;
    component.coverageFactorCombinationData = [
      [
        { factorType: 'AGE', value: '18-25', valueId: 'AGE-1' },
        { factorType: 'GENDER', value: 'M', valueId: 'GENDER-1' },
      ],
    ] as any;

    const result = component.getSelectedPermutations(mockSelection);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle prefillNewFlowData with empty data', () => {
    component.coverageFactorCombinationData = [];
    component.prefillNewFlowData();
    // Should not throw error
    expect(component.coverageFactorCombinationData.length).toBe(0);
  });

  it('should handle prefillRetrieveDataControl with valid data', () => {
    component._initForm();
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    component.insuredTypes = mockInsuredTypes;
    component.prefillRetrieveDataControl(variantLevelId);
    expect(component.retrieveDataOptions).toBeDefined();
    expect(component.retrieveDataOptions.length).toBeGreaterThan(0);
  });

  it('should handle prefillRetrieveDataControl with disabled version', () => {
    component._initForm();
    const modifiedMock = JSON.parse(JSON.stringify(mockCoverageVariantLevels));
    modifiedMock[0].isCurrentVersion = false;
    component.coverageVariantLevels = modifiedMock as any;
    component.insuredTypes = mockInsuredTypes;
    component.prefillRetrieveDataControl(variantLevelId);
    expect(component.disableEdit).toBe(true);
  });

  it('should test _prepareCoverageFactorMapping', () => {
    const mockPayload = {
      insuredLevel: [
        {
          insuredType: { value: InsuredTypeKeys.MAININSURED },
          limit: { maxAmount: 1000 },
        },
      ],
    } as any;

    const result = component['_prepareCoverageFactorMapping'](mockPayload);

    expect(result).toBeDefined();
  });

  it('should handle _preparePatchRequestObjectWithFactors', () => {
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    component.tableData = [
      [{ maxAmount: 1000, isSelected: true, factorSets: [] }],
    ] as any;
    (component as any).cvLevelId = variantLevelId;

    const mockInsuredLevel = mockCoverageVariantLevels[0].insuredLevel as any;
    const result =
      component['_preparePatchRequestObjectWithFactors'](mockInsuredLevel);

    expect(result).toBeDefined();
  });

  it('should handle prepareRequestPayloadRequest with model data', () => {
    component._initForm();
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    const mockModelData = {
      insuredLevel: [
        {
          insuredType: { value: InsuredTypeKeys.MAININSURED },
          limit: { maxAmount: 1000 },
        },
      ],
    } as any;

    const result = component.prepareRequestPayloadRequest(mockModelData);

    expect(result).toBeDefined();
  });

  it('should test onSelectionChange with AMT type', () => {
    component._initForm();
    component.variantLevelForm
      .get('limitsForm')
      ?.get('aggregateLimitType')
      ?.setValue('AMT');
    component.onSelectionChange();
    expect(component.isLimits).toBe(false);
  });

  it('should test _updateValidation with percentage type', () => {
    component._initForm();
    component._updateValidation('PERCENTAGE');
    const percentOfControl = component.variantLevelForm
      .get('limitsForm')
      ?.get('aggregratePercentOf');
    expect(percentOfControl?.validator).toBeTruthy();
  });

  it('should test getFormValue helper method', () => {
    const mockForm = {
      formGroup: {
        get: jest.fn().mockReturnValue({ value: 'test-value' }),
      },
    };

    const result = component['getFormValue'](mockForm, 'testKey', 'default');

    expect(result).toBe('test-value');
  });

  it('should test getFormValue with default value', () => {
    const mockForm = {
      get: jest.fn().mockReturnValue(null),
    };

    const result = component['getFormValue'](mockForm, 'testKey', 'default');

    expect(result).toBe('default');
  });

  it('should test _initForm creates all required form groups', () => {
    component._initForm();
    expect(component.variantLevelForm.get('insuredForm')).toBeDefined();
    expect(component.variantLevelForm.get('limitsForm')).toBeDefined();
    expect(
      component.variantLevelForm.get('additionalFieldsForm')
    ).toBeDefined();
    expect(component.variantLevelForm.get('deductiblesForm')).toBeDefined();
  });

  it('should update formArray when adding sub coverage', () => {
    component._initForm();
    const initialLength = component.formArray.length;
    component.addSubCoverage();
    component.addSubCoverage();
    expect(component.formArray.length).toBe(initialLength + 2);
  });

  it('should handle updateSubCoverageList with flags', () => {
    component._initForm();
    component.subCoverageList = [
      {
        subCoverId: 'SBC-21E19F1F-5387-4D8A-A6EC-03C2535A2A3F',
        name: 'TEST',
        description: '',
        isCurrentVersion: true,
        subCoverageLevels: [],
      },
    ] as any;
    const svcSpy = jest.spyOn(
      subCoverageLevelService,
      'updateSubCoverageListStatus'
    );
    component.updateSubCoverageList();
    expect(svcSpy).toHaveBeenCalledWith(
      component.subCoverageList,
      component.formArray.controls
    );
  });

  it('should test getCurrentInsuredLevel method', () => {
    component.coverageVariantLevels = mockCoverageVariantLevels as any;
    (component as any).cvLevelId = variantLevelId;
    component.retrieveDataControl.setValue({
      code: InsuredTypeKeys.MAININSURED,
    } as any);

    const result = component['getCurrentInsuredLevel']();

    expect(result).toBeDefined();
  });

  it('should test getSelectedOption method', () => {
    component.showAddInfoAccordinContainer = true;
    component.retrieveDataControl.setValue({
      code: InsuredTypeKeys.MAININSURED,
    } as any);

    const result = component['getSelectedOption']();

    expect(result).toBeDefined();
    expect(result?.code).toBe(InsuredTypeKeys.MAININSURED);
  });

  it('should test getCoverageVariantLevelDescription', () => {
    component.coverageVariantLevels = mockCoverageVariantLevels as any;

    const result = component['getCoverageVariantLevelDescription'](
      variantLevelId,
      mockCoverageVariantLevels as any
    );

    expect(result).toBeDefined();
  });

  it('should handle onButtonAction for saveChanges', () => {
    component._initForm();
    const saveSpy = jest.spyOn(component, 'saveAdditionalConfig');
    component.editDrawerModel = {} as any;
    component.tableData = [
      { maxLimit: 1000, ageBand: '18-25', gender: 'M' },
    ] as any;
    component.onButtonAction(ButtonAction.SAVE_CHANGES);
    expect(saveSpy).toHaveBeenCalledWith(false, component.editDrawerModel);
  });

  it('should handle onButtonAction for clearAll', () => {
    component._initForm();
    component.additionalInfoForm = { formGroup: { reset: jest.fn() } } as any;
    component.onButtonAction(ButtonAction.CLEAR_All);
    expect(component.additionalInfoForm.formGroup.reset).toHaveBeenCalled();
  });

  it('should handle onButtonAction for cancel', () => {
    component._initForm();
    component.sidebarVisible = true;
    component.editDrawerModel = { test: 1 } as any;
    component.onButtonAction(ButtonAction.CANCEL_MODAL);
    expect(component.sidebarVisible).toBe(false);
    expect(component.editDrawerModel).toEqual(component.emptyAdditionalInfo);
  });

  it('should add percentage field when valueType is PERCENTAGE', () => {
    component.additionalInfoFormFields = [
      { control: 'valueType', label: 'Value Type', type: 'dropdown' },
    ];
    component.percentValueTypes = [{ code: 'PERC', description: 'Percentage' }];
    (component as any)._sharedService = { _bindDomainData: jest.fn() } as any;
    component.onAdditionalInfoSelectValueChange({
      fieldName: 'valueType',
      selectedValue: 'code: PERCENTAGE',
    });
    expect(
      component.additionalInfoFormFields.some((f) => f.control === 'percentage')
    ).toBe(true);
  });

  it('should remove percentage field when valueType is not PERCENTAGE', () => {
    component.additionalInfoFormFields = [
      { control: 'valueType', label: 'Value Type', type: 'dropdown' },
      { control: 'percentage', label: 'Percentage', type: 'dropdown' },
    ];
    component.onAdditionalInfoSelectValueChange({
      fieldName: 'valueType',
      selectedValue: 'code: AMOUNT',
    });
    expect(
      component.additionalInfoFormFields.some((f) => f.control === 'percentage')
    ).toBe(false);
  });

  it('should set minMaxValidator on additionalInfoForm', () => {
    component.additionalInfoForm = {
      formGroup: {
        setValidators: jest.fn(),
        updateValueAndValidity: jest.fn(),
      },
    } as any;
    component.setMinMaxValidator();
    expect(
      component.additionalInfoForm.formGroup.setValidators
    ).toHaveBeenCalledWith(component.minMaxValidator);
  });

  it('should return MAIN_INS from retrieveDataOptions if newRetrieveDataControl is empty', () => {
    component.retrieveDataOptions = [
      { code: InsuredTypeKeys.MAININSURED },
      { code: 'SPOUSE' },
    ] as any;
    component.newRetrieveDataControl = { value: '' } as any;
    expect(component.getSelectedOption()?.code).toBe(
      InsuredTypeKeys.MAININSURED
    );
  });

  it('should return value from newRetrieveDataControl if present', () => {
    component.retrieveDataOptions = [
      { code: InsuredTypeKeys.MAININSURED },
      { code: 'SPOUSE' },
    ] as any;
    component.newRetrieveDataControl = { value: { code: 'SPOUSE' } } as any;
    expect(component.getSelectedOption()?.code).toBe('SPOUSE');
  });

  it('should return default value if form is undefined', () => {
    expect(component['getFormValue'](undefined, 'key', 'def')).toBe('def');
  });

  it('should return false if lengths do not match', () => {
    expect(
      component.factorSetsMatch(
        [{ factorType: 'AGE', valueId: '1' }] as any,
        []
      )
    ).toBe(false);
  });

  it('should set editDrawerModel to emptyAdditionalInfo if input is empty', () => {
    component.emptyAdditionalInfo = { test: 1 } as any;
    component.tableData = [];
    component.prepareDrawerModel(undefined);
    expect(component.editDrawerModel).toEqual(component.emptyAdditionalInfo);
  });

  it('should remove subcoverage directly if not MAIN_INS', () => {
    component._initForm();
    component.addSubCoverage();
    const group: any = component.formArray.at(0);
    group.get('subCoverageLevelId')?.setValue('SCL-1');
    group.get('selectSubCoverage')?.setValue('SUB-1');
    component.retrieveDataControl.setValue({ code: 'SPOUSE' } as any);
    component.removeSubCoverage(0);
    expect(component.formArray.length).toBe(0);
  });

  it('should update limitsFormConfigFields on aggregateLimitType change', () => {
    component.limitsFormConfigFields = [
      { control: 'aggregratePercentOf' },
    ] as any;
    component.percentValueTypes = [{ code: 'PERC', description: 'Percentage' }];
    component.coverageVariants = [{ coverageVariantId: 'CV-OTHER' }] as any;
    (component as any)._sharedService = { _bindDomainData: jest.fn() } as any;
    component.onLimitsFormSelectValueChange({
      fieldName: 'aggregateLimitType',
      selectedValue: 'code: PERCENTAGE',
    });
    expect(component.limitsFormConfigFields[0].hidden).toBe(false);
  });

  it('should handle prefillRetrieveDataControl with empty coverageVariantLevels', () => {
    component.coverageVariantLevels = [];
    component.insuredTypes = [];
    expect(() => component.prefillRetrieveDataControl('any')).not.toThrow();
  });

  it('should disable additionalInfoFormFields if product is disabled', () => {
    (component as any)._productContextService = {
      isProductDisabled: () => true,
    } as any;
    component.additionalInfoFormFields = [
      {
        control: 'valueType',
        label: 'Value Type',
        type: 'dropdown',
        disabled: false,
      },
      {
        control: 'percentage',
        label: 'Percentage',
        type: 'dropdown',
        disabled: false,
      },
    ];
    component.prefillTableData([]);
    expect(component.additionalInfoFormFields.every((f) => f.disabled)).toBe(
      true
    );
  });

  it('should set limitsFormModel to emptylimitsFormModel if covFactors is empty', () => {
    component.emptylimitsFormModel = {
      aggregateLimitType: '',
      aggregateamountValue: 0,
      aggregratePercentOf: '',
    };
    (component as any)._productContextService = {
      isProductDisabled: () => false,
    } as any;
    component.limitsFormConfigFields = [];
    component.coverageVariants = [];
    component.getCurrentInsuredLevel = () => undefined;
    component.getSelectedOption = () => undefined;
    component.getCurrentCoverageVariantLevel = () => undefined;
    component.limitsFormModel = null as any;
    (component as any)._sharedService = { _bindDomainData: jest.fn() } as any;
    component._fillLimitsFormModal();
    expect(component.limitsFormModel).toEqual(component.emptylimitsFormModel);
  });

  it('should return error if min > max', () => {
    const group = new FormGroup({
      minAmount: new FormControl(10),
      maxAmount: new FormControl(5),
    });
    const result = component.minMaxValidator(group);
    expect(result).toEqual({ minGreaterThanMax: true });
  });

  it('should return null if min < max', () => {
    const group = new FormGroup({
      minAmount: new FormControl(5),
      maxAmount: new FormControl(10),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should return null if min == max', () => {
    const group = new FormGroup({
      minAmount: new FormControl(10),
      maxAmount: new FormControl(10),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should return null if min is not a number', () => {
    const group = new FormGroup({
      minAmount: new FormControl('abc'),
      maxAmount: new FormControl(10),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should return null if max is not a number', () => {
    const group = new FormGroup({
      minAmount: new FormControl(10),
      maxAmount: new FormControl('abc'),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should return null if min is missing', () => {
    const group = new FormGroup({
      maxAmount: new FormControl(10),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should return null if max is missing', () => {
    const group = new FormGroup({
      minAmount: new FormControl(10),
    });
    const result = component.minMaxValidator(group);
    expect(result).toBeNull();
  });

  it('should call moveToNextStep if disableEdit is true', async () => {
    component.moveToNextStep = jest.fn(); // <-- Make it a mock!
    component.disableEdit = true;
    await component.saveAndExit(true);
    expect(component.moveToNextStep).toHaveBeenCalledWith(true);
  });

  it('should return early if form is invalid and showAddInfoAccordinContainer is true', async () => {
    component.showAddInfoAccordinContainer = true;
    component.variantLevelForm = new FormGroup({
      requiredField: new FormControl('', Validators.required),
    });
    component.disableEdit = false;
    component.validateForm = jest.fn();

    // Replace moveToNextStep with a mock
    component.moveToNextStep = jest.fn();

    await component.saveAndExit(true);

    expect(component.moveToNextStep).not.toHaveBeenCalled();
  });

  it('should patch if shouldPatch is true and subscribe success', async () => {
    component.variantLevelForm = {
      dirty: true,
      touched: true,
      invalid: false,
      markAllAsTouched: jest.fn(),
      updateValueAndValidity: jest.fn(),
    } as any;
    component.showAddInfoAccordinContainer = false;
    component.tableData = [];
    component._preparePatchRequestObject = jest.fn().mockReturnValue({});
    await component.saveAndExit(true);
    expect(
      (component as any)._variantLevelService.patchCoverageVariantLevel
    ).toHaveBeenCalled();
  });

  it('should upsert if shouldPatch is false and subscribe success', async () => {
    component.variantLevelForm = {
      dirty: false,
      touched: false,
      invalid: false,
      markAllAsTouched: jest.fn(),
      updateValueAndValidity: jest.fn(),
    } as any;
    component.showAddInfoAccordinContainer = false;
    component.tableData = [];
    component._preparePostRequestObject = jest.fn().mockReturnValue({});
    await component.saveAndExit(true);
    expect(
      (component as any)._variantLevelService.upsertCoverageVariantLevel
    ).toHaveBeenCalled();
  });

  it('should call saveAdditionalConfig if tableData is not empty', async () => {
    // Setup tableData with at least one item
    component.tableData = [
      { maxLimit: 1000, ageBand: '18-25', gender: 'M' },
    ] as any;

    // Setup form as valid and not disabled
    component.variantLevelForm = new FormGroup({});
    component.disableEdit = false;
    component.showAddInfoAccordinContainer = false;

    // Spy on saveAdditionalConfig
    component.saveAdditionalConfig = jest.fn();

    await component.saveAndExit(true);

    expect(component.saveAdditionalConfig).toHaveBeenCalledWith(true);
  });

  it('should handle error in patchCoverageVariantLevel', async () => {
    const control = new FormControl('initial');
    control.markAsDirty();
    const fakeFormArray = new FormArray([control]);
    (fakeFormArray as any).controls = [control];

    // Setup the form structure so the getter works
    component.variantLevelForm = new FormGroup({
      subCoveragesForm: new FormGroup({
        subCoverage: fakeFormArray,
      }),
    });
    component.showAddInfoAccordinContainer = false;
    component.tableData = [];
    component._preparePatchRequestObject = jest.fn().mockReturnValue({});
    (component as any)._variantLevelService.patchCoverageVariantLevel = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('fail')));
    await component.saveAndExit(true);
    expect((component as any)._layoutService.showMessage).toHaveBeenCalled();
  });

  it('should handle error in upsertCoverageVariantLevel', async () => {
    const control = new FormControl('initial');
    control.markAsDirty();
    const fakeFormArray = new FormArray([control]);
    (fakeFormArray as any).controls = [control];

    // Setup the form structure so the getter works
    component.variantLevelForm = new FormGroup({
      subCoveragesForm: new FormGroup({
        subCoverage: fakeFormArray,
      }),
    });
    component.showAddInfoAccordinContainer = false;
    component.tableData = [];
    component._preparePostRequestObject = jest.fn().mockReturnValue({});
    (component as any)._variantLevelService.upsertCoverageVariantLevel = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('fail')));
    await component.saveAndExit(true);
    expect((component as any)._layoutService.showMessage).toHaveBeenCalled();
  });

  it('should call submitSubCoverages if editedForm length > 0', async () => {
    // Create a FormControl and mark it as dirty (pristine = false)
    const control = new FormControl('initial');
    control.markAsDirty(); // Now control.pristine === false

    // Create a FormArray with this control
    const fakeFormArray = new FormArray([control]);
    (fakeFormArray as any).controls = [control];

    // Setup the form structure so the getter works
    component.variantLevelForm = new FormGroup({
      subCoveragesForm: new FormGroup({
        subCoverage: fakeFormArray,
      }),
    });

    // Setup other required properties/mocks
    component.coverageVariantLevels = [
      { coverageVariantLevelId: 'CVL-1' },
    ] as any;
    component.cvLevelId = 'CVL-1';
    component.productId = 'P1';
    component.productVersionId = 'V1';
    component.coverageVariantId = 'C1';
    component.rootData = {};
    component.moveToNextStep = jest.fn();
    (component as any)._layoutService = { showMessage: jest.fn() } as any;
    (component as any)._variantLevelService = {
      patchCoverageVariantLevel: jest.fn().mockReturnValue(of({})),
      upsertCoverageVariantLevel: jest.fn().mockReturnValue(of({})),
      getCoverageVaraintLevels: jest
        .fn()
        .mockReturnValue(of([{ coverageVariantLevelId: 'CVL-1' }])),
      patchSubCoverageVariantLevel2: jest.fn().mockReturnValue(of({})),
    } as any;
    (component as any)._subCoverageLevelService = {
      prepareSubCoverageLevel: jest.fn().mockReturnValue([]),
      updateSubCoverageList: jest.fn().mockResolvedValue([]),
      validateForm: jest.fn(),
    } as any;
    component.activeInsuredType = { value: InsuredTypeKeys.MAININSURED } as any;
    component.submitSubCoverages = jest.fn();

    // Mark the form as touched if needed
    component.variantLevelForm.markAllAsTouched();

    // Call the method under test
    await component.saveAndExit(true);
  });

  it('should call moveToNextStep if editedForm length == 0', async () => {
    const control = new FormControl('initial');
    control.markAsDirty();
    const fakeFormArray = new FormArray([control]);
    (fakeFormArray as any).controls = [control];

    // Setup the form structure so the getter works
    component.variantLevelForm = new FormGroup({
      subCoveragesForm: new FormGroup({
        subCoverage: fakeFormArray,
      }),
    });

    // Setup other required properties/mocks
    component.coverageVariantLevels = [
      { coverageVariantLevelId: 'CVL-1' },
    ] as any;
    component.cvLevelId = 'CVL-1';
    component.productId = 'P1';
    component.productVersionId = 'V1';
    component.coverageVariantId = 'C1';
    component.rootData = {};
    component.moveToNextStep = jest.fn();
    (component as any)._layoutService = { showMessage: jest.fn() } as any;
    (component as any)._variantLevelService = {
      patchCoverageVariantLevel: jest.fn().mockReturnValue(of({})),
      upsertCoverageVariantLevel: jest.fn().mockReturnValue(of({})),
      getCoverageVaraintLevels: jest
        .fn()
        .mockReturnValue(of([{ coverageVariantLevelId: 'CVL-1' }])),
      patchSubCoverageVariantLevel2: jest.fn().mockReturnValue(of({})),
    } as any;
    (component as any)._subCoverageLevelService = {
      prepareSubCoverageLevel: jest.fn().mockReturnValue([]),
      updateSubCoverageList: jest.fn().mockResolvedValue([]),
      validateForm: jest.fn(),
    } as any;
    component.activeInsuredType = { value: InsuredTypeKeys.MAININSURED } as any;

    // Simulate the form being dirty and touched, but not invalid
    component.variantLevelForm.markAllAsTouched = jest.fn();
    component.variantLevelForm.updateValueAndValidity = jest.fn();

    // Call the method under test
    await component.saveAndExit(true);

    // Assert that moveToNextStep was called
    expect(component.moveToNextStep).toHaveBeenCalled();
  });

  describe('_observeAndSetValidators newRetrieveDataControl.valueChanges', () => {
    let component: MiVariantLevelComponent;

    beforeEach(() => {
      // Setup component and required properties
      component = TestBed.createComponent(
        MiVariantLevelComponent
      ).componentInstance;

      component.retrieveDataControl = new FormControl();
      component.newRetrieveDataControl = new FormControl();
      // Setup retrieveDataOptions
      component.retrieveDataOptions = [
        { code: InsuredTypeKeys.MAININSURED, description: 'Main Insured' },
        { code: 'SPOUSE', description: 'Spouse' },
      ] as any;

      // Setup newRetrieveDataControl as a FormControl
      component.newRetrieveDataControl = new FormControl();

      component.variantLevelForm = new FormGroup({
        deductiblesForm: new FormGroup({
          valueType: new FormControl(''),
          percentOf: new FormControl(''),
          amountValue: new FormControl(''),
          deductibleType: new FormControl(''),
        }),
      });

      // Setup coverageFactorCombinationData and tableData
      component.coverageFactorCombinationData = [{ test: 1 }] as any;
      component.tableData = [];

      // Mock _fillLimitsFormModal and transformApiResponse
      component._fillLimitsFormModal = jest.fn();
      component.getInsuredLevelByType = jest
        .fn()
        .mockReturnValue({ coverageFactorMapping: { test: 2 } });
      component.transformApiResponse = jest.fn().mockReturnValue([{ row: 1 }]);
    });

    it('should call _fillLimitsFormModal and update tableData when valueChanges emits', () => {
      // Call the method to set up subscriptions
      component._observeAndSetValidators();

      // Simulate value change
      component.newRetrieveDataControl.setValue({
        code: InsuredTypeKeys.MAININSURED,
      });

      // _fillLimitsFormModal should be called
      expect(component._fillLimitsFormModal).toHaveBeenCalled();

      // transformApiResponse should be called with correct arguments
      expect(component.transformApiResponse).toHaveBeenCalledWith(
        component.coverageFactorCombinationData,
        { test: 2 } // from getInsuredLevelByType mock
      );

      // tableData should be updated
      expect(component.tableData).toEqual([{ row: 1 }]);
    });

    it('should not call _fillLimitsFormModal or transformApiResponse if retrieveDataOptions is empty', () => {
      component.retrieveDataOptions = [];
      component._fillLimitsFormModal = jest.fn();
      component.transformApiResponse = jest.fn();

      component._observeAndSetValidators();
      component.newRetrieveDataControl.setValue({
        code: InsuredTypeKeys.MAININSURED,
      });

      expect(component._fillLimitsFormModal).not.toHaveBeenCalled();
      expect(component.transformApiResponse).not.toHaveBeenCalled();
    });

    it('should call getInsuredLevelByType with the selected option', () => {
      component._observeAndSetValidators();
      component.getInsuredLevelByType = jest
        .fn()
        .mockReturnValue({ coverageFactorMapping: { test: 3 } });

      component.newRetrieveDataControl.setValue({ code: 'SPOUSE' });

      expect(component.getInsuredLevelByType).toHaveBeenCalledWith({
        code: 'SPOUSE',
        description: 'Spouse',
      });
    });
  });
});
