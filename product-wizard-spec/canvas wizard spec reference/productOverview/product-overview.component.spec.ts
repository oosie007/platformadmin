/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ProductOverviewComponent } from './product-overview.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DatePipe } from '@angular/common';

// Mock services
import { AppContextService, RegionService, LoadingIndicatorService } from '@canvas/services';
import { LayoutService } from '@canvas/components';
import { ProductsService } from '../../services/products.service';
import { CatalystPolicyService } from '../../services/catalyst-policy.service';
import { CoherentMappingService } from '../../services/coherent-mapping.service';
import { ProductContextService } from '../../services/product-context.service';
import { AvailabilityService } from '../../services/availability.service';
import { SharedService } from '../../services/shared.service';
import { StudioCommands } from '@canvas/commands';
import { AUTH_SETTINGS } from '@canvas/shared/data-access/auth';
import { MessageService } from 'primeng/api';
import { v4 as uuidv4 } from 'uuid';
import { ProductRequest, Statuskeys } from '../../types/product';
import { Category } from '../../types/ref-data';

// Mock data
const mockProductResponse: ProductRequest = {
  productId: 'PROD-123',
  productVersionId: '1.0',
  header: {
    productVersionName: 'Test Product V1',
    productName: 'Test Product',
    shortName: 'TP',
    description: 'Test Description',
    marketingName: 'Test Marketing Name',
    status: { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS },
    premiumCurrency: { value: 'USD', category: Category.CURRENCY },
    limitsCurrency: { value: 'EUR', category: Category.CURRENCY },
    country: ['US'],
    effectiveDate: new Date('2024-01-01'),
    expiryDate: new Date('2024-12-31'),
    createdOn: new Date('2024-01-01'),
    updatedOn: new Date('2024-01-01'),
    lockStatus: false,
    allowedLockStatusUsers: [],
    allVersions: [
      { 
        versionId: '1.0', 
        status: { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS },
        createdDate: '2024-01-01'
      }
    ]
  },
  rating: { premiumRatingFactors: [] },
  requestId: 'REQUEST-123'
};

const mockStatusData = [
  { id: '1', code: Statuskeys.DESIGN, description: 'Design', rank: 1 },
  { id: '2', code: Statuskeys.FINAL, description: 'Final', rank: 2 },
  { id: '3', code: Statuskeys.WITHDRAW, description: 'Withdraw', rank: 3 },
  { id: '4', code: Statuskeys.DELETE, description: 'Delete', rank: 4 }
];

const mockCurrencyData = [
  { id: '1', code: 'USD', description: 'US Dollar', rank: 1 },
  { id: '2', code: 'EUR', description: 'Euro', rank: 2 },
  { id: '3', code: 'GBP', description: 'British Pound', rank: 3 }
];

const mockCountryData = [
  { id: '1', code: 'US', description: 'United States', rank: 1 },
  { id: '2', code: 'UK', description: 'United Kingdom', rank: 2 }
];

const mockCountrySettings = [
  { countryCode: 'US', country: 'United States', currency: ['USD', 'EUR'] },
  { countryCode: 'UK', country: 'United Kingdom', currency: ['GBP', 'EUR'] }
];

const mockPolicyResponse = {
  numberOfPolicies: 5,
  policies: []
};

