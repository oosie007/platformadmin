import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService, ComponentRegistry } from '@canvas/services';
import {
  mockData,
  mockLabels,
  mockListOptions,
} from 'apps/products/mock/mock-coverage-factors';
import { MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';
import { CoverageFactorsService } from '../../../services/coverage-factors.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { productContextResponse } from '../../../types/mockResponses';
import { CoverageFactorsComponent } from './coverage-factors.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { cloneDeep } from 'lodash-es';
import { CoverageFactorsEnum } from './model/coverage-factors.model';

describe('CoverageFactorsComponent', () => {
  let component: CoverageFactorsComponent;
  let fixture: ComponentFixture<CoverageFactorsComponent>;

  // Mocks
  let mockLayoutService: any;
  let mockSharedService: any;
  let mockProductsService: any;
  let mockAppContextService: any;
  let mockCoverageFactorsService: any;
  let mockProductContextService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockLayoutService = {
      showMessage: jest.fn(),
      updateBreadcrumbs: jest.fn(),
      caption$: new Subject<string>(), 
    };
    mockSharedService = {
      previousButtonClicked: { next: jest.fn() },
      nextButtonClicked: { next: jest.fn() },
    };
    mockProductsService = { getReferenceData: jest.fn() };
    mockAppContextService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key.endsWith('labels')) {
          return mockLabels;
        }
        if (key.endsWith('listOptions')) {
          return mockListOptions;
        }
        return {};
      }),
    };
    mockCoverageFactorsService = {
      getCoverageFactors: jest.fn().mockReturnValue(of(mockData)),
      createCoverageFactors: jest.fn().mockReturnValue(of(mockData)),
      updateCoverageFactors: jest.fn().mockReturnValue(of(mockData)),
    };
    mockProductContextService = {
      isProductDisabled: jest.fn(),
      _getProductContext: jest.fn(() => {
        return productContextResponse;
      }),
      _getCoverageVariantId: jest.fn(() => {
        return 'COV01';
      }),
      _getCoverageVariantName: jest.fn(() => 'Variant Name'),
    };
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [
        CoverageFactorsComponent,
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      providers: [
        FormBuilder,
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: AppContextService, useValue: mockAppContextService },
        {
          provide: CoverageFactorsService,
          useValue: mockCoverageFactorsService,
        },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: Router, useValue: mockRouter },
        MockProvider(ComponentRegistry),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverageFactorsComponent);
    component = fixture.componentInstance;

    component.ageForm = new FormBuilder().group({
      rows: new FormBuilder().array([]),
      isActive: [true],
    });
    component.genderForm = new FormBuilder().group({
      isActive: [false],
    });
    component.labels = {
      ageBand: 'Default Age',
      gender: 'Default Gender'
    } as any;
    // Default ProductContextService
    mockProductContextService.isProductDisabled.mockReturnValue(false);

    //fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize forms, set isReadOnly, fetch reference data, and subscribe to isActive', () => {
      const fetchSpy = jest.spyOn<any, any>(component, 'fetchReferenceData');
      const disableSpy = jest.spyOn<any, any>(component, 'disableAllRows');
      component.ngOnInit();
      expect(component.ageForm).toBeDefined();
      expect(component.genderForm).toBeDefined();
      expect(component.isReadOnly).toBe(false);
      expect(fetchSpy).toHaveBeenCalled();
      expect(disableSpy).toHaveBeenCalled();
    });
  });

  describe('Form Row Management', () => {
    it('should add a row', () => {
      const initial = component.rows.length;
      component.addRow();
      expect(component.rows.length).toBe(initial + 1);
    });

    it('should delete a row', () => {
      component.addRow();
      const initial = component.rows.length;
      component.deleteRow(0);
      expect(component.rows.length).toBe(initial - 1);
    });

    it('should disable all rows', () => {
      component.addRow();
      component.enableAllRows();
      component.disableAllRows();
      component.rows.controls.forEach((ctrl) => {
        expect(ctrl.disabled).toBe(true);
      });
    });

    it('should enable all rows', () => {
      component.addRow();
      component.disableAllRows();
      component.enableAllRows();
      component.rows.controls.forEach((ctrl) => {
        expect(ctrl.enabled).toBe(true);
      });
    });
  });

  describe('Data Prefill', () => {
    it('should prefill age form', () => {
      const ageCoverageFactor = {
        isActive: true,
        values: [{ start: 10, end: 20 }],
      };
      component.prefillAgeForm(ageCoverageFactor as any);
      expect(component.ageForm.get('isActive')?.value).toBe(true);
      expect(component.rows.length).toBe(1);
    });

    it('should prefill gender form', () => {
      component.genderData = [{ code: 'M' }, { code: 'F' }] as any;
      const genderCoverageFactor = {
        isActive: true,
        values: [{ value: 'M' }],
      };
      component.prefillGenderForm(genderCoverageFactor as any);
      expect(component.genderForm.get('isActive')?.value).toBe(true);
      expect(component.selectedRow.length).toBe(1);
    });

    it('should load age bands', () => {
      component.loadAgeBands([
        {
          start: 1,
          end: 2,
          valueId: undefined,
        },
        {
          start: 3,
          end: 4,
          valueId: undefined,
        },
      ]);
      expect(component.rows.length).toBe(2);
    });
  });

  describe('Event Handlers', () => {

    it('should call previous on previous()', () => {
      component.previous();
      expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith(
        { stepCount: 1 }
      );
    });

    it('should call handleSave and navigate on saveAndExit', () => {
      const saveSpy = jest.spyOn<any, any>(component, 'handleSave');
      component.saveAndExit();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should call handleSave and nextButtonClicked on saveAndNext', () => {
      const saveSpy = jest.spyOn<any, any>(component, 'handleSave');
      component.saveAndNext();
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('handleSave', () => {
    it('should call onSuccess if isReadOnly', () => {
      component.isReadOnly = true;
      const onSuccess = jest.fn();
      component['handleSave'](onSuccess);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call saveCoverageFactors if not readOnly', () => {
      component.isReadOnly = false;
      const saveSpy = jest.spyOn<any, any>(component, 'saveCoverageFactors');
      component['handleSave'](jest.fn());
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('saveCoverageFactors', () => {
    it('saveCoverageFactors', () => {
      component.ageForm = new FormBuilder().group({
        rows: new FormBuilder().array([component.createRow()]),
        isActive: [true],
      });
      component.genderForm = new FormBuilder().group({ isActive: [false] });
      component.coverageFactors = [];
      jest.spyOn(component.ageForm, 'markAllAsTouched');
      jest.spyOn(component.ageForm, 'invalid', 'get').mockReturnValue(false);
      jest.spyOn(component, 'prepareCoverageFactorPayload').mockReturnValue({
        coverageFactor: [],
        ageActive: true,
        genderActive: false,
        ageValues: [],
        genderValues: [],
      });
    });
  });

  describe('prepareCoverageFactorPayload', () => {
    it('should prepare payload with age and gender', () => {
      component.ageForm = new FormBuilder().group({
        rows: new FormBuilder().array([
          new FormBuilder().group({ start: [1], end: [2] }),
        ]),
        isActive: [true],
      });
      component.genderForm = new FormBuilder().group({ isActive: [true] });
      component.selectedGenderList = [{ code: 'M' }] as any;
      component.coverageFactors = [];
      jest.spyOn(component, 'prepareAgeValues').mockReturnValue({} as any);
      jest.spyOn(component, 'prepareCoverageFactor').mockReturnValue({} as any);
      jest.spyOn(component, 'prepareGenderValues').mockReturnValue({} as any);
      const result = component['prepareCoverageFactorPayload']();
      expect(result.coverageFactor.length).toBe(2);
    });
  });

  describe('getToastMessageConfig', () => {
    it('should return toast message config', () => {
      const config = component['getToastMessageConfig']();
      expect(config.success).toBeDefined();
      expect(config.error).toBeDefined();
    });
  });

  describe('Coverage Factor Helpers', () => {
    it('should prepare coverage factor', () => {
      component.coverageFactors = [
        { factorType: 'AGE', coverageFactorId: '1' } as any,
      ];
      const result = component.prepareCoverageFactor('AGE', 'RANGE', true, []);
      expect(result.coverageFactorId).toBe('1');
    });

    it('should prepare age values', () => {
      component.coverageFactors = [
        {
          factorType: 'AGE',
          values: [{ start: 1, end: 2, valueId: 'abc' }],
        } as any,
      ];
      const result = component.prepareAgeValues(1, 2);
      expect(result.valueId).toBe('abc');
    });

    it('should prepare gender values', () => {
      component.coverageFactors = [
        {
          factorType: 'GENDER',
          values: [{ value: 'M', valueId: 'xyz' }],
        } as any,
      ];
      const result = component.prepareGenderValues('M');
      expect(result.valueId).toBe('xyz');
    });

    it('should get coverage factor by type', () => {
      component.coverageFactors = [{ factorType: 'AGE' } as any];
      const result = component.getCoverageFactor('AGE');
      expect(result).toBeDefined();
    });
  });

  describe('ageRangesNoOverlapValidator', () => {
    it('should return null if less than 2 rows', () => {
      const form = new FormBuilder().group({
        rows: new FormBuilder().array([
          new FormBuilder().group({ start: [1], end: [2] }),
        ]),
      });
      expect(component.ageRangesNoOverlapValidator(form)).toBeNull();
    });

    it('should return null if no overlap', () => {
      const form = new FormBuilder().group({
        rows: new FormBuilder().array([
          new FormBuilder().group({ start: [1], end: [2] }),
          new FormBuilder().group({ start: [3], end: [4] }),
        ]),
      });
      expect(component.ageRangesNoOverlapValidator(form)).toBeNull();
    });

    it('should return { ageOverlap: true } if overlap', () => {
      const form = new FormBuilder().group({
        rows: new FormBuilder().array([
          new FormBuilder().group({ start: [1], end: [3] }),
          new FormBuilder().group({ start: [2], end: [4] }),
        ]),
      });
      expect(component.ageRangesNoOverlapValidator(form)).toEqual({
        ageOverlap: true,
      });
    });

    it('should ignore invalid ranges', () => {
      const form = new FormBuilder().group({
        rows: new FormBuilder().array([
          new FormBuilder().group({ start: [null], end: [null] }),
          new FormBuilder().group({ start: [3], end: [4] }),
        ]),
      });
      expect(component.ageRangesNoOverlapValidator(form)).toBeNull();
    });

    it('should call checkGenderRowCoverageMappingExists with the event', () => {
      component.checkGenderRowCoverageMappingExists = jest.fn();
      const event = [{ code: 'M' }, { code: 'F' }] as any; 
      component.checkboxChecked(event);
      expect(component.checkGenderRowCoverageMappingExists).toHaveBeenCalledWith(event);
    });
  });

  
  it('should set isActive to true and enable all rows if isActive is true', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Mock getAgeRowsValueIds and valueIdExists
    (component as any).getAgeRowsValueIds = jest.fn();
    component.valueIdExists = jest.fn();
    // Mock openPendingAction
    (component as any).openPendingAction = jest.fn();
    component.checkAllRowsCoverageMappingExists(true);
    expect(component.ageForm.get).toHaveBeenCalledWith('isActive');
    expect(component.ageForm.get('isActive')?.setValue).toHaveBeenCalledWith(true, { emitEvent: false });
    expect(component.enableAllRows).toHaveBeenCalled();
  });

  it('should call openPendingAction if any valueId exists when isActive is false', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Mock getAgeRowsValueIds and valueIdExists
    (component as any).getAgeRowsValueIds = jest.fn();
    component.valueIdExists = jest.fn();
    // Mock openPendingAction
    (component as any).openPendingAction = jest.fn();
    (component as any).getAgeRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockImplementation((id: string, type: any) => id === 'id1');
    component.checkAllRowsCoverageMappingExists(false);
    expect((component as any).getAgeRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'AGE');
    expect((component as any).openPendingAction).toHaveBeenCalledWith('toggleAge', false);
    expect(component.ageForm.get('isActive')?.setValue).not.toHaveBeenCalledWith(false, { emitEvent: false });
    expect(component.disableAllRows).not.toHaveBeenCalled();
  });

  it('should set isActive to false and disable all rows if no valueId exists when isActive is false', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Mock getAgeRowsValueIds and valueIdExists
    (component as any).getAgeRowsValueIds = jest.fn();
    component.valueIdExists = jest.fn();
    // Mock openPendingAction
    (component as any).openPendingAction = jest.fn();
    (component as any).getAgeRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockReturnValue(false);
    component.checkAllRowsCoverageMappingExists(false);
    expect((component as any).getAgeRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'AGE');
    expect(component.valueIdExists).toHaveBeenCalledWith('id2', 'AGE');
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
    expect(component.ageForm.get('isActive')?.setValue).toHaveBeenCalledWith(false, { emitEvent: false });
    expect(component.disableAllRows).toHaveBeenCalled();
  });

  it('should handle toggleAge action', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Set up selectedRow and genderData
    component.selectedRow = [{ code: 'M' }];
    component.genderData = [{ code: 'F' }];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'toggleAge', payload: true };
    component.handleConfirmationModal();
    expect(component.ageForm.get).toHaveBeenCalledWith('isActive');
    expect(component.ageForm.get('isActive')?.setValue).toHaveBeenCalledWith(false, { emitEvent: false });
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle toggleGender action', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Set up selectedRow and genderData
    component.selectedRow = [{ code: 'M' }];
    component.genderData = [{ code: 'F' }];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'toggleGender', payload: false };
    component.handleConfirmationModal();
    expect(component.genderForm.get).toHaveBeenCalledWith('isActive');
    expect(component.genderForm.get('isActive')?.setValue).toHaveBeenCalledWith(true, { emitEvent: false });
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle unCheckGender action', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Set up selectedRow and genderData
    component.selectedRow = [{ code: 'M' }];
    component.genderData = [{ code: 'F' }];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'unCheckGender', payload: null };
    const originalSelectedRow = component.selectedRow;
    const originalGenderData = component.genderData;
    component.handleConfirmationModal();
    expect(component.selectedRow).toEqual(cloneDeep(originalSelectedRow));
    expect(component.genderData).toEqual(cloneDeep(originalGenderData));
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should do nothing if pendingAction is null except close modal and clear pendingAction', () => {
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Set up selectedRow and genderData
    component.selectedRow = [{ code: 'M' }];
    component.genderData = [{ code: 'F' }];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.openConfirmationModal = true;
    component.handleConfirmationModal();
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
    // No calls to setValue
    expect(component.ageForm.get('isActive')?.setValue).not.toHaveBeenCalled();
    expect(component.genderForm.get('isActive')?.setValue).not.toHaveBeenCalled();
  });

  it('should handle deleteRow action', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'deleteRow', payload: 2 };
    component.modalConfirmation();
    expect(component.rows.removeAt).toHaveBeenCalledWith(2);
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle toggleAge action and enable rows', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'toggleAge', payload: true };
    component.modalConfirmation();
    expect(component.ageForm.get).toHaveBeenCalledWith('isActive');
    expect(component.ageForm.get('isActive')?.setValue).toHaveBeenCalledWith(true, { emitEvent: false });
    expect(component.enableAllRows).toHaveBeenCalled();
    expect(component.disableAllRows).not.toHaveBeenCalled();
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle toggleAge action and disable rows', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'toggleAge', payload: false };
    component.modalConfirmation();
    expect(component.ageForm.get).toHaveBeenCalledWith('isActive');
    expect(component.ageForm.get('isActive')?.setValue).toHaveBeenCalledWith(false, { emitEvent: false });
    expect(component.disableAllRows).toHaveBeenCalled();
    expect(component.enableAllRows).not.toHaveBeenCalled();
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle toggleGender action', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.pendingAction = { type: 'toggleGender', payload: true };
    component.modalConfirmation();
    expect(component.genderForm.get).toHaveBeenCalledWith('isActive');
    expect(component.genderForm.get('isActive')?.setValue).toHaveBeenCalledWith(true, { emitEvent: false });
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should handle unCheckGender action', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    const payload = [{ code: 'M' }, { code: 'F' }];
    component.pendingAction = { type: 'unCheckGender', payload };
    component.modalConfirmation();
    expect(component.selectedGenderList).toBe(payload);
    expect(component.loadedTableData).toBe(payload);
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
  });

  it('should do nothing if pendingAction is null except close modal and clear pendingAction', () => {
    jest.spyOn(component as any, 'rows', 'get').mockReturnValue({
      removeAt: jest.fn(),
    });
    // Mock forms
    component.ageForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock enable/disable methods
    component.enableAllRows = jest.fn();
    component.disableAllRows = jest.fn();
    // Set up selectedGenderList and loadedTableData
    component.selectedGenderList = [];
    component.loadedTableData = [];
    // Set modal and pendingAction defaults
    component.openConfirmationModal = true;
    component.pendingAction = null;
    component.openConfirmationModal = true;
    component.modalConfirmation();
    expect(component.openConfirmationModal).toBe(false);
    expect(component.pendingAction).toBeNull();
    // No calls to setValue or removeAt
    expect(component.ageForm.get('isActive')?.setValue).not.toHaveBeenCalled();
    expect(component.genderForm.get('isActive')?.setValue).not.toHaveBeenCalled();
    expect(component.rows.removeAt).not.toHaveBeenCalled();
  });

  it('should set selectedGenderList and selectedRow if no missing items', () => {
    component.loadedTableData = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.selectedGenderList = [];
    component.selectedRow = [];
    // Mock getCoverageFactor
    component.getCoverageFactor = jest.fn();
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    const data = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.checkGenderRowCoverageMappingExists(data);
    expect(component.selectedGenderList).toBe(data);
    expect(component.selectedRow).toEqual(cloneDeep(data));
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
  });

  it('should set selectedGenderList if one missing item and valueId does not exist', () => {
    component.loadedTableData = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.selectedGenderList = [];
    component.selectedRow = [];
    // Mock getCoverageFactor
    component.getCoverageFactor = jest.fn();
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    const data = [
      { id: '1', code: 'M' }
    ];
    (component as any).getCoverageFactor.mockReturnValue({
      values: [{ value: 'F', valueId: 'xyz' }]
    });
    (component as any).valueIdExists.mockReturnValue(false);
    component.checkGenderRowCoverageMappingExists(data);
    expect(component.selectedGenderList).toBe(data);
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
  });

  it('should call openPendingAction if one missing item and valueId exists', () => {
    component.loadedTableData = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.selectedGenderList = [];
    component.selectedRow = [];
    // Mock getCoverageFactor
    component.getCoverageFactor = jest.fn();
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    const data = [
      { id: '1', code: 'M' }
    ];
    (component as any).getCoverageFactor.mockReturnValue({
      values: [{ value: 'F', valueId: 'xyz' }]
    });
    (component as any).valueIdExists.mockReturnValue(true);
    component.checkGenderRowCoverageMappingExists(data);
    expect((component as any).openPendingAction).toHaveBeenCalledWith('unCheckGender', data);
    expect(component.selectedGenderList).not.toBe(data);
  });

  it('should call openPendingAction if multiple missing items and any valueId exists', () => {
    component.loadedTableData = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.selectedGenderList = [];
    component.selectedRow = [];
    // Mock getCoverageFactor
    component.getCoverageFactor = jest.fn();
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    const data: any[] = []; // both missing
    (component as any).getGenderRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockImplementation((id: string, type: any) => id === 'id1');
    component.checkGenderRowCoverageMappingExists(data);
    expect((component as any).getGenderRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'GENDER');
    expect((component as any).openPendingAction).toHaveBeenCalledWith('unCheckGender', data);
    expect(component.selectedGenderList).not.toBe(data);
  });

  it('should set selectedGenderList if multiple missing items and no valueId exists', () => {
    component.loadedTableData = [
      { id: '1', code: 'M' },
      { id: '2', code: 'F' }
    ];
    component.selectedGenderList = [];
    component.selectedRow = [];
    // Mock getCoverageFactor
    component.getCoverageFactor = jest.fn();
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    const data: any[] = []; // both missing
    (component as any).getGenderRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockReturnValue(false);
    component.checkGenderRowCoverageMappingExists(data);
    expect((component as any).getGenderRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'GENDER');
    expect(component.valueIdExists).toHaveBeenCalledWith('id2', 'GENDER');
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
    expect(component.selectedGenderList).toBe(data);
  });

  it('should set isActive to true if isActive is true', () => {
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    component.checkAllGenderRowCoverageMappingExists(true);
    expect(component.genderForm.get).toHaveBeenCalledWith('isActive');
    expect(component.genderForm.get('isActive')?.setValue).toHaveBeenCalledWith(true, { emitEvent: false });
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
  });

  it('should call openPendingAction if any valueId exists when isActive is false', () => {
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    (component as any).getGenderRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockImplementation((id: string, type: any) => id === 'id1');
    component.checkAllGenderRowCoverageMappingExists(false);
    expect((component as any).getGenderRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'GENDER');
    expect((component as any).openPendingAction).toHaveBeenCalledWith('toggleGender', false);
    expect(component.genderForm.get('isActive')?.setValue).not.toHaveBeenCalledWith(false, { emitEvent: false });
  });

  it('should do nothing if no valueId exists when isActive is false', () => {
    component.genderForm = {
      get: jest.fn().mockReturnValue({ setValue: jest.fn() }),
    } as any;
    // Mock valueIdExists and openPendingAction
    component.valueIdExists = jest.fn();
    (component as any).openPendingAction = jest.fn();
    // Mock getGenderRowsValueIds
    (component as any).getGenderRowsValueIds = jest.fn();
    (component as any).getGenderRowsValueIds.mockReturnValue(['id1', 'id2']);
    (component as any).valueIdExists.mockReturnValue(false);
    component.checkAllGenderRowCoverageMappingExists(false);
    expect((component as any).getGenderRowsValueIds).toHaveBeenCalled();
    expect(component.valueIdExists).toHaveBeenCalledWith('id1', 'GENDER');
    expect(component.valueIdExists).toHaveBeenCalledWith('id2', 'GENDER');
    expect((component as any).openPendingAction).not.toHaveBeenCalled();
    expect(component.genderForm.get('isActive')?.setValue).not.toHaveBeenCalledWith(false, { emitEvent: false });
  });

  it('should return undefined if coverageVariantData is null', () => {
    const result = component.valueIdExists('abc', 'AGE');
    expect(result).toBeUndefined();
  });

  it('should return true if valueId and factorType exist in nested structure', () => {
    component.coverageVariantData = {
      coverageVariantLevels: [
        {
          insuredLevel: [
            {
              coverageFactorMapping: {
                coverageFactorCombinations: [
                  {
                    factorSet: [
                      { valueId: 'abc', factorType: 'AGE' },
                      { valueId: 'xyz', factorType: 'GENDER' }
                    ],
                    limit: undefined as any,
                    deductible: undefined as any,
                    duration: undefined as any
                  }
                ]
              } 
            }
          ]
        }
      ]
    } as any;
    const result = component.valueIdExists('abc', 'AGE');
    expect(result).toBe(true);
  });

  it('should return false if valueId and factorType do not exist', () => {
    component.coverageVariantData = {
      coverageVariantLevels: [
        {
          insuredLevel: [
            {
              coverageFactorMapping: {
                coverageFactorCombinations: [
                  {
                    factorSet: [
                      { valueId: 'xyz', factorType: 'GENDER' }
                    ],
                    limit: null as any,
                    deductible: undefined as any,
                    duration: undefined as any
                  }
                ]
              }
            }
          ]
        }
      ]
    } as any;
    const result = component.valueIdExists('abc', 'AGE');
    expect(result).toBe(false);
  });

  it('should return false if any nested array is missing', () => {
    component.coverageVariantData = {
      coverageVariantLevels: [
        {
          insuredLevel: [
            {
              coverageFactorMapping: {
                coverageFactorCombinations: [
                  {
                    limit: undefined as any,
                    deductible: undefined as any,
                    duration: undefined as any,
                    factorSet: []
                  }
                ]
              }
            }
          ]
        }
      ]
    } as any;
    const result = component.valueIdExists('abc', 'AGE');
    expect(result).toBe(false);
  });

  it('should set pendingAction and openConfirmationModal for deleteRow', () => {
    (component as any).openPendingAction('deleteRow', 3);
    expect(component.pendingAction).toEqual({ type: 'deleteRow', payload: 3 });
    expect(component.openConfirmationModal).toBe(true);
  });

  it('should set pendingAction and openConfirmationModal for toggleAge', () => {
    (component as any).openPendingAction('toggleAge', true);
    expect(component.pendingAction).toEqual({ type: 'toggleAge', payload: true });
    expect(component.openConfirmationModal).toBe(true);
  });

  it('should set pendingAction and openConfirmationModal for toggleGender', () => {
    (component as any).openPendingAction('toggleGender', false);
    expect(component.pendingAction).toEqual({ type: 'toggleGender', payload: false });
    expect(component.openConfirmationModal).toBe(true);
  });

  it('should set pendingAction and openConfirmationModal for unCheckGender', () => {
    const payload = [{ code: 'M' }];
    (component as any).openPendingAction('unCheckGender', payload);
    expect(component.pendingAction).toEqual({ type: 'unCheckGender', payload });
    expect(component.openConfirmationModal).toBe(true);
  });

  it('should set pendingAction with undefined payload if not provided', () => {
    (component as any).openPendingAction('toggleAge');
    expect(component.pendingAction).toEqual({ type: 'toggleAge', payload: undefined });
    expect(component.openConfirmationModal).toBe(true);
  });

  it('should return correct valueIds when matches exist', () => {
    component.loadedTableData = [
      { code: 'M' },
      { code: 'F' },
      { code: 'X' }
    ];
    component.getCoverageFactor = jest.fn().mockReturnValue({
      values: [
        { value: 'M', valueId: 'id1' },
        { value: 'F', valueId: 'id2' }
      ]
    });

    const result = (component as any).getGenderRowsValueIds();
    expect(result).toEqual(['id1', 'id2']);
  });

  it('should return empty array if no matches found', () => {
    component.loadedTableData = [
      { code: 'A' },
      { code: 'B' }
    ];
    component.getCoverageFactor = jest.fn().mockReturnValue({
      values: [
        { value: 'M', valueId: 'id1' }
      ]
    });

    const result = (component as any).getGenderRowsValueIds();
    expect(result).toEqual([]);
  });

  it('should return empty array if loadedTableData is undefined', () => {
    component.loadedTableData = undefined;
    component.getCoverageFactor = jest.fn();

    const result = (component as any).getGenderRowsValueIds();
    expect(result).toEqual([]);
  });

  it('should filter out undefined valueIds', () => {
    component.loadedTableData = [
      { code: 'M' },
      { code: 'F' }
    ];
    component.getCoverageFactor = jest.fn().mockReturnValue({
      values: [
        { value: 'M', valueId: 'id1' },
        { value: 'F' } // valueId missing
      ]
    });

    const result = (component as any).getGenderRowsValueIds();
    expect(result).toEqual(['id1']);
  });

  it('should call checkAllRowsCoverageMappingExists when ageForm isActive changes and is dirty', () => {
    component.ageForm = new FormGroup({
      isActive: new FormControl(false)
    });
    component.genderForm = new FormGroup({
      isActive: new FormControl(false)
    });
    jest.spyOn(component, 'checkAllRowsCoverageMappingExists');
    jest.spyOn(component, 'checkAllGenderRowCoverageMappingExists');
    (component as any).setupFormListeners();

    // Simulate dirty and value change
    component.ageForm.get('isActive')!.markAsDirty();
    component.ageForm.get('isActive')!.setValue(true);

    expect(component.checkAllRowsCoverageMappingExists).toHaveBeenCalledWith(true);
  });

  it('should not call checkAllRowsCoverageMappingExists if ageForm isActive is not dirty', () => {
    component.ageForm = new FormGroup({
      isActive: new FormControl(false)
    });
    component.genderForm = new FormGroup({
      isActive: new FormControl(false)
    });
    jest.spyOn(component, 'checkAllRowsCoverageMappingExists');
    jest.spyOn(component, 'checkAllGenderRowCoverageMappingExists');
    (component as any).setupFormListeners();

    // Simulate value change without dirty
    component.ageForm.get('isActive')!.setValue(true);

    expect(component.checkAllRowsCoverageMappingExists).not.toHaveBeenCalled();
  });

  it('should call checkAllGenderRowCoverageMappingExists when genderForm isActive changes and is dirty', () => {
    component.ageForm = new FormGroup({
      isActive: new FormControl(false)
    });
    component.genderForm = new FormGroup({
      isActive: new FormControl(false)
    });
    jest.spyOn(component, 'checkAllRowsCoverageMappingExists');
    jest.spyOn(component, 'checkAllGenderRowCoverageMappingExists');
    (component as any).setupFormListeners();

    // Simulate dirty and value change
    component.genderForm.get('isActive')!.markAsDirty();
    component.genderForm.get('isActive')!.setValue(true);

    expect(component.checkAllGenderRowCoverageMappingExists).toHaveBeenCalledWith(true);
  });

  it('should not call checkAllGenderRowCoverageMappingExists if genderForm isActive is not dirty', () => {
    component.ageForm = new FormGroup({
      isActive: new FormControl(false)
    });
    component.genderForm = new FormGroup({
      isActive: new FormControl(false)
    });
    jest.spyOn(component, 'checkAllRowsCoverageMappingExists');
    jest.spyOn(component, 'checkAllGenderRowCoverageMappingExists');
    (component as any).setupFormListeners();

    // Simulate value change without dirty
    component.genderForm.get('isActive')!.setValue(true);

    expect(component.checkAllGenderRowCoverageMappingExists).not.toHaveBeenCalled();
  });

  it('should update ageBand label if AGE code is present', () => {
    component.coverageFactorRefData = [
      { code: CoverageFactorsEnum.AGE, description: 'Age Band Label' }
    ];

    (component as any).updateLabelsFromRefData();

    expect(component.labels.ageBand).toBe('Age Band Label');
    expect(component.labels.gender).toBe('Default Gender');
  });

  it('should update gender label if GENDER code is present', () => {
    component.coverageFactorRefData = [
      { code: CoverageFactorsEnum.GENDER, description: 'Gender Label' }
    ];

    (component as any).updateLabelsFromRefData();

    expect(component.labels.gender).toBe('Gender Label');
    expect(component.labels.ageBand).toBe('Default Age');
  });

  it('should update both labels if both codes are present', () => {
    component.coverageFactorRefData = [
      { code: CoverageFactorsEnum.AGE, description: 'Age Band Label' },
      { code: CoverageFactorsEnum.GENDER, description: 'Gender Label' }
    ];

    (component as any).updateLabelsFromRefData();

    expect(component.labels.ageBand).toBe('Age Band Label');
    expect(component.labels.gender).toBe('Gender Label');
  });

  it('should not update labels if description is undefined', () => {
    component.coverageFactorRefData = [
      { code: CoverageFactorsEnum.AGE },
      { code: CoverageFactorsEnum.GENDER }
    ];

    (component as any).updateLabelsFromRefData();

    expect(component.labels.ageBand).toBe('Default Age');
    expect(component.labels.gender).toBe('Default Gender');
  });

  it('should not update labels if code is not AGE or GENDER', () => {
    component.coverageFactorRefData = [
      { code: 'OTHER', description: 'Other Label' }
    ];

    (component as any).updateLabelsFromRefData();

    expect(component.labels.ageBand).toBe('Default Age');
    expect(component.labels.gender).toBe('Default Gender');
  });
});
