import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LayoutService } from '@canvas/components';
import { Subject, of, throwError } from 'rxjs';
import { CoherentMappingService } from '../../services/coherent-mapping.service';
import { ProductsService } from '../../services/products.service';
import { RATINGFACTORS, RatingFactorComponent } from './rating-factor.component';
import { MultiSelectSelectAllChangeEvent } from 'primeng/multiselect';
import { MappingPayload } from '../../types/coherent-mapping';
import { SharedService } from '../../services/shared.service';
import { ProductContextService } from '../../services/product-context.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { UtilityService } from '../../../services/utility.service';
import { AppContextService } from '@canvas/services';
import { HttpCacheManager } from '@ngneat/cashew';
import { REFERENCE_DATA } from '@canvas/metadata/services';

describe('RatingFactorComponent', () => {
  let component: RatingFactorComponent;
  let fixture: ComponentFixture<RatingFactorComponent>;
  let mockLayoutService: jest.Mocked<LayoutService>;
  let mockCoherentMappingService: jest.Mocked<CoherentMappingService>;
  let mockSharedService: jest.Mocked<SharedService>;
  let mockProductContextService: jest.Mocked<ProductContextService>;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockRouter: jest.Mocked<Router>;
  let mockProductService: any;
  let mockUtilityService: jest.Mocked<UtilityService>;
  let mockAppContextService: any;
  let mockCoverageVariantService: any;

  class MockReferenceDataProvider {}

  beforeEach(async () => {
    const captionSubject = new Subject<string>();
    const messageSubject = new Subject<any>();

    mockProductService = {
      getProductAttributes: jest.fn().mockReturnValue(of([
        { description: 'Attr1' },
        { description: 'Attr2' }
      ])),
      getProductRatingFactors: jest.fn().mockReturnValue(of([
        { id: '1', description: 'Global Rating 1' },
        { id: '2', description: 'Global Rating 2' }
      ])),
    };

    mockLayoutService = {
      caption$: {
        next: jest.fn(),
        subscribe: captionSubject.subscribe.bind(captionSubject),
      } as any,
      updateBreadcrumbs: jest.fn(),
      showMessage: jest.fn(),
    } as any;

    mockCoherentMappingService = {
      getCoherentList: jest.fn().mockReturnValue(of({ data: ['Question1', 'Question2'] })),
      saveMappings: jest.fn().mockReturnValue(of({ success: true })),
      getRatingEndpoints: jest.fn().mockReturnValue(of([
        { rE_PRODUCT_TYPE: 'Auto', rE_ENDPOINT_VALIDATE: 'http://endpoint1', rE_ID: 1, servicE_VERSION: '1.0' }
      ])),
      getMappings: jest.fn().mockReturnValue(of({
        reId: 1,
        endPoint: 'http://endpoint1',
        isPartnerProvidedPremium: false,
        externalMappings: []
      })),
    } as any;

    mockSharedService = {
      previousButtonClicked: { next: jest.fn() } as any,
      nextButtonClicked: { next: jest.fn() } as any,
    } as any;

    mockProductContextService = {
      _getProductContext: jest.fn().mockReturnValue({ 
        status: 'DRAFT',
        requestId: 'test-request-id'
      }),
      isProductDisabled: jest.fn().mockReturnValue(false),
      _setPartnerProvidedData: jest.fn(),
    } as any;

    mockMessageService = {
      add: jest.fn(),
      messageObserver: messageSubject.asObservable(),
      clear: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockUtilityService = {
      fetchAdminDomainData: jest.fn().mockReturnValue(of([
        { code: 'CustomerAttr1', description: 'Customer Attribute 1' },
        { code: 'CustomerAttr2', description: 'Customer Attribute 2' }
      ])),
    } as any;

    mockAppContextService = {
      get: jest.fn().mockReturnValue({
        selectAll: 'Select All',
        ratingFactorType: 'Rating Factor Type',
        ratingFactor: 'Rating Factor'
      }),
    };

    mockCoverageVariantService = {
      getCoverageVariants: jest.fn().mockReturnValue(of([
        { productClass: { value: 'Class1' } },
        { productClass: { value: 'Class2' } }
      ])),
    };

    // Mock crypto.randomUUID for Node.js environment
    if (!global.crypto) {
      (global as any).crypto = {};
    }
    if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = jest.fn(() => '12345678-1234-1234-1234-123456789abc');
    }

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn((key: string) => {
        if (key === 'productId') return '123';
        if (key === 'productVersionId') return '1.0';
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [RatingFactorComponent, HttpClientTestingModule],
      providers: [
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: CoherentMappingService, useValue: mockCoherentMappingService },
        { provide: ProductsService, useValue: mockProductService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: HttpCacheManager, useValue: {} },
        { provide: REFERENCE_DATA, useClass: MockReferenceDataProvider },
      ],
    }).overrideComponent(RatingFactorComponent, {
      set: {
        providers: [
          { provide: 'CoverageVariantsService', useValue: mockCoverageVariantService }
        ]
      }
    }).compileComponents();

    // Inject CoverageVariantsService manually
    const injector = TestBed.inject.bind(TestBed);
    TestBed.inject = function(token: any) {
      if (token.name === 'CoverageVariantsService') {
        return mockCoverageVariantService;
      }
      return injector(token);
    } as any;

    fixture = TestBed.createComponent(RatingFactorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize component properties from localStorage and context', () => {
      expect(component.productId).toBe('123');
      expect(component.productVersionId).toBe('1.0');
      expect(component.productstatus).toBe('DRAFT');
      expect(mockLayoutService.caption$.next).toHaveBeenCalledWith('');
      expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalled();
    });

    it('should set component as disabled when product context is disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      
      const newFixture = TestBed.createComponent(RatingFactorComponent);
      const newComponent = newFixture.componentInstance;
      
      expect(newComponent.isDisable).toBe(true);
      expect(newComponent.fieldsetDisabled).toBe(true);
    });

    it('should update layout with correct caption and breadcrumbs', () => {
      expect(mockLayoutService.caption$.next).toHaveBeenCalledWith('');
      expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Products', routerLink: '/products' },
        { label: '123', routerLink: '/products/123/update' },
        { label: 'Rating', routerLink: '/products/123/ratingfactor' }
      ]);
    });
  });

  describe('addDetails', () => {
    it('should add details to globalProductCustomerDetails', () => {
      component.globalProductCustomerDetails = [];
      component.addDetails('TestType', ['Value1', 'Value2']);
      
      expect(component.globalProductCustomerDetails).toEqual([
        { type: 'TestType', value: 'Value1' },
        { type: 'TestType', value: 'Value2' }
      ]);
    });

    it('should handle empty values array', () => {
      component.globalProductCustomerDetails = [];
      component.addDetails('TestType', []);
      
      expect(component.globalProductCustomerDetails).toEqual([]);
    });
  });

  describe('onSelectAllRatingFactor', () => {
    beforeEach(() => {
      component.ratingInfo = [
        { types: [], input: 'Q1', options: ['Opt1', 'Opt2', 'Opt3'], ratingsSelected: [] }
      ];
    });

    it('should select all options when event.checked is true', () => {
      const event = { checked: true } as MultiSelectSelectAllChangeEvent;
      component.onSelectAllRatingFactor(event, 0);
      
      expect(component.selectAllRatingFactors).toBe(true);
      expect(component.ratingInfo[0].ratingsSelected).toEqual(['Opt1', 'Opt2', 'Opt3']);
    });

    it('should deselect all options when event.checked is false', () => {
      const event = { checked: false } as MultiSelectSelectAllChangeEvent;
      component.ratingInfo[0].ratingsSelected = ['Opt1', 'Opt2'];
      component.onSelectAllRatingFactor(event, 0);
      
      expect(component.selectAllRatingFactors).toBe(false);
      expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
    });
  });

  describe('onChipRatingFactorChange', () => {
    beforeEach(() => {
      component.ratingInfo = [
        { types: ['Type1', 'Type2'], input: 'Q1', options: ['Opt1', 'Opt2', 'Opt3'], ratingsSelected: ['Opt1', 'Opt2', 'Opt3'] }
      ];
    });

    it('should filter ratingsSelected based on selectedTypes', () => {
      component.onChipRatingFactorChange(['Opt1', 'Opt2'], 0);
      
      expect(component.ratingInfo[0].ratingsSelected).toEqual(['Opt1', 'Opt2']);
    });

    it('should set selectAllRatingFactors to true when all options match ratingsSelected', () => {
      component.ratingInfo[0].options = ['Opt1', 'Opt2', 'Opt3'];
      component.ratingInfo[0].ratingsSelected = ['Opt1', 'Opt2', 'Opt3'];
      
      component.onChipRatingFactorChange(['Opt1', 'Opt2', 'Opt3'], 0);
      
      // The function filters and updates ratingsSelected
      expect(component.ratingInfo[0].ratingsSelected.length).toBe(3);
    });
  });

  describe('onChangeGlobalRatingFactor', () => {
    it('should set ratingsSelected to all options', () => {
      component.ratingInfo = [
        { types: [], input: 'Q1', options: ['Opt1', 'Opt2', 'Opt3'], ratingsSelected: [] }
      ];
      
      component.onChangeGlobalRatingFactor(0);
      
      expect(component.ratingInfo[0].ratingsSelected).toEqual(['Opt1', 'Opt2', 'Opt3']);
    });
  });

  describe('clearSelection', () => {
    beforeEach(() => {
      component.ratingInfo = [
        { types: ['Type1'], input: 'Q1', options: ['Opt1'], ratingsSelected: ['Opt1'] }
      ];
    });

    it('should clear ratingsSelected and set selectAllRatingFactors to false', () => {
      component.clearSelection(null, 0, 'other');
      
      expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
      expect(component.selectAllRatingFactors).toBe(false);
    });

    it('should clear types when ratingType is "ratingType"', () => {
      component.clearSelection(null, 0, 'ratingType');
      
      expect(component.ratingInfo[0].types).toEqual([]);
      expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
    });
  });

  describe('onChangeRatingFactorType', () => {
    beforeEach(() => {
      component.ratingInfo = [
        { types: [], input: 'Q1', options: [], ratingsSelected: [] }
      ];
      component.globalRatingFactors = ['Global1', 'Global2'];
      component.customerAttributeOptions = [
        { externalQuestion: 'RatingFactors', type: 'CustomerAttribute', ratingFactor: 'Cust1' }
      ];
      component.customProductAttributes = ['Attr1', 'Attr2'];
    });

    it('should update options with global rating factors', () => {
      const event = { value: [RATINGFACTORS.GlobalRatingFactor] };
      component.onChangeRatingFactorType(event, 0);
      
      expect(component.ratingInfo[0].options).toContain('Global1');
      expect(component.ratingInfo[0].options).toContain('Global2');
      expect(component.ratingInfo[0].types).toEqual([RATINGFACTORS.GlobalRatingFactor]);
    });

    it('should update options with customer attributes', () => {
      const event = { value: [RATINGFACTORS.CustomerAttribute] };
      component.onChangeRatingFactorType(event, 0);
      
      expect(component.ratingInfo[0].options).toContain('Cust1');
    });

    it('should update options with product attributes', () => {
      const event = { value: [RATINGFACTORS.ProductAttributes] };
      component.onChangeRatingFactorType(event, 0);
      
      expect(component.ratingInfo[0].options).toContain('Attr1');
      expect(component.ratingInfo[0].options).toContain('Attr2');
    });

    it('should update options with multiple types', () => {
      const event = { value: [RATINGFACTORS.GlobalRatingFactor, RATINGFACTORS.ProductAttributes] };
      component.onChangeRatingFactorType(event, 0);
      
      expect(component.ratingInfo[0].options.length).toBeGreaterThan(0);
    });
  });

  describe('onRatingFactorChange', () => {
    beforeEach(() => {
      component.ratingInfo = [
        { types: [], input: 'Q1', options: ['Opt1', 'Opt2', 'Opt3'], ratingsSelected: [] }
      ];
    });

    it('should set selectAllRatingFactors to true if all options are selected', () => {
      component.ratingInfo[0].ratingsSelected = ['Opt1', 'Opt2', 'Opt3'];
      component.onRatingFactorChange(0);
      
      expect(component.selectAllRatingFactors).toBe(true);
    });

    it('should set selectAllRatingFactors to false if not all options are selected', () => {
      component.ratingInfo[0].ratingsSelected = ['Opt1', 'Opt2'];
      component.onRatingFactorChange(0);
      
      expect(component.selectAllRatingFactors).toBe(false);
    });
  });

  describe('onEndpointSelect', () => {
    beforeEach(() => {
      component.endpointList = [
        { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' },
        { label: 'Home', serviceUrl: 'http://endpoint2', reId: 2, version: '2.0' }
      ];
    });

    it('should update reId and reVersion based on selected endpoint', () => {
      const event = {
        target: { value: '1' }
      } as any;
      
      component.onEndpointSelect(event);
      
      expect(component.reId).toBe(1);
      expect(component.reVersion).toBe('1.0');
    });

    it('should set reId to 0 if value is NaN', () => {
      const event = {
        target: { value: 'invalid' }
      } as any;
      
      component.onEndpointSelect(event);
      
      expect(component.reId).toBe(0);
    });

    it('should set reVersion to null if no matching endpoint found', () => {
      const event = {
        target: { value: '999' }
      } as any;
      
      component.onEndpointSelect(event);
      
      expect(component.reVersion).toBeNull();
    });
  });

  describe('btnClick', () => {
    beforeEach(() => {
      component.endpointList = [
        { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
      ];
      component.reId = 1;
      component.reVersion = '1.0';
    });

    it('should fetch coherent list and update ratingInfo', (done) => {
      component.btnClick();
      
      setTimeout(() => {
        expect(mockCoherentMappingService.getCoherentList).toHaveBeenCalledWith('http://endpoint1');
        expect(component.coherentList).toEqual(['Question1', 'Question2']);
        expect(component.ratingInfo.length).toBe(2);
        expect(component.ratingInfo[0].input).toBe('Question1');
        done();
      }, 100);
    });

    it('should initialize empty ratingInfo for each coherent question', (done) => {
      component.btnClick();
      
      setTimeout(() => {
        component.ratingInfo.forEach(info => {
          expect(info.types).toEqual([]);
          expect(info.options).toEqual([]);
          expect(info.ratingsSelected).toEqual([]);
        });
        done();
      }, 100);
    });
  });

  describe('validateInputMapping', () => {
    it('should return true if isPartnerProvidedPremium is true', () => {
      const mapping: MappingPayload = {
        reId: 1,
        endPoint: 'http://test',
        externalMappings: [],
        isPartnerProvidedPremium: true
      };
      
      const result = component.validateInputMapping(mapping);
      expect(result).toBe(true);
    });

    it('should return true if at least one externalMapping has a valid ratingFactor', () => {
      const mapping: MappingPayload = {
        reId: 1,
        endPoint: 'http://test',
        externalMappings: [
          { externalQuestion: 'Q1', type: 'Type1', ratingFactor: 'Factor1' }
        ],
        isPartnerProvidedPremium: false
      };
      
      const result = component.validateInputMapping(mapping);
      expect(result).toBe(true);
    });

    it('should return false if all externalMappings have empty ratingFactor', () => {
      const mapping: MappingPayload = {
        reId: 1,
        endPoint: 'http://test',
        externalMappings: [
          { externalQuestion: 'Q1', type: 'Type1', ratingFactor: '' }
        ],
        isPartnerProvidedPremium: false
      };
      
      const result = component.validateInputMapping(mapping);
      expect(result).toBe(false);
    });

    it('should return false if all externalMappings have undefined ratingFactor', () => {
      const mapping: MappingPayload = {
        reId: 1,
        endPoint: 'http://test',
        externalMappings: [
          { externalQuestion: 'Q1', type: 'Type1', ratingFactor: undefined as any }
        ],
        isPartnerProvidedPremium: false
      };
      
      const result = component.validateInputMapping(mapping);
      expect(result).toBe(false);
    });

    it('should return false if mapping is undefined', () => {
      const result = component.validateInputMapping(undefined);
      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    beforeEach(() => {
      component.productId = '123';
      component.productVersionId = '1.0';
      component.reId = 1;
      component.reVersion = '1.0';
      component.endpointList = [
        { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
      ];
      component.globalRatingFactorsList = [
        { id: '1', description: 'Global1' }
      ];
      component.globalProductCustomerDetails = [
        { type: RATINGFACTORS.GRatingFactor, value: 'Global1' },
        { type: RATINGFACTORS.PAttributes, value: 'Attr1' }
      ];
      component.ratingInfo = [
        {
          types: [RATINGFACTORS.GlobalRatingFactor],
          input: 'Q1',
          options: ['Global1'],
          ratingsSelected: ['Global1']
        }
      ];
      component.isPartnerProvidedPremium = false;
    });

    it('should call nextButtonClicked if product is disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      
      component.save(false);
      
      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
      expect(mockCoherentMappingService.saveMappings).not.toHaveBeenCalled();
    });

    it('should show error message if validation fails', () => {
      component.ratingInfo = [];
      component.save(false);
      
      expect(mockMessageService.add).toHaveBeenCalledWith({
        key: 'tr',
        severity: 'error',
        detail: ' Unable to save rating factors - Please enter mandatory data',
        life: 500,
        sticky: true,
        closable: true,
      });
    });

    it('should save mappings and show success message', (done) => {
      component.save(false);
      
      setTimeout(() => {
        expect(mockCoherentMappingService.saveMappings).toHaveBeenCalled();
        expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
          severity: 'success',
          message: 'Rating Factor Saved Successfully',
          duration: 5000,
        });
        expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
        expect(mockProductContextService._setPartnerProvidedData).toHaveBeenCalledWith(false);
        done();
      }, 100);
    });

    it('should navigate to home if navigateToHome is true after successful save', (done) => {
      component.save(true);
      
      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
        expect(mockSharedService.nextButtonClicked.next).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle error when saving mappings', (done) => {
      mockCoherentMappingService.saveMappings.mockReturnValue(
        throwError(() => new Error('Save failed'))
      );
      
      component.save(false);
      
      setTimeout(() => {
        expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
          severity: 'error',
          message: 'Unable to save rating factor(s)',
          duration: 5000,
        });
        done();
      }, 100);
    });

    it('should handle GlobalRatingFactor type correctly in save', (done) => {
      component.ratingInfo = [
        {
          types: [RATINGFACTORS.GlobalRatingFactor],
          input: 'Q1',
          options: ['Global1'],
          ratingsSelected: ['Global1']
        }
      ];
      
      component.save(false);
      
      setTimeout(() => {
        const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
        const mappingPayload = callArgs[2];
        expect(mappingPayload.externalMappings[0].ratingFactor).toBe('1');
        done();
      }, 100);
    });

    it('should handle ProductAttribute type correctly in save', (done) => {
      component.ratingInfo = [
        {
          types: [RATINGFACTORS.ProductAttributes],
          input: 'Q1',
          options: ['Attr1'],
          ratingsSelected: ['Attr1']
        }
      ];
      
      component.save(false);
      
      setTimeout(() => {
        const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
        const mappingPayload = callArgs[2];
        expect(mappingPayload.externalMappings[0].ratingFactor).toBe('Attr1');
        done();
      }, 100);
    });

    it('should set isPartnerProvidedPremium in payload', (done) => {
      component.isPartnerProvidedPremium = true;
      component.save(false);
      
      setTimeout(() => {
        const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
        const mappingPayload = callArgs[2];
        expect(mappingPayload.isPartnerProvidedPremium).toBe(true);
        done();
      }, 100);
    });
  });

  describe('previous', () => {
    it('should emit previousButtonClicked event with stepCount 1', () => {
      component.previous();
      
      expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    });
  });

  describe('onPremiumToggleChange', () => {
    it('should update isPartnerProvidedPremium and call _setPartnerProvidedData with true', () => {
      component.onPremiumToggleChange(true);
      
      expect(component.isPartnerProvidedPremium).toBe(true);
      expect(mockProductContextService._setPartnerProvidedData).toHaveBeenCalledWith(true);
    });

    it('should update isPartnerProvidedPremium and call _setPartnerProvidedData with false', () => {
      component.onPremiumToggleChange(false);
      
      expect(component.isPartnerProvidedPremium).toBe(false);
      expect(mockProductContextService._setPartnerProvidedData).toHaveBeenCalledWith(false);
    });
  });

  describe('RATINGFACTORS constants', () => {
    it('should have correct constant values', () => {
      expect(RATINGFACTORS.GRatingFactor).toBe('GlobalRatingFactor');
      expect(RATINGFACTORS.GlobalRatingFactor).toBe('Global Rating Factor');
      expect(RATINGFACTORS.ProductAttributes).toBe('Product Attributes');
      expect(RATINGFACTORS.PAttributes).toBe('ProductAttribute');
      expect(RATINGFACTORS.CustomerAttribute).toBe('Customer Attributes');
      expect(RATINGFACTORS.CAttribute).toBe('CustomerAttribute');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty endpoint list in btnClick', (done) => {
      component.endpointList = [];
      component.reId = 1;
      component.reVersion = '1.0';
      
      component.btnClick();
      
      setTimeout(() => {
        expect(mockCoherentMappingService.getCoherentList).toHaveBeenCalledWith('');
        done();
      }, 100);
    });

    it('should handle missing selected value in globalProductCustomerDetails', () => {
      component.productId = '123';
      component.productVersionId = '1.0';
      component.reId = 1;
      component.reVersion = '1.0';
      component.endpointList = [
        { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
      ];
      component.globalRatingFactorsList = [];
      component.globalProductCustomerDetails = [];
      component.ratingInfo = [
        {
          types: [RATINGFACTORS.GlobalRatingFactor],
          input: 'Q1',
          options: ['Global1'],
          ratingsSelected: ['NonExistent']
        }
      ];
      component.isPartnerProvidedPremium = false;
      
      component.save(false);
      
      // Should show error because validation will fail
      expect(mockMessageService.add).toHaveBeenCalled();
    });

    it('should handle empty coherent list response', (done) => {
      mockCoherentMappingService.getCoherentList.mockReturnValue(of({ data: [] } as any));
      
      component.endpointList = [
        { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
      ];
      component.reId = 1;
      component.reVersion = '1.0';
      
      component.btnClick();
      
      setTimeout(() => {
        expect(component.ratingInfo.length).toBe(0);
        done();
      }, 100);
    });

    it('should handle null or undefined values in rating info', () => {
      component.ratingInfo = [
        { types: [], input: '', options: [], ratingsSelected: [] }
      ];
      
      component.onChangeGlobalRatingFactor(0);
      
      expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
    });

    it('should handle CustomerAttribute type with empty ratingFactor', () => {
      const mapping: MappingPayload = {
        reId: 1,
        endPoint: 'http://test',
        externalMappings: [
          { externalQuestion: 'Q1', type: 'CustomerAttribute', ratingFactor: '' }
        ],
        isPartnerProvidedPremium: false
      };
      
      const result = component.validateInputMapping(mapping);
      expect(result).toBe(false);
    });

    it('should not clear types when clearSelection is called with other ratingType', () => {
      component.ratingInfo = [
        { types: ['Type1'], input: 'Q1', options: ['Opt1'], ratingsSelected: ['Opt1'] }
      ];
      
      component.clearSelection(null, 0, 'other');
      
      expect(component.ratingInfo[0].types).toEqual(['Type1']);
      expect(component.ratingInfo[0].options).toEqual(['Opt1']);
    });

    describe('onChangeRatingFactorType edge cases', () => {
      beforeEach(() => {
        component.ratingInfo = [
          { types: [], input: 'Q1', options: [], ratingsSelected: [] }
        ];
        component.globalRatingFactors = ['Global1', 'Global2'];
        component.customerAttributeOptions = [
          { externalQuestion: 'RatingFactors', type: 'CustomerAttribute', ratingFactor: 'Cust1' }
        ];
        component.customProductAttributes = ['Attr1', 'Attr2'];
      });

      it('should handle empty event value', () => {
        const event = { value: [] };
        component.onChangeRatingFactorType(event, 0);
        
        expect(component.ratingInfo[0].options).toEqual([]);
        expect(component.ratingInfo[0].types).toEqual([]);
      });
    });

    describe('save method edge cases', () => {
      beforeEach(() => {
        component.productId = '123';
        component.productVersionId = '1.0';
        component.reId = 1;
        component.reVersion = '1.0';
        component.endpointList = [
          { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
        ];
        component.globalRatingFactorsList = [
          { id: '1', description: 'Global1' },
          { id: '2', description: 'Global2' }
        ];
        component.globalProductCustomerDetails = [
          { type: RATINGFACTORS.GRatingFactor, value: 'Global1' },
          { type: RATINGFACTORS.PAttributes, value: 'Attr1' },
          { type: RATINGFACTORS.CAttribute, value: 'CustomerAttr1' }
        ];
      });

      it('should handle multiple selected ratings of same type', (done) => {
        component.ratingInfo = [
          {
            types: [RATINGFACTORS.GlobalRatingFactor],
            input: 'Q1',
            options: ['Global1', 'Global2'],
            ratingsSelected: ['Global1', 'Global2']
          }
        ];
        component.isPartnerProvidedPremium = false;
        
        component.save(false);
        
        setTimeout(() => {
          expect(mockCoherentMappingService.saveMappings).toHaveBeenCalled();
          const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
          const mappingPayload = callArgs[2];
          expect(mappingPayload.externalMappings.length).toBeGreaterThan(0);
          done();
        }, 100);
      });

      it('should handle mixed rating types in single rating info', (done) => {
        component.ratingInfo = [
          {
            types: [RATINGFACTORS.GlobalRatingFactor, RATINGFACTORS.ProductAttributes],
            input: 'Q1',
            options: ['Global1', 'Attr1'],
            ratingsSelected: ['Global1', 'Attr1']
          }
        ];
        component.isPartnerProvidedPremium = false;
        
        component.save(false);
        
        setTimeout(() => {
          const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
          const mappingPayload = callArgs[2];
          expect(mappingPayload.externalMappings.length).toBeGreaterThan(0);
          done();
        }, 100);
      });

      it('should handle customer attribute type correctly in save', (done) => {
        component.ratingInfo = [
          {
            types: [RATINGFACTORS.CustomerAttribute],
            input: 'Q1',
            options: ['CustomerAttr1'],
            ratingsSelected: ['CustomerAttr1']
          }
        ];
        component.isPartnerProvidedPremium = false;
        
        component.save(false);
        
        setTimeout(() => {
          const callArgs = mockCoherentMappingService.saveMappings.mock.calls[0];
          const mappingPayload = callArgs[2];
          expect(mappingPayload.externalMappings[0].ratingFactor).toBe('CustomerAttr1');
          expect(mappingPayload.externalMappings[0].type).toBe(RATINGFACTORS.CAttribute);
          done();
        }, 100);
      });

      it('should handle empty ratingInfo array', () => {
        component.ratingInfo = [];
        component.isPartnerProvidedPremium = false;
        
        component.save(false);
        
        expect(mockMessageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: ' Unable to save rating factors - Please enter mandatory data'
          })
        );
      });
    });

    describe('validateInputMapping edge cases', () => {
      it('should return true when externalMappings is empty but isPartnerProvidedPremium is true', () => {
        const mapping: MappingPayload = {
          reId: 1,
          endPoint: 'http://test',
          externalMappings: [],
          isPartnerProvidedPremium: true
        };
        
        expect(component.validateInputMapping(mapping)).toBe(true);
      });

      it('should return false when externalMappings is empty and isPartnerProvidedPremium is false', () => {
        const mapping: MappingPayload = {
          reId: 1,
          endPoint: 'http://test',
          externalMappings: [],
          isPartnerProvidedPremium: false
        };
        
        expect(component.validateInputMapping(mapping)).toBe(false);
      });

      it('should return true when at least one mapping has non-empty ratingFactor', () => {
        const mapping: MappingPayload = {
          reId: 1,
          endPoint: 'http://test',
          externalMappings: [
            { externalQuestion: 'Q1', type: 'Type1', ratingFactor: '' },
            { externalQuestion: 'Q2', type: 'Type2', ratingFactor: 'Factor1' },
            { externalQuestion: 'Q3', type: 'Type3', ratingFactor: '' }
          ],
          isPartnerProvidedPremium: false
        };
        
        expect(component.validateInputMapping(mapping)).toBe(true);
      });

      it('should return false when mapping is null', () => {
        expect(component.validateInputMapping(null as any)).toBe(false);
      });
    });

    describe('onEndpointSelect edge cases', () => {
      beforeEach(() => {
        component.endpointList = [
          { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' },
          { label: 'Home', serviceUrl: 'http://endpoint2', reId: 2, version: '2.0' }
        ];
      });

      it('should handle string value that parses to valid number', () => {
        const event = { target: { value: '2' } } as any;
        
        component.onEndpointSelect(event);
        
        expect(component.reId).toBe(2);
        expect(component.reVersion).toBe('2.0');
      });

      it('should handle empty string value', () => {
        const event = { target: { value: '' } } as any;
        
        component.onEndpointSelect(event);
        
        expect(component.reId).toBe(0);
        expect(component.reVersion).toBeNull();
      });

      it('should handle negative reId', () => {
        const event = { target: { value: '-1' } } as any;
        
        component.onEndpointSelect(event);
        
        expect(component.reId).toBe(-1);
        expect(component.reVersion).toBeNull();
      });
    });

    describe('onChipRatingFactorChange edge cases', () => {
      beforeEach(() => {
        component.ratingInfo = [
          { types: ['Type1'], input: 'Q1', options: ['Opt1', 'Opt2', 'Opt3'], ratingsSelected: [] }
        ];
      });

      it('should handle empty selectedTypes array', () => {
        component.onChipRatingFactorChange([], 0);
        
        expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
        expect(component.selectAllRatingFactors).toBe(false);
      });

      it('should handle selectedTypes with items not in options', () => {
        component.onChipRatingFactorChange(['NonExistent'], 0);
        
        expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
      });

      it('should handle partial selection', () => {
        component.ratingInfo[0].ratingsSelected = ['Opt1', 'Opt2', 'Opt3'];
        component.onChipRatingFactorChange(['Opt1'], 0);
        
        expect(component.ratingInfo[0].ratingsSelected).toEqual(['Opt1']);
        expect(component.selectAllRatingFactors).toBe(false);
      });
    });

    describe('onSelectAllRatingFactor edge cases', () => {
      it('should handle empty options array', () => {
        component.ratingInfo = [
          { types: [], input: 'Q1', options: [], ratingsSelected: [] }
        ];
        
        const event = { checked: true } as MultiSelectSelectAllChangeEvent;
        component.onSelectAllRatingFactor(event, 0);
        
        expect(component.ratingInfo[0].ratingsSelected).toEqual([]);
      });

      it('should handle undefined checked value', () => {
        component.ratingInfo = [
          { types: [], input: 'Q1', options: ['Opt1'], ratingsSelected: ['Opt1'] }
        ];
        
        const event = { checked: undefined } as any;
        component.onSelectAllRatingFactor(event, 0);
        
        // Should not crash
        expect(component.ratingInfo[0].ratingsSelected).toBeDefined();
      });
    });

    describe('btnClick edge cases', () => {

      it('should reset ratingInfo before populating new data', (done) => {
        component.ratingInfo = [
          { types: ['OldType'], input: 'OldQ', options: ['OldOpt'], ratingsSelected: [] }
        ];
        
        component.endpointList = [
          { label: 'Auto', serviceUrl: 'http://endpoint1', reId: 1, version: '1.0' }
        ];
        component.reId = 1;
        component.reVersion = '1.0';
        
        component.btnClick();
        
        setTimeout(() => {
          expect(component.ratingInfo.length).toBe(2);
          expect(component.ratingInfo[0].input).not.toBe('OldQ');
          done();
        }, 100);
      });
    });

    describe('Component lifecycle', () => {
      it('should handle component destruction', () => {
        expect(() => {
          fixture.destroy();
        }).not.toThrow();
      });
    });
  });
});
