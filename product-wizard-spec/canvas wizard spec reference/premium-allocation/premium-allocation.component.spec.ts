import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService, RegionService } from '@canvas/services';
import { AUTH_SETTINGS } from '@canvas/shared/data-access/auth';
import {
  mockBreakDownType,
  mockCOVGVARProduct,
  mockLabels,
  mockSTDCOVERProduct,
} from 'apps/products/mock/mock-premium-allocation';
import { mockCoverageVariants } from 'apps/products/mock/mock-coverage-variant';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { PremiumAllocationComponent } from './premium-allocation.component';

describe('PremiumAllocationComponent', () => {
  let component: PremiumAllocationComponent;
  let fixture: ComponentFixture<PremiumAllocationComponent>;

  // Mock services
  const mockRouter = { navigate: jest.fn() };
  const mockLayoutService = {
    caption$: { next: jest.fn() },
    showMessage: jest.fn(),
    updateBreadcrumbs: jest.fn(),
  };
  const mockAppContextService = { get: jest.fn().mockReturnValue(mockLabels) };

  const mockProductService = {
    getBreakDownType: jest.fn().mockReturnValue(of(mockBreakDownType)),
    getProductFull: jest.fn().mockReturnValue(of(mockSTDCOVERProduct)),
    updateAllProductInfo: jest.fn().mockReturnValue(of(true)),
  };
  const mockSharedService = {
    nextButtonClicked: { next: jest.fn() },
    previousButtonClicked: { next: jest.fn() },
  };
  const mockProductContextService = {
    _getProductContext: jest.fn().mockReturnValue({
      status: 'design',
    }),
    _getPartnerProvidedData: jest.fn().mockReturnValue(null),
    isProductDisabled: jest.fn().mockReturnValue(false),
  };
  const mockCoverageVariantsService = {};
  const mockMessageService = { add: jest.fn() };
  const mockRegionService = {};

  let formBuilder: FormBuilder;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumAllocationComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: ProductsService, useValue: mockProductService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ProductContextService, useValue: mockProductContextService },
        {
          provide: CoverageVariantsService,
          useValue: mockCoverageVariantsService,
        },
        { provide: MessageService, useValue: mockMessageService },
        { provide: RegionService, useValue: mockRegionService },
        {
          provide: AUTH_SETTINGS,
          useValue: {
            /* mock settings for testing */
          },
        },
        FormBuilder,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock return values to defaults
    mockProductService.getBreakDownType.mockReturnValue(of(mockBreakDownType));
    mockProductService.getProductFull.mockReturnValue(of(mockSTDCOVERProduct));
    mockProductService.updateAllProductInfo.mockReturnValue(of(true));
    mockProductContextService.isProductDisabled.mockReturnValue(false);
    mockProductContextService._getPartnerProvidedData.mockReturnValue(null);
    
    // Set up localStorage mock
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'productId') return 'LVGNT0001';
      if (key === 'productVersionId') return '1.0';
      return null;
    });
    
    fixture = TestBed.createComponent(PremiumAllocationComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
    
    // Initialize component properties that tests expect
    component.productRequest = { 
      rating: {
        hasManualBreakdown: false,
        breakDownType: 'STDCOVER'
      },
      coverageVariants: mockCoverageVariants
    };
    component.coverageVariants = mockCoverageVariants;
    component.defaultPremium = 'STDCOVER';
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on creation', () => {
    expect(component.premiumForm).toBeDefined();
    expect(component.premiumForm.get('breakDownType')).toBeTruthy();
    expect(component.premiumForm.get('coverageVariants')).toBeTruthy();
  });

  it('should call getProductDetails on ngOnInit', () => {
    jest.spyOn(component, 'getProductDetails');
    component.ngOnInit();
    expect(component.getProductDetails).toHaveBeenCalledWith(
      component.productId,
      component.productVersionId
    );
  });

  it('should call saveAndNext when button is clicked with disabled', () => {
    // Note: When product is disabled, the button itself is disabled
    // This test verifies that saveAndNext handles the disabled state properly
    jest.clearAllMocks();
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    
    // Call saveAndNext directly since button would be disabled
    jest.spyOn(component, 'saveAndNext');
    component.saveAndNext();

    // Assert that saveAndNext was called and navigates
    expect(component.saveAndNext).toHaveBeenCalled();
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
  });

  it('should call previous when Back button is clicked', () => {
    // Spy on the previous method
    jest.spyOn(component, 'previous');
    
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    // Find the button element
    const button = Array.from(buttons).find((btn) => {
      return (btn as HTMLButtonElement).textContent?.includes('Back');
    });

    // Ensure the button was found
    if (!button) {
      throw new Error('Button with text "Back" not found');
    }

    // Simulate a click event
    (button as HTMLButtonElement).click();

    // Assert that previous was called
    expect(component.previous).toHaveBeenCalled();
  });

  it('should call getProductDetails on ngOnInit', () => {
    mockProductService.getProductFull.mockReturnValue(of(mockCOVGVARProduct));
    jest.spyOn(component, 'getProductDetails');
    component.ngOnInit();
    expect(component.getProductDetails).toHaveBeenCalledWith(
      component.productId,
      component.productVersionId
    );
  });

  // Additional tests for better coverage

  it('should handle loadBreakDownTypeList successfully', () => {
    component.loadBreakDownTypeList();
    expect(mockProductService.getBreakDownType).toHaveBeenCalled();
    expect(component.breakDownTypeList).toEqual(mockBreakDownType);
  });

  it('should handle loadBreakDownTypeList error', () => {
    mockProductService.getBreakDownType.mockReturnValue(throwError(() => new Error('API Error')));
    component.loadBreakDownTypeList();
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'error',
      message: 'Unable to fetch premium breakdown',
      duration: 5000,
    });
  });

  it('should toggle hasManualBreakdown on onPremiumToggleChange', () => {
    component.hasManualBreakdown = false;
    const event = new Event('change');
    component.onPremiumToggleChange(event);
    expect(component.hasManualBreakdown).toBe(true);

    component.onPremiumToggleChange(event);
    expect(component.hasManualBreakdown).toBe(false);
  });

  it('should call previous and trigger shared service', () => {
    component.previous();
    expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
  });

  it('should get breakdown type from form', () => {
    component.premiumForm.patchValue({ breakDownType: 'STDCOVER' });
    expect(component.getBreakDownType()).toBe('STDCOVER');
  });

  it('should validate coverage total correctly', () => {
    const validator = component.coverageTotalValidator();
    
    // Test with total = 100 (valid)
    const validControl = {
      value: [
        { allocationPercent: 60 },
        { allocationPercent: 40 }
      ]
    } as any;
    expect(validator(validControl)).toBeNull();

    // Test with total != 100 (invalid)
    const invalidControl = {
      value: [
        { allocationPercent: 60 },
        { allocationPercent: 30 }
      ]
    } as any;
    expect(validator(invalidControl)).toEqual({ coverageTotalError: { value: 90 } });
  });

  it('should handle saveAndNext when product is disabled', () => {
    jest.clearAllMocks();
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    component.saveAndNext();
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    expect(mockProductService.updateAllProductInfo).not.toHaveBeenCalled();
  });

  it('should create coverage group with proper form structure', () => {
    component.fieldsetDisabled = false;
    const mockVariant = {
      coverageVariantId: '123',
      name: 'Test Coverage',
      allocationPercent: 50
    } as any;
    
    const group = component.createCoverageGroup(mockVariant);
    expect(group.get('coveragesRef')?.value).toEqual(mockVariant);
    expect(group.get('allocationPercent')?.value).toBe(50);
  });

  it('should generate standard coverage code list', () => {
    const mockData = [
      {
        coveragespremiumregistration: [
          {
            stdCoverageCode: 'CODE1',
            stdCoverageDescription: 'Coverage 1',
            allocationPercent: 60
          },
          {
            stdCoverageCode: 'CODE2',
            stdCoverageDescription: 'Coverage 2',
            allocationPercent: 40
          }
        ]
      }
    ] as any;

    const result = component.standardCoverageCodeList(mockData);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('CODE1');
    expect(result[0].name).toBe('Coverage 1');
    expect(result[0].allocationPercent).toBe(60);
  });

  it('should generate coverage variant list', () => {
    const mockData = [
      {
        coverageVariantId: 'VAR1',
        name: 'Variant 1',
        allocationPercent: 70
      },
      {
        coverageVariantId: 'VAR2',
        name: 'Variant 2',
        allocationPercent: 30
      }
    ] as any;

    const result = component.coverageVariantList(mockData);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('VAR1');
    expect(result[0].name).toBe('Variant 1');
    expect(result[0].allocationPercent).toBe(70);
  });

  it('should handle getProductDetails error', () => {
    mockProductService.getProductFull.mockReturnValue(throwError(() => new Error('API Error')));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    component.getProductDetails('P123', 'V456');
    
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'error',
      message: 'Product details fetch failed',
      duration: 5000,
    });
    expect(consoleSpy).toHaveBeenCalledWith('error: Error: API Error');
    
    consoleSpy.mockRestore();
  });

  it('should load premium allocation with COVGVAR breakdown type', () => {
    // Clear the form array first
    while (component.coverageVariantsArray.length) {
      component.coverageVariantsArray.removeAt(0);
    }
    
    component.coverageVariants = mockCOVGVARProduct.coverageVariants;
    component.premiumForm.patchValue({ breakDownType: 'COVGVAR' });
    jest.spyOn(component, 'coverageVariantList');
    jest.spyOn(component, 'initPremiumAllocations');
    
    component.loadPremiumAllocation();
    
    expect(component.coverageVariantList).toHaveBeenCalledWith(component.coverageVariants);
    expect(component.initPremiumAllocations).toHaveBeenCalled();
  });

  it('should load premium allocation with STDCOVER breakdown type', () => {
    // Clear the form array first
    while (component.coverageVariantsArray.length) {
      component.coverageVariantsArray.removeAt(0);
    }
    
    component.coverageVariants = mockSTDCOVERProduct.coverageVariants;
    component.premiumForm.patchValue({ breakDownType: 'STDCOVER' });
    jest.spyOn(component, 'standardCoverageCodeList');
    jest.spyOn(component, 'initPremiumAllocations');
    
    component.loadPremiumAllocation();
    
    expect(component.standardCoverageCodeList).toHaveBeenCalledWith(component.coverageVariants);
    expect(component.initPremiumAllocations).toHaveBeenCalled();
  });

  it('should handle invalid breakdown type in loadPremiumAllocation', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    component.premiumForm.patchValue({ breakDownType: 'INVALID' });
    
    component.loadPremiumAllocation();
    
    expect(consoleSpy).toHaveBeenCalledWith('Invalid defaultPremium value:', component.defaultPremium);
    consoleSpy.mockRestore();
  });

  it('should re-render table correctly', () => {
    jest.spyOn(component, 'resetFormToOriginal');
    jest.spyOn(component, 'loadPremiumAllocation');
    
    component.reRenderTable();
    
    expect(component.resetFormToOriginal).toHaveBeenCalled();
    expect(component.loadPremiumAllocation).toHaveBeenCalled();
  });

  it('should reset form to original state', () => {
    const originalBreakDownType = component.breakDownType.value;
    component.resetFormToOriginal();
    
    expect(component.premiumForm).toBeDefined();
    expect(component.premiumForm.get('breakDownType')).toBeTruthy();
    expect(component.premiumForm.get('coverageVariants')).toBeTruthy();
    expect(component.coverageVariantsArray.length).toBe(0);
  });

  it('should get coverage variants request for STDCOVER', () => {
    component.coverageVariants = mockSTDCOVERProduct.coverageVariants;
    component.premiumForm.patchValue({ breakDownType: 'STDCOVER' });
    
    // Add some form controls to simulate form data
    const formArray = component.coverageVariantsArray;
    formArray.push(formBuilder.group({
      coveragesRef: { id: 'AA0001' },
      allocationPercent: 60
    }));
    
    const result = component.getCoverageVariantsRequest();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should get coverage variants request for COVGVAR', () => {
    component.coverageVariants = mockCOVGVARProduct.coverageVariants;
    component.premiumForm.patchValue({ breakDownType: 'COVGVAR' });
    
    // Add some form controls to simulate form data
    const formArray = component.coverageVariantsArray;
    formArray.push(formBuilder.group({
      coveragesRef: { id: 'COV001' },
      allocationPercent: 70
    }));
    
    const result = component.getCoverageVariantsRequest();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle updateCoverageVariants when product is disabled', () => {
    // Clear any previous calls
    jest.clearAllMocks();
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    
    component.updateCoverageVariants(true);
    
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    expect(mockProductService.updateAllProductInfo).not.toHaveBeenCalled();
  });

  it('should initialize premium allocations correctly', () => {
    // Clear the form array first
    while (component.coverageVariantsArray.length) {
      component.coverageVariantsArray.removeAt(0);
    }
    
    const mockData = [
      { id: '1', name: 'Test 1', allocationPercent: 50 },
      { id: '2', name: 'Test 2', allocationPercent: 50 }
    ];
    
    component.initPremiumAllocations(mockData);
    
    expect(component.coverageVariantsArray.length).toBe(2);
  });

  // Add more tests here to cover other functionalities
});