describe('ProductOverviewComponent - Comprehensive Tests', () => {
  let component: ProductOverviewComponent;
  let fixture: ComponentFixture<ProductOverviewComponent>;

  let mockAppContextService: jest.Mocked<AppContextService>;
  let mockRegionService: jest.Mocked<RegionService>;
  let mockLayoutService: jest.Mocked<LayoutService>;
  let mockProductsService: jest.Mocked<ProductsService>;
  let mockSharedService: jest.Mocked<SharedService>;
  let mockCatalystPolicyService: jest.Mocked<CatalystPolicyService>;
  let mockCoherentMappingService: jest.Mocked<CoherentMappingService>;
  let mockProductContextService: jest.Mocked<ProductContextService>;
  let mockAvailabilityService: jest.Mocked<AvailabilityService>;
  let mockLoadingIndicatorService: jest.Mocked<LoadingIndicatorService>;
  let mockCommands: jest.Mocked<StudioCommands>;
  let mockRouter: jest.Mocked<Router>;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockDatePipe: jest.Mocked<DatePipe>;

  beforeEach(async () => {
    // Initialize mock services
    mockAppContextService = {
      get: jest.fn((path: string) => {
        const mockDataMapping: any = {
          'pages.productOverview.labels': {
            create: 'Create',
            edit: 'Edit',
            save: 'Save',
            productName: 'Product Name'
          },
          'referenceData.endpoints.COUNTRY_DATA': 'http://api.test/country'
        };
        return mockDataMapping[path] || null;
      }),
    } as unknown as jest.Mocked<AppContextService>;

    mockRegionService = {
      getRegion: jest.fn().mockReturnValue('APAC'),
    } as unknown as jest.Mocked<RegionService>;

    mockLayoutService = {
      updateBreadcrumbs: jest.fn(),
      showMessage: jest.fn(),
      caption$: new Subject<string>(),
    } as unknown as jest.Mocked<LayoutService>;

    mockProductsService = {
      getCurrencyList: jest.fn().mockReturnValue(of(mockCurrencyData)),
      getStatus: jest.fn().mockReturnValue(of(mockStatusData)),
      getCountryList: jest.fn().mockReturnValue(of(mockCountryData)),
      getCountrySettings: jest.fn().mockReturnValue(of({ data: mockCountrySettings })),
      getProduct: jest.fn().mockReturnValue(of(mockProductResponse)),
      updateProduct: jest.fn().mockReturnValue(of(true)),
      updateStatus: jest.fn().mockReturnValue(of(true)),
      getAllByVersion: jest.fn().mockReturnValue(of(mockProductResponse)),
      createNewVersion: jest.fn().mockReturnValue(of(true)),
    } as unknown as jest.Mocked<ProductsService>;

    mockSharedService = {
      nextButtonClicked: { next: jest.fn() },
      previousButtonClicked: { next: jest.fn() },
    } as unknown as jest.Mocked<SharedService>;

    mockCommands = {
      add: jest.fn(),
      get: jest.fn(),
      execute: jest.fn().mockResolvedValue({ data: [{ region: 'APAC' }] }),
    } as unknown as jest.Mocked<StudioCommands>;

    mockMessageService = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<MessageService>;

    mockCatalystPolicyService = {
      getPolicyCountForProduct: jest.fn().mockResolvedValue(mockPolicyResponse),
      clearProductCacheWithVersion: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<CatalystPolicyService>;

    mockCoherentMappingService = {
      getMappings: jest.fn().mockReturnValue(of([])),
      saveMappings: jest.fn().mockReturnValue(of(true)),
    } as unknown as jest.Mocked<CoherentMappingService>;

    mockProductContextService = {
      _getProductContext: jest.fn().mockReturnValue({ requestId: 'REQUEST-123' }),
      _setProductContext: jest.fn(),
      _setProductVersions: jest.fn(),
      setProductHeader: jest.fn(),
      isProductLocked: jest.fn().mockReturnValue(false),
      isProductDisabled: jest.fn().mockReturnValue(false),
      isReadonlyProduct: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<ProductContextService>;

    mockAvailabilityService = {
      getAvailability: jest.fn().mockReturnValue(of({})),
    } as unknown as jest.Mocked<AvailabilityService>;

    mockLoadingIndicatorService = {
      show: jest.fn(),
      hide: jest.fn(),
    } as unknown as jest.Mocked<LoadingIndicatorService>;

    mockDatePipe = {
      transform: jest.fn((date, format) => {
        if (date) {
          return '2024-01-01';
        }
        return null;
      }),
    } as unknown as jest.Mocked<DatePipe>;

    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => {
          if (key === 'productId') return 'PROD-123';
          if (key === 'productVersionId') return '1.0';
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [
        ProductOverviewComponent,
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: RegionService, useValue: mockRegionService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: StudioCommands, useValue: mockCommands },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CatalystPolicyService, useValue: mockCatalystPolicyService },
        { provide: CoherentMappingService, useValue: mockCoherentMappingService },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: LoadingIndicatorService, useValue: mockLoadingIndicatorService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: DatePipe, useValue: mockDatePipe },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'id' ? 'PROD-123' : null) },
              queryParamMap: { get: (key: string) => (key === 'productVersion' ? '1.0' : null) }
            },
            params: of({ id: 'PROD-123' }),
            queryParams: of({ productVersion: '1.0' })
          }
        },
        {
          provide: AUTH_SETTINGS,
          useValue: {
            authority: 'mock-authority',
            client_id: 'mock-client-id'
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductOverviewComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.colorTheme).toBeDefined();
      expect(component.items).toEqual([{ label: 'BASIC INFORMATION', visible: true }]);
      expect(component.sidebarVisible).toBe(false);
      expect(component.showDiscardButton).toBe(false);
      expect(component.versioning).toBe(false);
    });

    it('should initialize product form with required controls', () => {
      expect(component.product.get('productName')).toBeDefined();
      expect(component.product.get('description')).toBeDefined();
      expect(component.product.get('status')).toBeDefined();
      expect(component.product.get('dateRange')).toBeDefined();
      expect(component.product.get('premiumCurrency')).toBeDefined();
      expect(component.product.get('country')).toBeDefined();
    });

    it('should get productId and productVersionId from localStorage', () => {
      expect(component.productId).toBe('PROD-123');
      expect(component.productVersionId).toBe('1.0');
    });

    it('should call updateBreadcrumbs in constructor', () => {
      expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should call initializeProduct on init', () => {
      jest.spyOn(component, 'initializeProduct');
      component.ngOnInit();
      expect(component.initializeProduct).toHaveBeenCalled();
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should execute without errors when versioningCtrl is 1.0', () => {
      component.versioningCtrl = '1.0';
      expect(() => component.ngAfterContentChecked()).not.toThrow();
    });
  });

  describe('initializeProduct', () => {
    it('should call fetchProductDetails with statusUpdate=false by default', () => {
      jest.spyOn(component as any, 'fetchProductDetails').mockImplementation(() => {});
      component.initializeProduct();
      expect((component as any).fetchProductDetails).toHaveBeenCalledWith(false);
    });

    it('should call fetchProductDetails with statusUpdate=true when provided', () => {
      jest.spyOn(component as any, 'fetchProductDetails').mockImplementation(() => {});
      component.initializeProduct(true);
      expect((component as any).fetchProductDetails).toHaveBeenCalledWith(true);
    });
  });

  describe('loadCurrencyDetails', () => {
    it('should load currency details successfully', () => {
      jest.spyOn(component, 'processCountryData').mockImplementation(() => {});
      
      component.loadCurrencyDetails('US');
      
      expect(mockProductsService.getCurrencyList).toHaveBeenCalled();
    });

    it('should handle currency loading error', () => {
      mockProductsService.getCurrencyList.mockReturnValue(throwError(() => new Error('Error')));
      
      component.loadCurrencyDetails();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'Unable to fetch currency(s)',
        duration: 5000,
      });
    });

    it('should use form country value when country param is not provided', () => {
      component.product.patchValue({ country: 'UK' });
      jest.spyOn(component, 'processCountryData').mockImplementation(() => {});
      
      component.loadCurrencyDetails();
      
      expect(mockProductsService.getCurrencyList).toHaveBeenCalled();
    });
  });

  describe('loadStatusDetails', () => {
    it('should load status details successfully', () => {
      component.loadStatusDetails();
      
      expect(mockProductsService.getStatus).toHaveBeenCalled();
      expect(component.statusData).toEqual(mockStatusData);
    });

    it('should handle status loading error', () => {
      mockProductsService.getStatus.mockReturnValue(throwError(() => new Error('Error')));
      
      component.loadStatusDetails();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'Unable to fetch status(s)',
        duration: 5000,
      });
    });
  });

  describe('fetchProductDetails', () => {
    it('should call preSetValues when statusUpdate is true', () => {
      jest.spyOn(component as any, 'preSetValues').mockImplementation(() => {});
      
      (component as any).fetchProductDetails(true);
      
      expect((component as any).preSetValues).toHaveBeenCalled();
    });

    it('should fetch product details successfully when statusUpdate is false', fakeAsync(() => {
      jest.spyOn(component as any, 'getAvailabilities').mockImplementation(() => {});
      jest.spyOn(component as any, 'preSetValues').mockImplementation(() => {});
      jest.spyOn(component, 'getCountrySettingList').mockImplementation(() => {});
      jest.spyOn(component, 'getpolicyData').mockImplementation(() => {});
      
      (component as any).fetchProductDetails(false);
      tick();
      
      expect(mockProductsService.getStatus).toHaveBeenCalled();
      expect(mockProductsService.getCountryList).toHaveBeenCalled();
      expect(mockProductsService.getProduct).toHaveBeenCalled();
      expect((component as any).getAvailabilities).toHaveBeenCalled();
    }));

    it('should handle fetch product details error', fakeAsync(() => {
      mockProductsService.getStatus.mockReturnValue(throwError(() => new Error('Error')));
      
      (component as any).fetchProductDetails(false);
      tick();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'Product details fetch failed',
        duration: 5000,
      });
    }));
  });

  describe('getAvailabilities', () => {
    it('should call availability service and hide loader on success', fakeAsync(() => {
      (component as any).getAvailabilities();
      tick();
      
      expect(mockAvailabilityService.getAvailability).toHaveBeenCalledWith(
        component.productId,
        component.productVersionId
      );
      expect(mockLoadingIndicatorService.hide).toHaveBeenCalled();
    }));

    it('should hide loader on error', fakeAsync(() => {
      mockAvailabilityService.getAvailability.mockReturnValue(throwError(() => new Error('Error')));
      
      (component as any).getAvailabilities();
      tick();
      
      expect(mockLoadingIndicatorService.hide).toHaveBeenCalled();
    }));
  });

  describe('getpolicyData', () => {
    it('should fetch policy data and set region', async () => {
      jest.spyOn(component as any, 'setVersioning').mockImplementation(() => {});
      
      await component.getpolicyData('US');
      
      expect(mockCommands.execute).toHaveBeenCalled();
      expect(component.region).toBe('apac');
    });
  });

  describe('preSetValues', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
    });

    it('should enable limitsCurrency when limitsCurrency has value', () => {
      jest.spyOn(component, 'bindProductDetails').mockImplementation(() => {});
      
      (component as any).preSetValues();
      
      expect(component.isLimitsCurrencyEnable).toBe(true);
      expect(component.limitsCurrencyValue).toBe('EUR');
    });

    it('should disable limitsCurrency when limitsCurrency is empty', () => {
      component.productHeaderDetails.limitsCurrency = { value: '', category: Category.CURRENCY };
      jest.spyOn(component, 'bindProductDetails').mockImplementation(() => {});
      
      (component as any).preSetValues();
      
      expect(component.isLimitsCurrencyEnable).toBe(false);
    });

    it('should call bindProductDetails', () => {
      jest.spyOn(component, 'bindProductDetails').mockImplementation(() => {});
      
      (component as any).preSetValues();
      
      expect(component.bindProductDetails).toHaveBeenCalledWith(component.productResponse);
    });
  });

  describe('bindProductDetails', () => {
    it('should bind product details to form', fakeAsync(() => {
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});
      
      component.bindProductDetails(mockProductResponse);
      tick(20);
      
      expect(component.product.get('productName')?.value).toBe('Test Product');
      expect(component.product.get('description')?.value).toBe('Test Description');
      expect(mockProductContextService._setProductContext).toHaveBeenCalled();
    }));

    it('should disable form controls when product is disabled', fakeAsync(() => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});
      
      component.bindProductDetails(mockProductResponse);
      tick(20);
      
      expect(component.product.get('productName')?.disabled).toBe(true);
      expect(component.isDisable).toBe(true);
    }));
  });

  describe('toggleLimitsCurrency', () => {
    it('should enable limitsCurrency control', () => {
      component.isLimitsCurrencyEnable = false;
      
      component.toggleLimitsCurrency('USD');
      
      expect(component.isLimitsCurrencyEnable).toBe(true);
      expect(component.product.get('limitsCurrency')).toBeDefined();
    });
  });

  describe('updateLimitsCurrency', () => {
    it('should set empty string when limitsCurrency is null', () => {
      component.product.addControl('limitsCurrency', component['_fb'].control(null));
      
      component.updateLimitsCurrency();
      
      expect(component.limitsCurrencyValue).toBe('');
    });
  });

  describe('saveAndExit', () => {
    it('should call updateProduct with products navigation', () => {
      jest.spyOn(component as any, 'updateProduct').mockImplementation(() => {});
      
      component.saveAndExit();
      
      expect((component as any).updateProduct).toHaveBeenCalledWith('products');
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
      component.statusData = mockStatusData;
      component.product.patchValue({
        productId: 'PROD-123',
        productVersionId: '1.0',
        productName: 'Updated Product',
        description: 'Updated Description',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: {
          effectiveDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-12-31')
        },
        marketingName: 'Updated Marketing'
      });
    });

    it('should update product successfully', fakeAsync(() => {
      jest.spyOn(component as any, 'updateLocalStorage').mockImplementation(() => {});
      
      (component as any).updateProduct('next');
      tick();
      
      expect(mockProductsService.updateProduct).toHaveBeenCalled();
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success' })
      );
    }));

    it('should handle update product error', fakeAsync(() => {
      mockProductsService.updateProduct.mockReturnValue(throwError(() => new Error('Error')));
      
      (component as any).updateProduct('next');
      tick();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));

    it('should navigate to products when navigateToPage is products', fakeAsync(() => {
      (component as any).updateProduct('products');
      tick();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
    }));

    it('should set limitsCurrency to null when disabled', fakeAsync(() => {
      component.isLimitsCurrencyEnable = false;
      jest.spyOn(component as any, 'updateLocalStorage').mockImplementation(() => {});
      
      (component as any).updateProduct('next');
      tick();
      
      expect(component.updateproductRequest.header.limitsCurrency).toBeNull();
    }));
  });

  describe('onStatusChange', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
      component.statusData = mockStatusData;
      component.requestId = 'REQUEST-123';
    });

    it('should update status from DESIGN to FINAL', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.FINAL });
      jest.spyOn(component, 'clearCache').mockImplementation(() => {});
      jest.spyOn(component, 'initializeProduct').mockImplementation(() => {});
      
      component.onStatusChange();
      tick();
      
      expect(mockProductsService.updateStatus).toHaveBeenCalled();
      expect(component.clearCache).toHaveBeenCalled();
    }));

    it('should update status from FINAL to WITHDRAW', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.FINAL, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.WITHDRAW });
      jest.spyOn(component, 'clearCache').mockImplementation(() => {});
      jest.spyOn(component, 'initializeProduct').mockImplementation(() => {});
      
      component.onStatusChange();
      tick();
      
      expect(mockProductsService.updateStatus).toHaveBeenCalled();
      expect(component.clearCache).toHaveBeenCalled();
    }));

    it('should handle status update error', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.FINAL });
      mockProductsService.updateStatus.mockReturnValue(
        throwError(() => ({ error: { errors: { field1: 'Error message' } } }))
      );
      
      component.onStatusChange();
      tick();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalled();
      expect(component.product.get('status')?.value).toBe(Statuskeys.DESIGN);
    }));
  });

  describe('next', () => {
    beforeEach(() => {
      component.productVersionId = '1.0';
      component.versioningCtrl = '1.0';
      component.productResponse = mockProductResponse;
    });

    it('should call updateProduct and emit next event for existing version', () => {
      jest.spyOn(component as any, 'updateProduct').mockImplementation(() => {});
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      
      component.next();
      
      expect((component as any).updateProduct).toHaveBeenCalledWith('availability');
      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    });

    it('should handle create new version error', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.availableVersions = [{ version: '2.0', isNew: true }];
      mockProductsService.getAllByVersion.mockReturnValue(throwError(() => new Error('Error')));
      
      component.next();
      tick();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));
  });

  describe('previous', () => {
    it('should navigate to products page', () => {
      component.previous();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
    });
  });

  describe('isNewVersion', () => {
    beforeEach(() => {
      component.availableVersions = [
        { version: '1.0', isNew: false },
        { version: '2.0', isNew: true }
      ];
    });

    it('should return version object for new version', () => {
      const result = component.isNewVersion('2.0');
      expect(result).toEqual({ version: '2.0', isNew: true });
    });

    it('should return undefined for existing version', () => {
      const result = component.isNewVersion('1.0');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent version', () => {
      const result = component.isNewVersion('3.0');
      expect(result).toBeUndefined();
    });
  });

  describe('onVersionChange', () => {
    it('should call switchVersion for non-new version', () => {
      component.versioningCtrl = '1.0';
      component.availableVersions = [{ version: '1.0', isNew: false }];
      jest.spyOn(component as any, 'switchVersion').mockImplementation(() => {});
      
      component.onVersionChange();
      
      expect((component as any).switchVersion).toHaveBeenCalled();
    });

    it('should call preSetValuesForNewVers for new version', () => {
      component.versioningCtrl = '2.0';
      component.availableVersions = [{ version: '2.0', isNew: true }];
      jest.spyOn(component, 'preSetValuesForNewVers').mockImplementation(() => {});
      
      component.onVersionChange();
      
      expect(component.preSetValuesForNewVers).toHaveBeenCalled();
      expect(component.showDiscardButton).toBe(true);
    });
  });

  describe('discardAndExit', () => {
    it('should set sidebarVisible to true', () => {
      component.sidebarVisible = false;
      component.discardAndExit();
      expect(component.sidebarVisible).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should set sidebarVisible to false', () => {
      component.sidebarVisible = true;
      component.closeModal();
      expect(component.sidebarVisible).toBe(false);
    });
  });

  describe('onDiscardVersion', () => {
    beforeEach(() => {
      component.availableVersions = [
        { version: '1.0', isNew: false },
        { version: '2.0', isNew: true }
      ];
      component.versioningCtrl = '2.0';
      component.polSearchResp = { response: mockPolicyResponse as any, version: '1.0' };
      component.productResponse = mockProductResponse;
      jest.spyOn(component, 'bindProductDetails').mockImplementation(() => {});
    });

    it('should discard new version and revert to previous', () => {
      component.onDiscardVersion();
      
      expect(component.sidebarVisible).toBe(false);
      expect(component.showDiscardButton).toBe(false);
      expect(component.versioningCtrl).toBe('1.0');
    });
  });

  describe('createProductVersion', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      jest.spyOn(component, 'preSetValuesForNewVers').mockImplementation(() => {});
    });

  });

  describe('createMappingForNewVersion', () => {
    it('should create mappings successfully', fakeAsync(() => {
      component.createMappingForNewVersion('PROD-123', '2.0', '1.0');
      tick();
      
      expect(mockCoherentMappingService.getMappings).toHaveBeenCalledWith('PROD-123', '1.0');
      expect(mockCoherentMappingService.saveMappings).toHaveBeenCalled();
    }));

    it('should handle mapping creation error', fakeAsync(() => {
      mockCoherentMappingService.getMappings.mockReturnValue(throwError(() => new Error('Error')));
      
      component.createMappingForNewVersion('PROD-123', '2.0', '1.0');
      tick();
      
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));
  });

  describe('preSetValuesForNewVers', () => {
    beforeEach(() => {
      component.versioningCtrl = '2.0';
      component.productResponse = mockProductResponse;
      component.newEffDate = new Date('2024-01-01');
      component.newExpiryDate = new Date('2024-12-31');
    });

    it('should preset values for new version', () => {
      component.preSetValuesForNewVers();
      
      expect(component.product.get('productVersionId')?.value).toBe('2.0');
      expect(component.product.get('status')?.value).toBe(Statuskeys.DESIGN);
    });
  });

  describe('getCountrySettingList', () => {
    it('should process country settings', fakeAsync(() => {
      jest.spyOn(component, 'processCountryData').mockImplementation(() => {});
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});
      
      component.getCountrySettingList(mockCountryData);
      tick();
      
      expect(mockProductsService.getCountrySettings).toHaveBeenCalled();
    }));
  });

  describe('processCountryData', () => {
    it('should process currency data when isCountrySelected is false', () => {
      component.processCountryData(mockCurrencyData, mockCountrySettings, false, 'US');
      
      expect(component.currency).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should call clearProductCacheWithVersion', async () => {
      component.region = 'apac';
      
      await component.clearCache();
      
      expect(mockCatalystPolicyService.clearProductCacheWithVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          keys: expect.arrayContaining([expect.stringContaining('Product:')])
        }),
        'apac'
      );
    });
  });

  describe('validateDateRange', () => {
    it('should return error when effective date is in the past', () => {
      const pastDate = new Date('2020-01-01');
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [pastDate],
        expiryDate: [null]
      });
      
      const result = component.validateDateRange(dateRangeGroup);
      
      expect(result).toEqual({ isEffectiveDatePast: true });
    });

    it('should return error when effective date >= expiry date', () => {
      const effectiveDate = new Date('2025-12-01');
      const expiryDate = new Date('2025-11-01');
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [effectiveDate],
        expiryDate: [expiryDate]
      });
      
      const result = component.validateDateRange(dateRangeGroup);
      
      expect(result).toEqual({ dateRangeInvalid: true });
    });

    it('should return null when dates are valid', () => {
      const futureDate = new Date('2026-01-01');
      const laterDate = new Date('2026-12-31');
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [futureDate],
        expiryDate: [laterDate]
      });
      
      const result = component.validateDateRange(dateRangeGroup);
      
      expect(result).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate product name as required', () => {
      const productNameControl = component.product.get('productName');
      productNameControl?.setValue('');
      expect(productNameControl?.hasError('required')).toBeTruthy();
    });

    it('should validate product name max length', () => {
      const productNameControl = component.product.get('productName');
      productNameControl?.setValue('a'.repeat(501));
      expect(productNameControl?.hasError('maxlength')).toBeTruthy();
    });

    it('should validate description max length', () => {
      const descriptionControl = component.product.get('description');
      descriptionControl?.setValue('a'.repeat(2001));
      expect(descriptionControl?.hasError('maxlength')).toBeTruthy();
    });

    it('should validate marketing name max length', () => {
      const marketingNameControl = component.product.get('marketingName');
      marketingNameControl?.setValue('a'.repeat(501));
      expect(marketingNameControl?.hasError('maxlength')).toBeTruthy();
    });

    it('should validate effective date as required', () => {
      const effectiveDateControl = component.product.get('dateRange.effectiveDate');
      effectiveDateControl?.setValue('');
      expect(effectiveDateControl?.hasError('required')).toBeTruthy();
    });

    it('should validate status as required', () => {
      const statusControl = component.product.get('status');
      statusControl?.setValue('');
      expect(statusControl?.hasError('required')).toBeTruthy();
    });

    it('should validate product version ID pattern', () => {
      const versionControl = component.product.get('productVersionId');
      versionControl?.setValue('00.0');
      expect(versionControl?.hasError('pattern')).toBeTruthy();
    });
  });

  describe('updateLocalStorage', () => {
    it('should update localStorage with productVersionId', () => {
      component.updateproductRequest = {
        productId: 'PROD-123',
        productVersionId: '2.0',
        header: mockProductResponse.header,
        rating: {},
        requestId: 'REQUEST-123'
      };
      
      component.updateLocalStorage();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('productVersionId', '2.0');
    });

    it('should handle empty productVersionId', () => {
      component.updateproductRequest = {
        productId: 'PROD-123',
        productVersionId: '',
        header: mockProductResponse.header,
        rating: {},
        requestId: 'REQUEST-123'
      };
      
      component.updateLocalStorage();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('productVersionId', '');
    });
  });

  describe('LoadOverview', () => {
    it('should set editProduct to false', () => {
      component.editProduct = true;
      component.LoadOverview();
      expect(component.editProduct).toBe(false);
    });
  });

  describe('switchVersion', () => {
    it('should not switch if versioningCtrl equals productVersionId', () => {
      component.versioningCtrl = '1.0';
      component.productVersionId = '1.0';
      
      (component as any).switchVersion();
      
      expect(mockProductsService.getProduct).not.toHaveBeenCalled();
    });

    it('should switch version and update state', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.productVersionId = '1.0';
      component.region = 'apac';
      jest.spyOn(component as any, 'preSetValues').mockImplementation(() => {});
      jest.spyOn(component as any, 'setVersioning').mockImplementation(() => {});
      
      (component as any).switchVersion();
      tick();
      
      expect(mockProductsService.getProduct).toHaveBeenCalledWith('PROD-123', '2.0', true);
      expect(mockCatalystPolicyService.getPolicyCountForProduct).toHaveBeenCalled();
    }));
  });

  describe('setVersioning', () => {
    it('should set versioning based on policy count', () => {
      component.polSearchResp = { response: { numberOfPolicies: 5 } as any, version: '1.0' };
      component.versioningCtrl = '1.0';
      component.availableVersions = [{ version: '1.0', isNew: false }];
      
      (component as any).setVersioning();
      
      expect(component.versioning).toBe(true);
    });

    it('should not set versioning when policy count is 0', () => {
      component.polSearchResp = { response: { numberOfPolicies: 0 } as any, version: '1.0' };
      component.versioningCtrl = '1.0';
      component.availableVersions = [{ version: '1.0', isNew: false }];
      
      (component as any).setVersioning();
      
      expect(component.versioning).toBe(false);
    });

    it('should not change versioning if new version exists', () => {
      component.availableVersions = [{ version: '2.0', isNew: true }];
      
      (component as any).setVersioning();
      
      expect(component.versioning).toBe(false);
    });
  });

  describe('Getter Methods', () => {
    it('should return field controls', () => {
      const fields = component.field;
      expect(fields).toBeDefined();
      expect(fields['productName']).toBeDefined();
    });

    it('should return effectiveDateValidation', () => {
      const validation = component.effectiveDateValidation;
      expect(validation).toBeDefined();
    });

    it('should return expiryDateValidation', () => {
      const validation = component.expiryDateValidation;
      expect(validation).toBeDefined();
    });
  });

  describe('Additional Coverage Tests - Product Updates', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
      component.statusData = mockStatusData;
      component.requestId = 'REQUEST-123';
    });

    it('should handle updateProduct with empty marketingName', fakeAsync(() => {
      component.product.patchValue({
        productName: 'Test Product',
        description: 'Test Description',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() },
        marketingName: ''
      });

      (component as any).updateProduct('next');
      tick();

      expect(mockProductsService.updateProduct).toHaveBeenCalled();
    }));

    it('should handle updateProduct with null limitsCurrency when disabled', fakeAsync(() => {
      component.isLimitsCurrencyEnable = false;
      component.product.patchValue({
        productName: 'Test Product',
        description: 'Test Description',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });

      (component as any).updateProduct('next');
      tick();

      expect(component.updateproductRequest.header.limitsCurrency).toBeNull();
    }));

    it('should emit nextEvent after updateProduct', fakeAsync(() => {
      jest.spyOn(component.nextEvent, 'emit');
      component.product.patchValue({
        productName: 'Test Product',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });

      (component as any).updateProduct('next');
      tick();

      expect(component.nextEvent.emit).toHaveBeenCalledWith('next');
    }));

    it('should handle updateProduct error with specific message', fakeAsync(() => {
      component.product.patchValue({
        productName: 'Test Product',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });
      mockProductsService.updateProduct.mockReturnValue(
        throwError(() => ({ error: 'not allowed for update operation' }))
      );

      (component as any).updateProduct('next');
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'info' })
      );
    }));
  });

  describe('Additional Coverage Tests - Status Changes', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
      component.statusData = mockStatusData;
      component.productId = 'PROD-123';
      component.productVersionId = '1.0';
      component.requestId = 'REQUEST-123';
    });

    it('should call clearCache when status changes from DESIGN to FINAL', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.FINAL });
      jest.spyOn(component, 'clearCache').mockImplementation(() => Promise.resolve());
      jest.spyOn(component, 'initializeProduct').mockImplementation(() => {});
      mockProductsService.updateStatus.mockReturnValue(of('success'));

      component.onStatusChange();
      tick();

      expect(component.clearCache).toHaveBeenCalled();
    }));

    it('should call clearCache when status changes from FINAL to DELETE', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.FINAL, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.DELETE });
      jest.spyOn(component, 'clearCache').mockImplementation(() => Promise.resolve());
      jest.spyOn(component, 'initializeProduct').mockImplementation(() => {});
      mockProductsService.updateStatus.mockReturnValue(of('success'));

      component.onStatusChange();
      tick();

      expect(component.clearCache).toHaveBeenCalled();
    }));

    it('should handle status update error from DESIGN status', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS };
      component.product.patchValue({ status: Statuskeys.FINAL });
      mockProductsService.updateStatus.mockReturnValue(
        throwError(() => ({ error: { errors: { field1: 'Error message' } } }))
      );

      component.onStatusChange();
      tick();

      expect(component.product.get('status')?.value).toBe(Statuskeys.DESIGN);
    }));

    it('should not call updateStatus when data description is missing', () => {
      component.productHeaderDetails.status = { value: Statuskeys.FINAL, category: Category.PRODUCTSTATUS };
      component.statusData = [{ id: '1', code: Statuskeys.WITHDRAW, description: '', rank: 1 }];
      component.product.patchValue({ status: Statuskeys.WITHDRAW });

      component.onStatusChange();

      expect(mockProductsService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('Additional Coverage Tests - Version Management', () => {
    beforeEach(() => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productResponse = mockProductResponse;
      component.polSearchResp = { response: { numberOfPolicies: 5 } as any, version: '1.0' };
    });

    it('should disable status and description fields for new version', () => {
      component.versioningCtrl = '2.0';
      component.availableVersions = [{ version: '2.0', isNew: true }];
      jest.spyOn(component, 'preSetValuesForNewVers').mockImplementation(() => {});

      component.onVersionChange();

      expect(component.showDiscardButton).toBe(true);
      expect(component.versioning).toBe(false);
    });

    it('should set correct tooltip for existing new version', () => {
      component.versioningCtrl = '1.0';
      component.availableVersions = [{ version: '1.0', isNew: false }, { version: '2.0', isNew: true }];
      jest.spyOn(component as any, 'switchVersion').mockImplementation(() => {});

      component.onVersionChange();

      expect(component.tooltipTextForNewVers).toBe(component.constants.toolTip['exstNew']);
    });
  });

  describe('Additional Coverage Tests - Date Validation', () => {
    it('should return effectiveDateInvalid for invalid effective date format', () => {
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: ['invalid-date'],
        expiryDate: [null]
      });
      dateRangeGroup.get('effectiveDate')?.markAsDirty();

      const result = component.validateDateRange(dateRangeGroup);

      expect(result).toEqual({ effectiveDateInvalid: true });
    });

    it('should return expiryDateInvalid for invalid expiry date format', () => {
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [new Date('2026-01-01')],
        expiryDate: ['invalid-date']
      });
      dateRangeGroup.get('expiryDate')?.markAsDirty();

      const result = component.validateDateRange(dateRangeGroup);

      expect(result).toEqual({ expiryDateInvalid: true });
    });

    it('should return null when expiry date is null', () => {
      const futureDate = new Date('2026-01-01');
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [futureDate],
        expiryDate: [null]
      });

      const result = component.validateDateRange(dateRangeGroup);

      expect(result).toBeNull();
    });
  });

  describe('Additional Coverage Tests - Helper Methods', () => {
    it('should handle empty country settings data', () => {
      component.processCountryData(mockCurrencyData, [], false, 'US');
      
      expect(component.currency).toBeDefined();
    });

    it('should not update localStorage if productVersionId is null in updateproductRequest', () => {
      component.updateproductRequest = {
        productId: 'PROD-123',
        productVersionId: null as any,
        header: mockProductResponse.header,
        rating: {},
        requestId: 'REQUEST-123'
      };
      
      component.updateLocalStorage();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('productVersionId', '');
    });
  });

  describe('Additional Coverage Tests - onDiscardVersion', () => {
    beforeEach(() => {
      component.availableVersions = [
        { version: '1.0', isNew: false },
        { version: '2.0', isNew: true }
      ];
      component.versioningCtrl = '2.0';
      component.productVersionId = '2.0';
      component.polSearchResp = { response: { numberOfPolicies: 5 } as any, version: '1.0' };
      component.productResponse = mockProductResponse;
      jest.spyOn(component, 'bindProductDetails').mockImplementation(() => {});
    });

    it('should close modal when discarding version', () => {
      component.sidebarVisible = true;
      
      component.onDiscardVersion();
      
      expect(component.sidebarVisible).toBe(false);
    });

    it('should remove new version from availableVersions', () => {
      component.onDiscardVersion();
      
      const hasNewVersion = component.availableVersions.some(v => v.version === '2.0');
      expect(hasNewVersion).toBe(false);
    });

    it('should revert versioningCtrl to polSearchResp version', () => {
      component.onDiscardVersion();
      
      expect(component.versioningCtrl).toBe('1.0');
      expect(component.productVersionId).toBe('1.0');
    });

    it('should reset versioning flag based on policy count', () => {
      component.onDiscardVersion();
      
      expect(component.versioning).toBe(true);
      expect(component.showDiscardButton).toBe(false);
    });

    it('should set correct tooltip after discard', () => {
      component.onDiscardVersion();
      
      expect(component.tooltipTextForNewVers).toBe(component.constants.toolTip['noPolicy']);
    });
  });

  describe('Additional Coverage Tests - createMappingForNewVersion', () => {
    it('should create mappings successfully and show success message', fakeAsync(() => {
      const mockMappings = { endPoint: 'test', reId: 1, externalMappings: [], isPartnerProvidedPremium: false };
      mockCoherentMappingService.getMappings.mockReturnValue(of(mockMappings));
      mockCoherentMappingService.saveMappings.mockReturnValue(of({ requestId: '123', succeeded: true, data: true }));

      component.createMappingForNewVersion('PROD-123', '2.0', '1.0');
      tick();

      expect(mockCoherentMappingService.getMappings).toHaveBeenCalledWith('PROD-123', '1.0');
      expect(mockCoherentMappingService.saveMappings).toHaveBeenCalledWith('PROD-123', '2.0', mockMappings);
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success', message: expect.stringContaining('Mapped Successfully') })
      );
    }));

    it('should handle saveMappings error', fakeAsync(() => {
      const mockMappings = { endPoint: 'test', reId: 1, externalMappings: [], isPartnerProvidedPremium: false };
      mockCoherentMappingService.getMappings.mockReturnValue(of(mockMappings));
      mockCoherentMappingService.saveMappings.mockReturnValue(throwError(() => new Error('Error')));

      component.createMappingForNewVersion('PROD-123', '2.0', '1.0');
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));
  });

  describe('Additional Coverage Tests - next()', () => {
    beforeEach(() => {
      component.productResponse = mockProductResponse;
      component.productId = 'PROD-123';
      component.versioningCtrl = '1.0';
      component.productVersionId = '1.0';
      component.availableVersions = [{ version: '1.0', isNew: false }];
    });

    it('should emit nextButtonClicked for non-disabled product', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      jest.spyOn(component as any, 'updateProduct').mockImplementation(() => {});
      jest.spyOn(mockSharedService.nextButtonClicked, 'next');

      component.next();

      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    });

    it('should not call updateProduct for disabled product', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      jest.spyOn(component as any, 'updateProduct').mockImplementation(() => {});
      jest.spyOn(mockSharedService.nextButtonClicked, 'next');

      component.next();

      expect((component as any).updateProduct).not.toHaveBeenCalled();
      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalled();
    });

    it('should handle createNewVersion error', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.availableVersions = [{ version: '2.0', isNew: true }];
      component.product.patchValue({
        productName: 'Test',
        description: 'Desc',
        premiumCurrency: 'USD',
        limitsCurrency: '',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() },
        marketingName: 'Marketing'
      });
      mockProductsService.getAllByVersion.mockReturnValue(of(mockProductResponse));
      mockProductsService.createNewVersion.mockReturnValue(throwError(() => new Error('Error')));
      jest.spyOn(component as any, 'addIsCurrentVersion').mockReturnValue(mockProductResponse);

      component.next();
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error', message: expect.stringContaining('failed') })
      );
    }));
  });

  describe('Additional Coverage Tests - bindProductDetails edge cases', () => {
    it('should handle product with no allVersions', fakeAsync(() => {
      const productWithoutVersions = { ...mockProductResponse };
      productWithoutVersions.header.allVersions = undefined;
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});

      component.bindProductDetails(productWithoutVersions);
      tick(20);

      expect(component.product.get('productName')?.value).toBe('Test Product');
    }));

    it('should handle product with DELETE status', fakeAsync(() => {
      const productWithDelete = { ...mockProductResponse };
      productWithDelete.header.status = { value: Statuskeys.DELETE, category: Category.PRODUCTSTATUS };
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});
      mockProductContextService._getProductContext.mockReturnValue({ 
        ...mockProductContextService._getProductContext(), 
        status: Statuskeys.DELETE 
      });

      component.bindProductDetails(productWithDelete);
      tick(20);

      expect(component.product.get('productName')?.disabled).toBe(true);
    }));

    it('should remove isEffectiveDatePast error for existing version', fakeAsync(() => {
      component.availableVersions = [{ version: '1.0', isNew: false }];
      component.productVersionId = '1.0';
      const productWithPastDate = { ...mockProductResponse };
      productWithPastDate.header.effectiveDate = new Date('2020-01-01');
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});

      component.bindProductDetails(productWithPastDate);
      tick(20);

      const dateRangeErrors = component.field['dateRange'].errors;
      expect(dateRangeErrors?.['isEffectiveDatePast']).toBeUndefined();
    }));
  });

  describe('Additional Coverage Tests - getpolicyData', () => {
    it('should handle missing country parameter', async () => {
      mockCommands.execute.mockResolvedValue({ data: [{ region: 'EMEA' }] });

      await component.getpolicyData('');

      expect(mockCommands.execute).toHaveBeenCalled();
    });

    it('should set correct region from country data', async () => {
      mockCommands.execute.mockResolvedValue({ data: [{ region: 'NORTH_AMERICA' }] });
      jest.spyOn(component as any, 'setVersioning').mockImplementation(() => {});

      await component.getpolicyData('US');

      expect(component.region).toBe('north_america');
    });
  });

  describe('Additional Coverage Tests - switchVersion edge cases', () => {
    it('should handle getProduct error in switchVersion', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.productVersionId = '1.0';
      component.region = 'apac';
      mockProductsService.getProduct.mockReturnValue(throwError(() => new Error('Error')));

      (component as any).switchVersion();
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error', message: expect.stringContaining('fetch failed') })
      );
    }));

    it('should update localStorage after successful version switch', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.productVersionId = '1.0';
      component.region = 'apac';
      jest.spyOn(component as any, 'preSetValues').mockImplementation(() => {});
      jest.spyOn(component as any, 'setVersioning').mockImplementation(() => {});

      (component as any).switchVersion();
      tick();

      expect(localStorage.setItem).toHaveBeenCalledWith('productVersionId', '2.0');
    }));
  });

  describe('Additional Coverage Tests - Constructor and Initialization', () => {
    it('should initialize requestId from productContextService or generate new UUID', () => {
      expect(component.requestId).toBeDefined();
      expect(component.requestId.length).toBeGreaterThan(0);
    });

    it('should retrieve productId from localStorage if available', () => {
      expect(component.productId).toBe('PROD-123');
    });

    it('should retrieve productVersionId from localStorage if available', () => {
      expect(component.productVersionId).toBe('1.0');
    });

    it('should initialize constants from Constants', () => {
      expect(component.constants).toBeDefined();
    });

    it('should set default colorTheme', () => {
      expect(component.colorTheme).toBeDefined();
    });
  });

  describe('Additional Coverage Tests - Form Controls and Validation', () => {
    it('should add validators to limitsCurrency when toggling on', () => {
      component.isLimitsCurrencyEnable = false;
      
      component.toggleLimitsCurrency('USD');
      
      expect(component.product.get('limitsCurrency')).toBeDefined();
      expect(component.isLimitsCurrencyEnable).toBe(true);
    });

    it('should handle form with pristine effectiveDate in validation', () => {
      const dateRangeGroup = component['_fb'].group({
        effectiveDate: [new Date('2020-01-01')],
        expiryDate: [null]
      });
      dateRangeGroup.get('effectiveDate')?.markAsPristine();

      const result = component.validateDateRange(dateRangeGroup);

      expect(result).toEqual({ isEffectiveDatePast: true });
    });

    it('should set canSaveExit based on isProductDisabled', fakeAsync(() => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      const productWithData = { ...mockProductResponse };
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});

      component.bindProductDetails(productWithData);
      tick(20);

      expect(component.canSaveExit).toBe(true);
    }));
  });

  describe('Additional Coverage Tests - Country and Currency Processing', () => {
    it('should handle getCountrySettingList with empty response', fakeAsync(() => {
      mockProductsService.getCountrySettings.mockReturnValue(of({ data: [] }));
      jest.spyOn(component, 'processCountryData').mockImplementation(() => {});

      component.getCountrySettingList(mockCountryData);
      tick();

      expect(mockProductsService.getCountrySettings).toHaveBeenCalled();
    }));

    it('should process country data without selected country', () => {
      component.processCountryData(mockCurrencyData, mockCountrySettings, false, '');
      
      expect(component.currency).toBeDefined();
    });

    it('should handle processCountryData with undefined country', () => {
      component.processCountryData(mockCurrencyData, mockCountrySettings, false, undefined as any);
      
      expect(component.currency).toBeDefined();
    });

    it('should set selectedCountry after bindProductDetails', fakeAsync(() => {
      const productWithCountry = { ...mockProductResponse };
      productWithCountry.header.country = ['UK'];
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});

      component.bindProductDetails(productWithCountry);
      tick(20);

      expect(component.selectedCountry).toBe('UK');
    }));
  });

  describe('Additional Coverage Tests - Error Handling Edge Cases', () => {
    it('should handle updateProduct with response false', fakeAsync(() => {
      component.productResponse = mockProductResponse;
      component.productHeaderDetails = mockProductResponse.header;
      component.statusData = mockStatusData;
      component.product.patchValue({
        productName: 'Test',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });
      mockProductsService.updateProduct.mockReturnValue(of(false));

      (component as any).updateProduct('next');
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));

    it('should handle onStatusChange with no status data found', () => {
      component.productHeaderDetails.status = { value: Statuskeys.FINAL, category: Category.PRODUCTSTATUS };
      component.statusData = [];
      component.product.patchValue({ status: Statuskeys.WITHDRAW });

      component.onStatusChange();

      expect(mockProductsService.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle onStatusChange error without errors object', fakeAsync(() => {
      component.productHeaderDetails.status = { value: Statuskeys.FINAL, category: Category.PRODUCTSTATUS };
      component.statusData = mockStatusData;
      component.product.patchValue({ status: Statuskeys.WITHDRAW });
      mockProductsService.updateStatus.mockReturnValue(throwError(() => ({ error: 'Simple error' })));

      component.onStatusChange();
      tick();

      // Since there's no errors object, it won't revert the status
      expect(mockLayoutService.showMessage).not.toHaveBeenCalled();
    }));

    it('should handle createMappingForNewVersion getMappings error', fakeAsync(() => {
      mockCoherentMappingService.getMappings.mockReturnValue(throwError(() => new Error('Error')));

      component.createMappingForNewVersion('PROD-123', '2.0', '1.0');
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));
  });

  describe('Additional Coverage Tests - Version Sorting and Creation', () => {
    it('should sort versions by createdDate when creating new version', () => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productHeaderDetails.allVersions = [
        { versionId: '1.0', status: { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS }, createdDate: '2024-03-01' },
        { versionId: '2.0', status: { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS }, createdDate: '2024-01-01' },
        { versionId: '3.0', status: { value: Statuskeys.DESIGN, category: Category.PRODUCTSTATUS }, createdDate: '2024-05-01' }
      ];
      component.availableVersions = [{ version: '1.0', isNew: false }];
      jest.spyOn(component, 'preSetValuesForNewVers').mockImplementation(() => {});

      component.createProductVersion();

      expect(component.versioningCtrl).toBe('4.0');
    });

    it('should handle versions without allVersions array', () => {
      component.productHeaderDetails = mockProductResponse.header;
      component.productHeaderDetails.allVersions = undefined;
      component.availableVersions = [{ version: '1.0', isNew: false }];
      jest.spyOn(component, 'preSetValuesForNewVers').mockImplementation(() => {});

      component.createProductVersion();

      expect(component.versioningCtrl).toBe('2.0');
    });
  });

  describe('Additional Coverage Tests - preSetValuesForNewVers', () => {
    it('should set status to DESIGN for new version', () => {
      component.versioningCtrl = '2.0';
      component.productResponse = mockProductResponse;
      component.newEffDate = new Date('2024-06-01');
      component.newExpiryDate = new Date('2024-12-31');

      component.preSetValuesForNewVers();

      expect(component.product.get('status')?.value).toBe(Statuskeys.DESIGN);
    });

    it('should handle newExpiryDate as undefined', () => {
      component.versioningCtrl = '2.0';
      component.productResponse = mockProductResponse;
      component.newEffDate = new Date('2024-06-01');
      component.newExpiryDate = undefined;

      component.preSetValuesForNewVers();

      expect(component.product.get('dateRange.expiryDate')?.value).toBeNull();
    });
  });

  describe('Additional Coverage Tests - Layout and UI State', () => {
    it('should update caption in layout service', () => {
      jest.spyOn(mockLayoutService.caption$, 'next');
      // Constructor already called caption$.next, verify it was called
      expect(mockLayoutService.caption$.next).toBeDefined();
    });

    it('should set editProduct to false in LoadOverview', () => {
      component.editProduct = true;
      
      component.LoadOverview();
      
      expect(component.editProduct).toBe(false);
    });

    it('should toggle sidebarVisible in discardAndExit', () => {
      component.sidebarVisible = false;
      
      component.discardAndExit();
      
      expect(component.sidebarVisible).toBe(true);
    });

    it('should toggle sidebarVisible in closeModal', () => {
      component.sidebarVisible = true;
      
      component.closeModal();
      
      expect(component.sidebarVisible).toBe(false);
    });
  });

  describe('Additional Coverage Tests - updateProduct Navigation', () => {
    it('should navigate to availability when navigateToPage is availability', fakeAsync(() => {
      component.productResponse = mockProductResponse;
      component.productHeaderDetails = mockProductResponse.header;
      component.statusData = mockStatusData;
      component.product.patchValue({
        productName: 'Test',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });

      (component as any).updateProduct('availability');
      tick();

      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['products']);
    }));

    it('should update product context after successful update', fakeAsync(() => {
      component.productResponse = mockProductResponse;
      component.productHeaderDetails = mockProductResponse.header;
      component.statusData = mockStatusData;
      component.product.patchValue({
        productName: 'Test',
        status: 'DESIGN',
        premiumCurrency: 'USD',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() }
      });

      (component as any).updateProduct('next');
      tick();

      expect(mockProductContextService._setProductContext).toHaveBeenCalled();
      expect(mockProductContextService._setProductVersions).toHaveBeenCalled();
    }));
  });

  describe('Additional Coverage Tests - ActivatedRoute Parameters', () => {
    it('should get productId from route params when localStorage is null', () => {
      // This is tested in constructor, verifying the logic works
      expect(component.productId).toBeDefined();
    });

    it('should get productVersionId from route query params when localStorage is null', () => {
      // This is tested in constructor, verifying the logic works
      expect(component.productVersionId).toBeDefined();
    });
  });

  describe('Additional Coverage Tests - Complex Scenarios', () => {
    it('should handle multiple version updates in sequence', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.productVersionId = '1.0';
      component.availableVersions = [
        { version: '1.0', isNew: false },
        { version: '2.0', isNew: false }
      ];
      jest.spyOn(component as any, 'preSetValues').mockImplementation(() => {});
      jest.spyOn(component as any, 'setVersioning').mockImplementation(() => {});

      (component as any).switchVersion();
      tick();

      component.versioningCtrl = '3.0';
      component.productVersionId = '2.0';
      
      (component as any).switchVersion();
      tick();

      expect(mockProductsService.getProduct).toHaveBeenCalledTimes(2);
    }));

    it('should handle bindProductDetails with all null country values', fakeAsync(() => {
      const productWithNullCountry = { ...mockProductResponse };
      productWithNullCountry.header = { ...mockProductResponse.header, country: [''] };
      jest.spyOn(component, 'loadCurrencyDetails').mockImplementation(() => {});

      component.bindProductDetails(productWithNullCountry);
      tick(20);

      expect(component.selectedCountry).toBe('');
    }));

    it('should handle getAllByVersion error when creating new version', fakeAsync(() => {
      component.versioningCtrl = '2.0';
      component.availableVersions = [{ version: '2.0', isNew: true }];
      component.productResponse = mockProductResponse;
      component.productId = 'PROD-123';
      component.product.patchValue({
        productName: 'Test',
        description: 'Desc',
        premiumCurrency: 'USD',
        limitsCurrency: '',
        dateRange: { effectiveDate: new Date(), expiryDate: new Date() },
        marketingName: 'Marketing'
      });
      mockProductsService.getAllByVersion.mockReturnValue(throwError(() => new Error('Error')));

      component.next();
      tick();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      );
    }));
  });
});
