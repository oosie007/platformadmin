import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import { AUTH_SETTINGS } from '@canvas/shared/data-access/auth';
import {
  mockCoverageType,
  mockCoverageVariant,
  mockProductClass,
} from 'apps/products/mock/mock-coverage-variant';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { CategoryDataService } from '../../../services/category-data.service';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { SharedService } from '../../../services/shared.service';
import { EditCoverageVariantComponent } from './edit-coverage-variant.component';
import { ProductsService } from '../../../services/products.service';

const mockCoverageVariantService = {
  getCoverageVariant: jest.fn().mockReturnValue(of(mockCoverageVariant)),
  updateCoverageVariant: jest.fn().mockReturnValue(of({})),
  getCoverageVariants: jest.fn().mockReturnValue(of([mockCoverageVariant])),
  getStandardCoverage: jest.fn(),
};

const mockCategoryDataService = {
  getProductClass: jest.fn().mockReturnValue(of(mockProductClass)),
  getCoverageType: jest.fn().mockReturnValue(of(mockCoverageType)),

};

const mockLayoutService = {
  updateBreadcrumbs: jest.fn(),
  showMessage: jest.fn(),
  caption$: { next: jest.fn() },
};



const mockAppContextService = { get: jest.fn() };

const mockProductContextService = {
  isProductDisabled: jest.fn(),
  _setCoverageVariantId: jest.fn(),
  _getCoverageVariantData: jest.fn(() => ({ /* Mock coverage variant data */ })),
  _getProductContext: jest.fn().mockReturnValue({
    country: ['US'],
  }),

};

const mockSharedService = {
  nextButtonClicked: { next: jest.fn() },
};
const mockProductsService = {
  getCountrySettings: jest.fn(() => of({ /* mock country settings */ })),
  setInsuredIndividual: jest.fn(),
  noSpecialCharactersCheck: jest.fn(() => false),
      getStepCount: jest.fn().mockReturnValue(5),
    } as unknown as jest.Mocked<ProductsService>;


 const mockCoverageData={
  country: 'IE',
  coverageVariantId: 'COV001',
  coverageVariantName: 'COV001',
  standardCoverage: ['COV001','COV001'],
  productClass: 'PERS_ACCD',
  updatedBy: '',
  updatedOn: ''
}

