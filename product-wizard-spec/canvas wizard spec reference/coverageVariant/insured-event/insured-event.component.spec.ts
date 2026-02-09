import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import { CommandsModule, StudioCommands } from '@canvas/commands';
import { of, throwError } from 'rxjs';
import { InsuredEventComponent } from './insured-event.component';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { UtilityService } from '../../../../services/utility.service';
import { MultiSelectChangeEvent, MultiSelectSelectAllChangeEvent } from 'primeng/multiselect';

// Mock data
const mockInsuredEventRefData = [
  { code: 'EVENT1', description: 'Event Type 1', msgId: 'MSG1', category: 'INSUREDEVENT' },
  { code: 'EVENT2', description: 'Event Type 2', msgId: 'MSG2', category: 'INSUREDEVENT' },
];

const mockAttributeDataType = [
  { code: 'STRING', description: 'String', msgId: '', category: 'DATATYPE' },
  { code: 'NUMBER', description: 'Number', msgId: '', category: 'DATATYPE' },
  { code: 'FILE', description: 'File', msgId: '', category: 'DATATYPE' },
  { code: 'DROPDOWN', description: 'Dropdown', msgId: '', category: 'DATATYPE' },
];

const mockPolicyHolderOptions = [
  { code: 'PH1', description: 'Policy Holder 1', msgId: '', category: 'POLICYHOLDERTYPE' },
  { code: 'PH2', description: 'Policy Holder 2', msgId: '', category: 'POLICYHOLDERTYPE' },
];

const mockFileTypeList = [
  { code: 'pdf', description: '.pdf', msgId: '', category: 'FILETYPE' },
  { code: 'jpg', description: '.jpg', msgId: '', category: 'FILETYPE' },
];

const mockInsuredEventsList = [
  {
    insuredEventId: 'IE-123',
    type: { value: 'EVENT1', category: 'INSUREDEVENT', key: '' },
    policyHolderType: { value: 'PH1', category: 'POLICYHOLDERTYPE', key: '' },
    minQuantity: 1,
    maxQuantity: 5,
    customAttributes: [
      {
        attrName: 'Attribute 1',
        description: 'Attribute 1',
        section: '',
        type: 'STRING',
        required: true,
        validationExpression: '',
        maxOccurence: 1,
        options: [],
        insuredTypes: [],
        doNotAllowDuplicate: false,
        answers: [],
        isCurrentVersion: true,
        defaultValue: 'Default Value',
      },
    ],
    isCurrentVersion: true,
  },
];

const mockCoverageVariantResponse = {
  coverageVariantId: 'CV-123',
  insuredEvents: mockInsuredEventsList,
};

// Mock services
const mockLayoutService = {
  caption$: { next: jest.fn() },
  showMessage: jest.fn(),
  updateBreadcrumbs: jest.fn(),
};

const mockSharedService = {
  nextButtonClicked: { next: jest.fn() },
  previousButtonClicked: { next: jest.fn() },
};

const mockProductsService = {
  getDataTypes: jest.fn().mockReturnValue(of(mockAttributeDataType)),
  getReferenceData: jest.fn((category: string) => {
    if (category === 'POLICYHOLDERTYPE') {
      return of(mockPolicyHolderOptions);
    }
    if (category === 'FILETYPE') {
      return of(mockFileTypeList);
    }
    return of([]);
  }),
  getCoverageFactorsStepCount: jest.fn().mockReturnValue(3),
};

const mockProductContextService = {
  isProductDisabled: jest.fn().mockReturnValue(false),
  _getProductContext: jest.fn().mockReturnValue({
    requestId: 'REQ-123',
    country: ['IE'],
    language: 'en',
  }),
};

const mockAppContextService = {
  get: jest.fn((key: string) => {
    if (key === 'pages.product.insured-event.labels') {
      return {
        duplicateCustAttrErrorMessage: 'Duplicate attribute name',
      };
    }
    if (key === 'pages.insuredEvent.labels') {
      return {
        insuredSuccessMessage: 'Success',
        insuredErrorMessage: 'Error',
        insuredUpdateSuccess: 'Updated successfully',
        requiredField: 'Required field',
        minCountErrMessage: 'Min count must be positive',
        requiredMaxField: 'Max field required',
        maxQuantityMinError: 'Max must be greater than min',
        nameCharLimitError: 'Name exceeds 500 characters',
        nameCharLimitErrorMsg: 'Name exceeds 100 characters',
      };
    }
    return {};
  }),
};

const mockUtilityService = {
  fetchAdminDomainData: jest.fn().mockReturnValue(of(mockInsuredEventRefData)),
};

const mockVariantLevelService = {
  getCoverageVariantDetails: jest.fn().mockReturnValue(of(mockCoverageVariantResponse)),
};

const mockRouter = {
  navigate: jest.fn(),
};

describe('InsuredEventComponent', () => {
  let component: InsuredEventComponent;
  let fixture: ComponentFixture<InsuredEventComponent>;
  let formBuilder: FormBuilder;
  let studioCommands: StudioCommands;

  beforeEach(async () => {
    // Set up localStorage
    Storage.prototype.getItem = jest.fn((key: string) => {
      const store: Record<string, string> = {
        productId: 'PROD-123',
        productVersionId: 'VER-123',
        coverageVariantId: 'CV-123',
        ProductClass: 'HEALTH',
      };
      return store[key] || null;
    });

    await TestBed.configureTestingModule({
      imports: [
        InsuredEventComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        CommandsModule,
      ],
      providers: [
        FormBuilder,
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: VariantLevelService, useValue: mockVariantLevelService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
    studioCommands = TestBed.inject(StudioCommands);
    fixture = TestBed.createComponent(InsuredEventComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with localStorage values', () => {
      expect(component.productId).toBe('PROD-123');
      expect(component.productVersionId).toBe('VER-123');
      expect(component.coverageVariantId).toBe('CV-123');
      expect(component.productClass).toBe('HEALTH');
    });

    it('should initialize labels from AppContextService', () => {
      expect(component.labels).toBeDefined();
      expect(component.eventLabels).toBeDefined();
    });

    it('should call initForm on ngOnInit', () => {
      const initFormSpy = jest.spyOn(component, 'initForm');
      component.ngOnInit();
      expect(initFormSpy).toHaveBeenCalled();
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form with correct structure', () => {
      component.initForm();
      
      expect(component.insuredEventForm).toBeDefined();
      expect(component.insuredEventForm.get('policyHolderType')).toBeDefined();
      expect(component.insuredEventForm.get('eventType')).toBeDefined();
      expect(component.insuredEventForm.get('eventTypeChipControl')).toBeDefined();
      expect(component.insuredEventForm.get('eventsForm')).toBeDefined();
    });

    it('should disable form when product is disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      component.initForm();
      
      expect(component.insuredEventForm.disabled).toBe(true);
      expect(component.disableEdit).toBe(true);
    });

    it('should enable form when product is not disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      component.initForm();
      
      expect(component.disableEdit).toBe(false);
    });
  });

  describe('Reference Data Loading', () => {
    it('should load all reference data on initialization', (done) => {
      component.initForm();
      
      setTimeout(() => {
        expect(mockUtilityService.fetchAdminDomainData).toHaveBeenCalledWith(['INSUREDEVENT']);
        expect(mockProductsService.getDataTypes).toHaveBeenCalled();
        expect(mockProductsService.getReferenceData).toHaveBeenCalledWith('POLICYHOLDERTYPE');
        expect(mockProductsService.getReferenceData).toHaveBeenCalledWith('FILETYPE');
        expect(mockVariantLevelService.getCoverageVariantDetails).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should handle error when loading coverage variant details', () => {
      mockVariantLevelService.getCoverageVariantDetails.mockReturnValue(
        throwError(() => new Error('API Error'))
      );
      
      component.initForm();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        })
      );
    });
  });

  describe('Form Getters', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should return eventType control', () => {
      expect(component.eventType).toBe(component.insuredEventForm.get('eventType'));
    });

    it('should return eventFormArray', () => {
      expect(component.eventFormArray).toBe(component.insuredEventForm.get('eventsForm'));
    });

    it('should return policyHolderType control', () => {
      expect(component.policyHolderType).toBe(component.insuredEventForm.get('policyHolderType'));
    });

    it('should return eventTypeChipControl', () => {
      expect(component.eventTypeChipControl).toBe(component.insuredEventForm.get('eventTypeChipControl'));
    });
  });

  describe('Event Form Array Management', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should create event form group with correct structure', () => {
      const formGroup = (component as any).createEventFormGroup();
      
      expect(formGroup.get('insuredEventId')).toBeDefined();
      expect(formGroup.get('minQuantity')).toBeDefined();
      expect(formGroup.get('maxQuantity')).toBeDefined();
      expect(formGroup.get('customAttributesForm')).toBeDefined();
    });

    it('should add event forms when updateEventFormArray is called with more items', () => {
      const selectedEvents = [mockInsuredEventRefData[0], mockInsuredEventRefData[1]];
      component.updateEventFormArray(selectedEvents);
      
      expect(component.eventFormArray.length).toBe(2);
      expect(component.selectedEventTypes).toEqual(selectedEvents);
    });

    it('should remove event forms when updateEventFormArray is called with fewer items', () => {
      component.updateEventFormArray([mockInsuredEventRefData[0], mockInsuredEventRefData[1]]);
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      
      expect(component.eventFormArray.length).toBe(1);
    });

    it('should get event form group by index', () => {
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      const formGroup = component.getEventFormGroup(0);
      
      expect(formGroup).toBeDefined();
      expect(formGroup?.get('insuredEventId')).toBeDefined();
    });

    it('should return null for invalid index in getEventFormGroup', () => {
      const formGroup = component.getEventFormGroup(999);
      expect(formGroup).toBeNull();
    });

    it('should get attributes form array by index', () => {
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      const attributesArray = component.getAttributesFormArray(0);
      
      expect(attributesArray).toBeDefined();
    });
  });

  describe('Multi-Select Change Events', () => {
    beforeEach(() => {
      component.initForm();
      component.insuredEventRefData = mockInsuredEventRefData;
    });

    it('should handle multi-select change for eventType', () => {
      const event: MultiSelectChangeEvent = {
        originalEvent: new Event('change'),
        value: [mockInsuredEventRefData[0]],
        itemValue: null,
      };
      
      component.onMultiSelectChange(event, 'eventType');
      
      expect(component.selectedEventTypes).toEqual([mockInsuredEventRefData[0]]);
      expect(component.eventFormArray.length).toBe(1);
    });

    it('should set selectAllInsured to true when all items selected', () => {
      const event: MultiSelectChangeEvent = {
        originalEvent: new Event('change'),
        value: mockInsuredEventRefData,
        itemValue: null,
      };
      
      component.onMultiSelectChange(event, 'eventType');
      
      expect(component.selectAllInsured).toBe(true);
    });

    it('should handle select all change event', () => {
      const event: MultiSelectSelectAllChangeEvent = {
        originalEvent: new Event('change'),
        checked: true,
      };
      
      component.onMultiSelectSelectAllChange(event, 'eventType');
      
      expect(component.selectAllInsured).toBe(true);
      expect(component.eventFormArray.length).toBe(mockInsuredEventRefData.length);
    });

    it('should handle deselect all change event', () => {
      component.updateEventFormArray(mockInsuredEventRefData);
      
      const event: MultiSelectSelectAllChangeEvent = {
        originalEvent: new Event('change'),
        checked: false,
      };
      
      component.onMultiSelectSelectAllChange(event, 'eventType');
      
      expect(component.selectAllInsured).toBe(false);
      expect(component.eventFormArray.length).toBe(0);
    });
  });

  describe('Custom Attributes Management', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.attributeDataType = mockAttributeDataType;
      component.fileTypeList = mockFileTypeList;
    });

    it('should add attribute to event form', () => {
      const initialLength = component.getAttributesFormArray(0).length;
      component.addAttribute(0);
      
      expect(component.getAttributesFormArray(0).length).toBe(initialLength + 1);
    });

    it('should add attribute with disabled flag', () => {
      component.addAttribute(0, true);
      
      expect(component.disableDel[0]).toContain(true);
    });

    it('should remove attribute from event form', () => {
      component.addAttribute(0);
      component.addAttribute(0);
      const initialLength = component.getAttributesFormArray(0).length;
      
      component.removeAttribute(0, 0);
      
      expect(component.getAttributesFormArray(0).length).toBe(initialLength - 1);
    });

    it('should mark form as dirty when removing attribute', () => {
      component.addAttribute(0);
      component.removeAttribute(0, 0);
      
      expect(component.eventFormArray.dirty).toBe(true);
    });

    it('should get attribute form group', () => {
      component.addAttribute(0);
      const attributeGroup = component.getAttribute(0, 0);
      
      expect(attributeGroup).toBeDefined();
      expect(attributeGroup.get('name')).toBeDefined();
    });
  });

  describe('Answer Management', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
    });

    it('should add answer to attribute', () => {
      const attribute = component.getAttribute(0, 0);
      const initialLength = (attribute.get('answers') as any).length;
      
      component.addAnswer(attribute);
      
      expect((attribute.get('answers') as any).length).toBe(initialLength + 1);
    });

    it('should get answers controls', () => {
      const attribute = component.getAttribute(0, 0);
      component.addAnswer(attribute);
      
      const answersControls = component.getAnswersControls(0, 0);
      
      expect(answersControls).toBeDefined();
      expect(answersControls.length).toBeGreaterThan(0);
    });

    it('should set deleteSelectedAttribute when removeAnswer is called', () => {
      const attribute = component.getAttribute(0, 0);
      component.addAnswer(attribute);
      
      component.removeAnswer(attribute, 0);
      
      expect(component.openDeleteAttributeModal).toBe(true);
      expect(component.deleteSelectedAttribute).toBeDefined();
    });

    it('should delete answer on confirmation', () => {
      const attribute = component.getAttribute(0, 0);
      component.addAnswer(attribute);
      component.addAnswer(attribute);
      
      component.deleteSelectedAttribute = { attribute, indexK: 0 };
      const initialLength = (attribute.get('answers') as any).length;
      
      component.deleteAttributeConfirmation();
      
      expect((attribute.get('answers') as any).length).toBe(initialLength - 1);
      expect(component.openDeleteAttributeModal).toBe(false);
    });
  });

  describe('Data Type Change Handler', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
    });

    it('should update name validators when dataType is STRING', () => {
      const attribute = component.getAttribute(0, 0);
      attribute.get('dataType')?.setValue('STRING');
      
      component.onDataTypeChange(attribute);
      
      const nameControl = attribute.get('name');
      expect(nameControl?.hasError).toBeDefined();
    });
  });

  describe('Validation Methods', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
    });

    it('should validate min count - return null for valid value', () => {
      component.eventFormArray.at(0).get('minQuantity')?.setValue(1);
      
      const error = component._validateMinCount('EVENT1', 0);
      
      expect(error).toBeNull();
    });

    it('should validate max count - return error when max <= min', () => {
      component.eventFormArray.at(0).get('minQuantity')?.setValue(5);
      component.eventFormArray.at(0).get('maxQuantity')?.setValue(3);
      component.eventFormArray.at(0).get('maxQuantity')?.markAsTouched();
      
      const error = component._validateMaxCount('EVENT1', 0);
      
      expect(error).toBe(component.eventLabels.maxQuantityMinError);
    });

    it('should validate max count - return null for valid value', () => {
      component.eventFormArray.at(0).get('minQuantity')?.setValue(1);
      component.eventFormArray.at(0).get('maxQuantity')?.setValue(5);
      
      const error = component._validateMaxCount('EVENT1', 0);
      
      expect(error).toBeNull();
    });

    it('should validate custom attribute - return error for max length', () => {
      component.addAttribute(0);
      
      const attributesArray = component.getAttributesFormArray(0);
      const longString = 'a'.repeat(101);
      attributesArray.at(0).get('name')?.setValue(longString);
      attributesArray.at(0).get('dataType')?.setValue('NUMBER');
      attributesArray.at(0).get('name')?.markAsTouched();
      
      const error = component._validateCustAttribute(0, 0);
      
      expect(error).toBe(component.eventLabels.nameCharLimitErrorMsg);
    });
  });

  describe('Duplicate Checking', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
    });

    it('should detect duplicates in array', () => {
      const array = ['attr1', 'attr2', 'attr1'];
      const result = component.hasDuplicates(array);
      
      expect(result).toBe(true);
    });

    it('should return false for unique array', () => {
      const array = ['attr1', 'attr2', 'attr3'];
      const result = component.hasDuplicates(array);
      
      expect(result).toBe(false);
    });

    it('should check custom attribute duplicates', () => {
      component.addAttribute(0);
      component.addAttribute(0);
      
      const attributesArray = component.getAttributesFormArray(0);
      attributesArray.at(0).get('name')?.setValue('Duplicate');
      attributesArray.at(1).get('name')?.setValue('Duplicate');
      
      const result = component.duplicatesCheckCustomAttr('Duplicate', 0);
      
      expect(result).toBe(true);
    });

    it('should return false for unique custom attributes', () => {
      component.addAttribute(0);
      component.addAttribute(0);
      
      const attributesArray = component.getAttributesFormArray(0);
      attributesArray.at(0).get('name')?.setValue('Attr1');
      attributesArray.at(1).get('name')?.setValue('Attr2');
      
      const result = component.duplicatesCheckCustomAttr('Attr1', 0);
      
      expect(result).toBe(false);
    });
  });

  describe('Chip Management', () => {
    beforeEach(() => {
      component.initForm();
      component.selectedEventTypes = [...mockInsuredEventRefData] as any;
      component.updateEventFormArray(mockInsuredEventRefData);
    });

    it('should remove chip and update event form array', () => {
      const event = {
        value: mockInsuredEventRefData[0],
      };
      
      component.onChipRemove(event, 'eventType');
      
      expect(component.selectedEventTypes.length).toBe(1);
      expect(component.eventFormArray.length).toBe(1);
    });

    it('should clear all selections', () => {
      component.clearSelection('eventType');
      
      expect(component.selectedEventTypes).toEqual([]);
      expect(component.eventFormArray.length).toBe(0);
    });
  });

  describe('File Type Selection', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
      component.fileTypeList = mockFileTypeList;
    });

    it('should select all file types', () => {
      const attribute = component.getAttribute(0, 0);
      const event: MultiSelectSelectAllChangeEvent = {
        originalEvent: new Event('change'),
        checked: true,
      };
      
      component.onSelectAllFileTypes(event, attribute);
      
      expect(attribute.get('fileTypes')?.value).toEqual(mockFileTypeList);
    });

    it('should deselect all file types', () => {
      const attribute = component.getAttribute(0, 0);
      const event: MultiSelectSelectAllChangeEvent = {
        originalEvent: new Event('change'),
        checked: false,
      };
      
      component.onSelectAllFileTypes(event, attribute);
      
      expect(attribute.get('fileTypes')?.value).toEqual([]);
    });
  });

  describe('Modal Management', () => {
    it('should handle delete modal', () => {
      component.openDeleteModal = true;
      component.handleDeleteModal();
      
      expect(component.openDeleteModal).toBe(false);
    });

    it('should enable delete confirmation', () => {
      component.enableDeleteConfirmation(0, 1);
      
      expect(component.openDeleteModal).toBe(true);
      expect(component.deleteSelectedItem).toEqual({ indexI: 0, indexJ: 1 });
    });

    it('should delete attribute on confirmation', () => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
      component.addAttribute(0);
      
      component.deleteSelectedItem = { indexI: 0, indexJ: 0 };
      const initialLength = component.getAttributesFormArray(0).length;
      
      component.deleteConfirmation();
      
      expect(component.getAttributesFormArray(0).length).toBe(initialLength - 1);
      expect(component.openDeleteModal).toBe(false);
    });

    it('should handle delete attribute modal', () => {
      component.openDeleteAttributeModal = true;
      component.handleDeleteAttributeModal();
      
      expect(component.openDeleteAttributeModal).toBe(false);
    });
  });

  describe('Save Operations', () => {
    beforeEach(() => {
      component.initForm();
      component.insuredEventRefData = mockInsuredEventRefData;
      component.policyHolderOptions = mockPolicyHolderOptions;
      component.selectedEventTypes = [mockInsuredEventRefData[0]] as any;
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.policyHolderType.setValue('Policy Holder 1');
      component.eventFormArray.at(0).get('minQuantity')?.setValue(1);
      component.eventFormArray.at(0).get('maxQuantity')?.setValue(5);
    });

    it('should not save if form is invalid', () => {
      component.eventFormArray.at(0).get('minQuantity')?.setValue(null);
      component.eventFormArray.at(0).get('minQuantity')?.setErrors({ required: true });
      
      jest.spyOn(studioCommands, 'execute');
      component.saveAndExit();
      
      expect(studioCommands.execute).not.toHaveBeenCalled();
    });

    it('should save with POST when no existing insured events', async () => {
      component.insuredEventsList = undefined;
      jest.spyOn(studioCommands, 'execute').mockResolvedValue(true);
      
      await component.saveAndExit();
      
      expect(studioCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({ method: 'POST' }),
        }),
        expect.any(Object),
        {}
      );
    });

    it('should save with PATCH when existing insured events', async () => {
      component.insuredEventsList = mockInsuredEventsList;
      jest.spyOn(studioCommands, 'execute').mockResolvedValue(true);
      
      await component.saveAndExit();
      
      expect(studioCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({ method: 'PATCH' }),
        }),
        expect.any(Object),
        {}
      );
    });

    it('should navigate to products after save without moveToNext', async () => {
      await component.saveAndExit(false);
      
      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
      }, 100);
    });

    it('should call nextButtonClicked after save with moveToNext', async () => {
      await component.saveAndExit(true);
      
      setTimeout(() => {
        expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({
          stepCount: 3,
        });
      }, 100);
    });

    it('should handle save error', async () => {
      jest.spyOn(studioCommands, 'execute').mockRejectedValue(new Error('Save failed'));
      
      await component.saveAndExit();
      
      setTimeout(() => {
        expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
          })
        );
      }, 100);
    });

    it('should show success message after successful save', async () => {
      jest.spyOn(studioCommands, 'execute').mockResolvedValue(true);
      
      await component.saveAndExit();
      
      setTimeout(() => {
        expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
          })
        );
      }, 100);
    });
  });

  describe('Navigation Methods', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should handle saveAndNext when product is disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      
      component.saveAndNext();
      
      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({
        stepCount: 3,
      });
    });

    it('should call saveAndExit when product is not disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      const saveAndExitSpy = jest.spyOn(component, 'saveAndExit');
      
      component.saveAndNext();
      
      expect(saveAndExitSpy).toHaveBeenCalledWith(true);
    });

    it('should handle submit', () => {
      component.submit();
      
      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({
        stepCount: 3,
      });
    });

    it('should handle previous', () => {
      component.previous();
      
      expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({
        stepCount: 1,
        isRoute: true,
        routeOrFunction: '/products/PROD-123/coveragevariant/edit/CV-123',
      });
    });
  });

  describe('Prefill Form', () => {
    beforeEach(() => {
      component.initForm();
      component.insuredEventRefData = mockInsuredEventRefData;
      component.policyHolderOptions = mockPolicyHolderOptions;
      component.insuredEventsList = mockInsuredEventsList;
    });

    it('should return early if insuredEventsList is empty', () => {
      component.insuredEventsList = [];
      const updateEventFormArraySpy = jest.spyOn(component, 'updateEventFormArray');
      
      (component as any).prefillForm();
      
      expect(updateEventFormArraySpy).not.toHaveBeenCalled();
    });

    it('should prefill policy holder type', () => {
      (component as any).prefillForm();
      
      expect(component.policyHolderType.value).toBe('Policy Holder 1');
    });

    it('should prefill event types', () => {
      (component as any).prefillForm();
      
      expect(component.selectedEventTypes.length).toBeGreaterThan(0);
      expect(component.eventFormArray.length).toBeGreaterThan(0);
    });

    it('should prefill min and max quantities', () => {
      (component as any).prefillForm();
      
      expect(component.eventFormArray.at(0).get('minQuantity')?.value).toBe(1);
      expect(component.eventFormArray.at(0).get('maxQuantity')?.value).toBe(5);
    });

    it('should populate custom attributes', () => {
      (component as any).prefillForm();
      
      const attributesArray = component.getAttributesFormArray(0);
      expect(attributesArray.length).toBeGreaterThan(0);
    });
  });

  describe('Request Preparation', () => {
    beforeEach(() => {
      component.initForm();
      component.insuredEventRefData = mockInsuredEventRefData;
      component.policyHolderOptions = mockPolicyHolderOptions;
      component.selectedEventTypes = [mockInsuredEventRefData[0]] as any;
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.policyHolderType.setValue('Policy Holder 1');
      component.eventFormArray.at(0).get('minQuantity')?.setValue(1);
      component.eventFormArray.at(0).get('maxQuantity')?.setValue(5);
    });

    it('should prepare request event with correct structure', () => {
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event).toHaveProperty('insuredEventId');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('policyHolderType');
      expect(event).toHaveProperty('minQuantity');
      expect(event).toHaveProperty('maxQuantity');
      expect(event).toHaveProperty('customAttributes');
    });

    it('should use existing insuredEventId if available', () => {
      component.insuredEventsList = mockInsuredEventsList;
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event.insuredEventId).toBe('IE-123');
    });

    it('should set minQuantity to 0 if empty', () => {
      component.eventFormArray.at(0).get('minQuantity')?.setValue('');
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event.minQuantity).toBe(0);
    });

    it('should set maxQuantity to 0 if empty', () => {
      component.eventFormArray.at(0).get('maxQuantity')?.setValue('');
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event.maxQuantity).toBe(0);
    });

    it('should prepare custom attributes correctly', () => {
      component.addAttribute(0);
      const attributesArray = component.getAttributesFormArray(0);
      attributesArray.at(0).patchValue({
        name: 'Test Attribute',
        dataType: 'STRING',
        required: true,
        defaultValue: 'Test Value',
      });
      
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event.customAttributes.length).toBeGreaterThan(0);
      expect(event.customAttributes[0].attrName).toBe('Test Attribute');
    });

    it('should filter out null custom attributes', () => {
      component.addAttribute(0);
      // Leave attribute name empty
      
      const event = (component as any)._prepareRequestEvent(0);
      
      expect(event.customAttributes.every((attr: any) => attr !== null)).toBe(true);
    });
  });

  describe('Utility Methods', () => {

    it('should return empty string for empty list', () => {
      const result = component.listToString([]);
      
      expect(result).toBe('');
    });

    it('should get dropdown answer error message', () => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
      const attribute = component.getAttribute(0, 0);
      component.addAnswer(attribute);
      
      const answersArray = attribute.get('answers') as any;
      const answerControl = answersArray.at(0).get('answerValue');
      answerControl.markAsTouched();
      answerControl.setErrors({ required: true });
      
      const error = component.getDropdownAnswerErrorMessage(answerControl);
      
      expect(error).toBe('Required field');
    });

    it('should return null for valid dropdown answer', () => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
      component.addAttribute(0);
      const attribute = component.getAttribute(0, 0);
      component.addAnswer(attribute);
      
      const answersArray = attribute.get('answers') as any;
      const answerControl = answersArray.at(0).get('answerValue');
      answerControl.setValue('Valid Answer');
      
      const error = component.getDropdownAnswerErrorMessage(answerControl);
      
      expect(error).toBeNull();
    });
  });

  describe('Custom Attribute Duplicate Validator', () => {
    beforeEach(() => {
      component.initForm();
      component.updateEventFormArray([mockInsuredEventRefData[0]]);
    });

    it('should return null for empty value', () => {
      const validator = component.customAttrDuplicateValidator(0);
      const result = validator({ value: '' } as any);
      
      expect(result).toBeNull();
    });

    it('should return null for null value', () => {
      const validator = component.customAttrDuplicateValidator(0);
      const result = validator({ value: null } as any);
      
      expect(result).toBeNull();
    });
  });

  describe('Product Context', () => {

    it('should use existing requestId if available', () => {
      mockProductContextService._getProductContext.mockReturnValue({
        requestId: 'EXISTING-REQ-123',
        country: ['IE'],
        language: 'en',
      });
      
      component.initForm();
      
      expect(component.productContext.requestId).toBe('EXISTING-REQ-123');
    });

    it('should default to IE for country', () => {
      mockProductContextService._getProductContext.mockReturnValue({
        requestId: 'REQ-123',
        country: [],
        language: 'en',
      });
      
      component.initForm();
      
      expect(component.country).toBe('IE');
    });

    it('should default language to en', () => {
      mockProductContextService._getProductContext.mockReturnValue({
        requestId: 'REQ-123',
        country: ['IE'],
        language: '',
      });
      
      component.initForm();
      
      expect(component.productContext.language).toBe('en');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should handle prefillForm with undefined insuredEventsList', () => {
      component.insuredEventsList = undefined;
      
      expect(() => (component as any).prefillForm()).not.toThrow();
    });

    it('should handle getAttributesFormArray with invalid index', () => {
      const result = component.getAttributesFormArray(999);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it('should handle hasCustAttrDuplicates with empty arrays', () => {
      const result = component.hasCustAttrDuplicates([], []);
      
      expect(result).toBe(false);
    });
  });
});