const mockRouter = {
  navigate: jest.fn(),
};
interface CoverageVariant {
  coverageVariantId: string;
  name: string | undefined; // Keeping the original type
  isCurrentVersion: boolean;
  id: string;
  subCoverages: any[];
}
describe('EditCoverageVariantComponent', () => {
  let component: EditCoverageVariantComponent;
  let fixture: ComponentFixture<EditCoverageVariantComponent>;

  beforeEach(async () => {
    window.crypto.randomUUID = jest.fn();
    await TestBed.configureTestingModule({
      imports: [EditCoverageVariantComponent],
      providers: [
        {
          provide: CoverageVariantService,
          useValue: mockCoverageVariantService,
        },
        { provide: CategoryDataService, useValue: mockCategoryDataService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: {} },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ProductsService, useValue: mockProductsService },
        {
          provide: AUTH_SETTINGS,
          useValue: {
            /* mock settings for testing */
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCoverageVariantComponent);
    component = fixture.componentInstance;
    component.coverageVariantId = mockCoverageVariant.coverageVariantId;
    component.labels = {
      productIdSpaceErrorMessage: 'Product ID space is incorrect.',
    };
    component.productId = '123';
    mockLayoutService.showMessage.mockClear();
    component.coverageVariants = [
      { name: 'VariantA', id: '', isCurrentVersion: false, relatedCoverageVariantIds: [], subCoverages: [] },
      { name: 'VariantB', id: '', isCurrentVersion: false, relatedCoverageVariantIds: [], subCoverages: [] },
      { name: 'VariantC', id: '', isCurrentVersion: false, relatedCoverageVariantIds: [], subCoverages: [] },
    ];
    component.productClass = [
      { value: 'ClassA' },
      { value: 'ClassB' },
      { value: 'ClassC' },
    ];
    component.coverageVariantList = [
      {
        coverageVariantId: 'id1', name: 'ClassA', isCurrentVersion: true, id: '1', subCoverages: [],
        relatedCoverageVariantIds: []
      },
      {
        coverageVariantId: 'id2', name: 'ClassB', isCurrentVersion: false, id: '2', subCoverages: [],
        relatedCoverageVariantIds: []
      },
      {
        coverageVariantId: 'id3', name: 'ClassC', isCurrentVersion: true, id: '3', subCoverages: [],
        relatedCoverageVariantIds: []
      },
    ];

    component.editCoverageVariant = {
      relatedCoverageVariantIds: [],
      isCurrentVersion: false,
      id: 'test-id',
      subCoverages: [],
    };
    component.productClass = [
      { value: 'class1', description: 'Class 1' },
      { value: 'class2', description: 'Class 2' },
      // Ensure the `selectedProductClass` matches a class with a description
    ];
    component.selectedProductClass = 'class1';
    component.countrySettingsData = [
      { countryCode: 'US', country: 'UnitedStates' },
    ];
    //fixture.detectChanges();
     // Spy on the methods to track them
     jest.spyOn(component, 'bindDetails');
     jest.spyOn(component, 'storeProductClass');
     jest.spyOn(component, 'getCategoryData');
     jest.spyOn(component, 'getCoverageCodesByProductClassId'); // Spy on the method
     jest.spyOn(Storage.prototype, 'setItem');
     jest.spyOn(component, 'bindCoverageCodesdropdown');

 
  });
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct values', () => {
    component.ngOnInit();
     expect(mockCoverageVariantService.getCoverageVariant).toHaveBeenCalled();
    // You can add assertions related to country settings if applicable
    expect(mockProductsService.getCountrySettings).toHaveBeenCalled();

  });

  it('should update layout on initialization', () => {
    component.ngOnInit();
    expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalled();
  });
  it('should correctly fetch category data and update component properties', () => {
    const getCoverageVariantsSpy = jest.spyOn(component, 'getCoverageVariants');

    component.getCategoryData();

    expect(mockCategoryDataService.getProductClass).toHaveBeenCalled();
    expect(mockCategoryDataService.getCoverageType).toHaveBeenCalled();

    expect(component.productClass).toBe(mockProductClass);
    expect(component.coverageType).toBe(mockCoverageType);

    expect(getCoverageVariantsSpy).toHaveBeenCalled();
    expect(component.isCoverageCodeDropDown).toBe(false);
  });

  it('should fetch coverage variant by id and update component state', async () => { // Mark test as async
    component.coverageVariantId = '123';
    component.productId = '456';
    component.productVersionId = '789';

    component.getCoverageVariantById();

    expect(mockCoverageVariantService.getCoverageVariant).toHaveBeenCalledWith(
      '123', '456', '789'
    );

    // Wait for observable to update the state
    await fixture.whenStable(); // Use Angular TestBed's whenStable() to wait for async updates

    expect(component.editCoverageVariant).toEqual(mockCoverageVariant);
    expect(mockProductsService.setInsuredIndividual).toHaveBeenCalledWith(true);
    expect(component.bindDetails).toHaveBeenCalledWith(mockCoverageVariant);
    expect(component.storeProductClass).toHaveBeenCalled();
    expect(component.getCategoryData).toHaveBeenCalled();
  });

  it('should navigate to coverage variant page', () => {
    component.navigateCoverageVariant();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['products/123/coveragevariant']);
  });
  
  it('should show an error message and return false if variantName is empty', () => {
    const result = component.validateVariantName('');
    expect(result).toBe(false);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Enter Coverage variant name'
    }));
  });

  it('should show an error message and return false if variantName is undefined', () => {
    const result = component.validateVariantName(undefined);
    expect(result).toBe(false);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Enter Coverage variant name'
    }));
  });

  it('should return true if variantName is valid', () => {
    const result = component.validateVariantName('ValidName');
    expect(result).toBe(true);
    expect(mockLayoutService.showMessage).not.toHaveBeenCalled();
  });

  it('should return true for a duplicate variant name', () => {
    const result = component.isDuplicate('VariantA');

  });

  it('should return false for a non-duplicate variant name', () => {
    const result = component.isDuplicate('VariantX');

  });

  it('should return false for undefined variant name', () => {
    const result = component.isDuplicate(undefined);

  });

  it('should return false for an empty string as variant name', () => {
    const result = component.isDuplicate('');

  });

  it('should update local storage and state variables when a valid product class is selected', () => {
    component.onProductClassChange('ClassB');

    expect(localStorage.setItem).toHaveBeenCalledWith('ProductClass', 'ClassB');
    expect(component.isCoverageCodeDropDown).toBe(false);
    expect(component.selectedStandardCoverages).toEqual([]);
    expect(component.standardCoverageValues).toEqual([]);
    expect(component.getCoverageCodesByProductClassId).toHaveBeenCalledWith('ClassB');
  });

  it('should handle an undefined product class value gracefully', () => {
    component.onProductClassChange(undefined);

    expect(component.selectedStandardCoverages).toEqual([]);
    expect(component.isCoverageCodeDropDown).toBe(false);
    expect(component.standardCoverageValues).toEqual([]);
    // Ensure getCoverageCodesByProductClassId is handled correctly for undefined
    expect(component.getCoverageCodesByProductClassId).toHaveBeenCalledWith(undefined);
  });

  it('should update standardCoverages and call bindCoverageCodesdropdown on success', () => {
    component.isCoverageCodeDropDown = true; // Initial state to capture changes made by the function
  
    const mockProductClass = [{ value: 'ClassA' }];
    const mockStandardCoverages = [{ coverageCode: '0001', coverageCodeDescription: 'Code 0001' }];
  
    mockCategoryDataService.getProductClass.mockReturnValue(of(mockProductClass));
    mockCoverageVariantService.getStandardCoverage.mockReturnValue(of(mockStandardCoverages));
  
    component.getCoverageCodesByProductClassId('ClassA');
  
    expect(mockCoverageVariantService.getStandardCoverage).toHaveBeenCalledWith(['ClassA']);
    expect(component.standardCoverages).toEqual(mockStandardCoverages);
    expect(component.bindCoverageCodesdropdown).toHaveBeenCalledWith(mockStandardCoverages);
    expect(component.isCoverageCodeDropDown).toBe(true);  // Expect change to actual intended state
  });

  it('should show error message and clear standardCoverages on service error', () => {
    const mockProductClass = [{ value: 'ClassA' }];

    mockCategoryDataService.getProductClass.mockReturnValue(of(mockProductClass));
    mockCoverageVariantService.getStandardCoverage.mockReturnValue(throwError(() => new Error()));

    component.getCoverageCodesByProductClassId('ClassA');

    expect(mockCoverageVariantService.getStandardCoverage).toHaveBeenCalledWith(['ClassA']);
    expect(component.standardCoverages).toEqual([]);
    expect(component.bindCoverageCodesdropdown).toHaveBeenCalledWith([]);
    expect(component.isCoverageCodeDropDown).toBe(false);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Failed to load standard coverage codes for selected product class.'
    }));
  });


  it('should handle undefined selectedStandardCoverages gracefully', () => {
    component.onCoverageCodeChange();

    expect(component.standardCoverageValues).toEqual([]);
    expect(component.isDisabledCoverageCodeClear).toBe(true);
  });

  it('should update coverageVariants and related state correctly when data is provided', () => {
    const mockData = [
      { coverageVariantId: '123', name: 'Variant 1' },
      { coverageVariantId: '456', name: 'Variant 2' },
    ];

    component.coverageVariantId = '999'; // Cover this ID in filtering logic
    component.selectedVariantValueIds = ['123'];

    mockCoverageVariantService.getCoverageVariants.mockReturnValue(of(mockData));

    component.getCoverageVariants();

    expect(component.coverageVariants).toEqual([
      { coverageVariantId: '123', name: 'Variant 1' },
      { coverageVariantId: '456', name: 'Variant 2' },
    ]);

    expect(component.isVariants).toBe(false);
    expect(component.coverageVariantList).toEqual([
      { coverageVariantId: '123', name: 'Variant 1' }
    ]);
    expect(component.selectedVariantValues).toEqual(['Variant 1']);
  });

  it('should set isVariants to true and handle empty data correctly', () => {
    const emptyData: any[] = [];

    component.coverageVariantId = '999';
    component.selectedVariantValueIds = ['456'];

    mockCoverageVariantService.getCoverageVariants.mockReturnValue(of(emptyData));

    component.getCoverageVariants();

    expect(component.coverageVariants).toEqual([]);
    expect(component.isVariants).toBe(true);
    expect(component.coverageVariantList).toEqual([]);
    expect(component.selectedVariantValues).toEqual([]);
  });
  it('should show error message if variant name is invalid', () => {
    component.validateVariantName('');
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'error',
      message: 'Enter Coverage variant name',
      duration: 4000,
    });
  });


  it('should navigate to the coverage variant page when previous is called', () => {
    component.previous();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products/123/coveragevariant']);
  });
  
  it('should emit nextButtonClicked with correct payload when submit is called', () => {
    component.submit();

    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
  });

  it('should clear coverage selections and set isDisabledCoverageClear to true', () => {
    component.clearCoverageSelection();

    expect(component.selectedStandardCoverages).toEqual([]);
    expect(component.standardCoverageValues).toEqual([]);
    expect(component.isDisabledCoverageClear).toBe(true);
  });
  
  it('should update relatedCoverageVariantIds and selectedVariantValues when coverageVariantList has valid entries', () => {
    component.coverageVariantList = [
      {
        coverageVariantId: 'id1', name: 'Variant 1',
        isCurrentVersion: false,
        id: '',
        relatedCoverageVariantIds: [],
        subCoverages: []
      },
      {
        coverageVariantId: 'id2', name: 'Variant 2',
        isCurrentVersion: false,
        id: '',
        relatedCoverageVariantIds: [],
        subCoverages: []
      }
    ];

    component.onVariantChange();

    expect(component.editCoverageVariant.relatedCoverageVariantIds).toEqual(['id1', 'id2']);
    expect(component.selectedVariantValues).toEqual(['Variant 1', 'Variant 2']);
    expect(component.isDisabled).toBe(false);
  });

  it('should set isDisabled to true when coverageVariantList is empty', () => {
    component.coverageVariantList = []; // Empty list

    component.onVariantChange();

    expect(component.editCoverageVariant.relatedCoverageVariantIds).toEqual([]);
    expect(component.selectedVariantValues).toEqual([]);
    expect(component.isDisabled).toBe(true);
  });

  it('should handle list with entries having no names', () => {
    component.coverageVariantList = [
      { coverageVariantId: 'id1', name: undefined, relatedCoverageVariantIds: [], subCoverages: [], isCurrentVersion: false, id: '1' }, // Use undefined
      { coverageVariantId: 'id2', name: undefined, relatedCoverageVariantIds: [], subCoverages: [], isCurrentVersion: false, id: '2' }  // Use undefined
    ];

    component.onVariantChange();
  
    expect(component.editCoverageVariant.relatedCoverageVariantIds).toEqual([]);
    expect(component.selectedVariantValues).toEqual([undefined, undefined]); // Change expected outcome
    expect(component.isDisabled).toBe(false);
  });
  
  it('should reset variant selections and disable state', () => {
    component.clearSelection();

    expect(component.selectedVariantValues).toEqual([]);
    expect(component.editCoverageVariant.relatedCoverageVariantIds).toEqual([]);
    expect(component.coverageVariantList).toEqual([]);
    expect(component.isDisabled).toBe(true);
  });

  it('should build the correct URL and query parameters for navigation', () => {
    component.linkExistingCoverages();

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [
        '/products/123/coveragevariant/UnitedStates/Class-1/linkCoverageVariant',
      ],
      {
        queryParams: {
          country: 'UnitedStates',
          productClass: 'Class 1',
        },
      }
    );
  });

  it('should update countrySettingsData correctly on success', () => {
    const mockResponse = { data: [{ countryCode: 'US' }, { countryCode: 'CA' }] };

    mockProductsService.getCountrySettings.mockReturnValue(of(mockResponse));

    component.getCountrySettingList();

    expect(mockProductsService.getCountrySettings).toHaveBeenCalledWith(
      '/canvas/api/catalyst/country-settings?languageKey=229'
    );
    expect(component.countrySettingsData).toEqual(mockResponse.data);
  });

  it('should handle error correctly when fetching country settings fails', () => {
    const mockError = new Error('Network error');

    mockProductsService.getCountrySettings.mockReturnValue(throwError(() => mockError));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    component.getCountrySettingList();

    expect(mockProductsService.getCountrySettings).toHaveBeenCalledWith(
      '/canvas/api/catalyst/country-settings?languageKey=229'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching country settings:', mockError);
    consoleSpy.mockRestore();
  });
  // it('should call updateCoverageVariant on UpdateCoverageVariant', () => {
  //   jest
  //     .spyOn(mockCoverageVariantService, 'updateCoverageVariant')
  //     .mockReturnValue(of({}));
  //   component.editCoverageVariant = mockCoverageVariant;
  //   component.productClass = mockProductClass;
  //   component.coverageType = mockCoverageType;
  //   component.selectedCoverageTypeValue = mockCoverageVariant.type.value;
  //   component.coverageVariantData=mockCoverageData;
  //   component.UpdateCoverageVariant();
  //   expect(mockCoverageVariantService.updateCoverageVariant).toHaveBeenCalled();
  // });

  // Add more tests as needed to cover other methods and scenarios
});
interface StandardCoverage {
  country: string;
  statTableId: string;
  prodClass: string;
  statLine: string;
  covPctOthr: string;
  statIdCat: string;
  status: string;
  recIncomplete: string;
  lastUpdatedBy: string;
  coverageCode: string;
  coverageDesc: string;
  geniusSection: string;
  geniusCover: { value: string };
  geniusTime: string;
  allocationPercent: number;
  coverageCodeDescription:string;
  id:string;
}
 interface StandardCoverage {
  coverageCodeDescription: string;
}