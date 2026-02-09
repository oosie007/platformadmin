import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CoverageVariantLevelService } from './coverage-variant-level.service';
import {
  CoverageVariantLevel,
  CoverageVariantLevelResponse,
  updateCoverageVariantLevelRequest,
} from '../types/coverage-variant-level';
import { productContextResponse } from '../types/mockResponses';
import { HttpCacheManager } from '@ngneat/cashew';
import { AppContextService } from '@canvas/services';
import { of, throwError } from 'rxjs';
import { REFERENCE_DATA } from '@canvas/metadata/services';
import { ProductContextService } from './product-context.service';
import { ProductContext } from '../types/product-context';

describe('CoverageVariantLevelService', () => {
  let service: CoverageVariantLevelService;
  let httpMock: HttpTestingController;
  let httpClientSpy: any;
  let productContextService: MockProductContextService;
  let mockAppContextService: MockAppContextService;

  const mockListData: CoverageVariantLevel[] = [
    {
      coverageVariantLevelId: 'f99bb0d9-b40b-4768-8c9a-924e652',
      description: 'CVL123',
      insuredLevel: [],
      insuredObjectLevel: [],
      ruleSet: [],
      requestId: '',
      aggregateLimitType: 'type1',
      aggregateMaxValue: 1000,
      aggregateCoverageVariantPercentage: '50',
      isCurrentVersion: true,
    },
    {
      coverageVariantLevelId: 'cf869b43-9032-4c61-a1fc-5d411abf',
      description: 'CVL134',
      insuredLevel: [],
      insuredObjectLevel: [],
      ruleSet: [],
      requestId: '',
      aggregateLimitType: 'type2',
      aggregateMaxValue: 2000,
      aggregateCoverageVariantPercentage: '75',
      isCurrentVersion: false,
    },
  ];

  const mockResponse: CoverageVariantLevelResponse = {
    requestId: '5d411abf9e78',
    data: mockListData,
  };

  const mockEmptyResponse: CoverageVariantLevelResponse = {
    requestId: '5d411abf9e78',
    data: [],
  };

  const editMockResponse: updateCoverageVariantLevelRequest = {
    requestId: '5d411abf9e78',
    data: mockListData[0],
  };

  class MockRequestsQueue {}
  class MockReferenceDataProvider {}
  class MockAppContextService {}
  class MockProductContextService {
    _getProductContext = jest.fn(() => productContextResponse);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CoverageVariantLevelService,
        { provide: HttpCacheManager, useValue: {} },
        { provide: 'RequestsQueue', useClass: MockRequestsQueue },
        { provide: 'ReferenceDataProvider', useClass: MockReferenceDataProvider },
        { provide: REFERENCE_DATA, useClass: MockReferenceDataProvider },
        { provide: AppContextService, useClass: MockAppContextService },
        { provide: ProductContextService, useClass: MockProductContextService },
      ],
    });

    service = TestBed.inject(CoverageVariantLevelService);
    httpMock = TestBed.inject(HttpTestingController);
    productContextService = TestBed.inject(ProductContextService) as unknown as MockProductContextService;
    mockAppContextService = TestBed.inject(AppContextService) as unknown as MockAppContextService;

    httpClientSpy = { get: jest.fn(), patch: jest.fn(), post: jest.fn(), delete: jest.fn() };
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with product context', () => {
    expect(productContextService._getProductContext).toHaveBeenCalled();
    expect(service.productContext).toBeDefined();
    expect(service.country).toBe(productContextResponse.country[0]);
  });

  it('should set default language to en when not provided', () => {
    const contextWithoutLanguage: ProductContext = { ...productContextResponse, language: undefined as any };
    productContextService._getProductContext.mockReturnValue(contextWithoutLanguage);
    
    const newService = new CoverageVariantLevelService(
      TestBed.inject(HttpClient),
      TestBed.inject(HttpCacheManager),
      TestBed.inject(REFERENCE_DATA),
      TestBed.inject(AppContextService),
      TestBed.inject(ProductContextService)
    );
    
    expect(newService.productContext.language).toBe('en');
  });

  it('should generate requestId when not provided', () => {
    const contextWithoutRequestId: ProductContext = { ...productContextResponse, requestId: undefined as any };
    productContextService._getProductContext.mockReturnValue(contextWithoutRequestId);
    
    const newService = new CoverageVariantLevelService(
      TestBed.inject(HttpClient),
      TestBed.inject(HttpCacheManager),
      TestBed.inject(REFERENCE_DATA),
      TestBed.inject(AppContextService),
      TestBed.inject(ProductContextService)
    );
    
    expect(newService.productContext.requestId).toBeDefined();
    expect(newService.productContext.requestId).not.toBeNull();
  });

  describe('getCoverageVariantLevels', () => {
    it('should fetch coverage variant levels', () => {
      service
        .getCoverageVariantLevels('randomProductId', 'randomCoverageVariantId', 'randomProductVersionId')
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual(mockListData);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/randomProductId/coveragevariants/randomCoverageVariantId/variantlevels?versionId=randomProductVersionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty response', () => {
      service
        .getCoverageVariantLevels('productId', 'coverageVariantId', 'versionId')
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual([]);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush(mockEmptyResponse);
    });

    it('should handle undefined parameters', () => {
      service
        .getCoverageVariantLevels(undefined, undefined, undefined)
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual(mockListData);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/undefined/coveragevariants/undefined/variantlevels?versionId=undefined&requestId=${productContextResponse.requestId}`
      );
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service
        .getCoverageVariantLevels('productId', 'coverageVariantId', 'versionId')
        .subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(500);
          }
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service
        .getCoverageVariantLevels('productId', 'coverageVariantId', 'versionId')
        .subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.error).toContain('Network error');
          }
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.error(new ErrorEvent('Network error', { message: 'Network error occurred' }));
    });
  });

  describe('createCoverageVariantLevels', () => {
    it('should create coverage variant levels', () => {
      service
        .createCoverageVariantLevels(mockListData, 'randomProductId', 'randomCoverageVariantId', 'randomProductVersionId')
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual(mockListData);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/randomProductId/coveragevariants/randomCoverageVariantId/variantlevels?versionId=randomProductVersionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockListData);
      req.flush(mockResponse);
    });

    it('should create with empty array', () => {
      service
        .createCoverageVariantLevels([], 'productId', 'coverageVariantId', 'versionId')
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual([]);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.body).toEqual([]);
      req.flush(mockEmptyResponse);
    });

    it('should handle single item creation', () => {
      const singleItem = [mockListData[0]];
      const singleItemResponse = { ...mockResponse, data: singleItem };

      service
        .createCoverageVariantLevels(singleItem, 'productId', 'coverageVariantId', 'versionId')
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual(singleItem);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush(singleItemResponse);
    });

    it('should handle creation errors', () => {
      service
        .createCoverageVariantLevels(mockListData, 'productId', 'coverageVariantId', 'versionId')
        .subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle undefined parameters in creation', () => {
      service
        .createCoverageVariantLevels(mockListData, undefined, undefined, undefined)
        .subscribe((res: CoverageVariantLevel[]) => {
          expect(res).toEqual(mockListData);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/undefined/coveragevariants/undefined/variantlevels?versionId=undefined&requestId=${productContextResponse.requestId}`
      );
      req.flush(mockResponse);
    });
  });

  describe('updateCoverageVariantLevel', () => {
    it('should update a coverage variant level', () => {
      service
        .updateCoverageVariantLevel(
          mockListData[0],
          'randomProductId',
          'randomCoverageVariantId',
          'randomProductVersionId',
          'randomCoverageVariantLevelId'
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(true);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/randomProductId/coveragevariants/randomCoverageVariantId/variantlevels/randomCoverageVariantLevelId?versionId=randomProductVersionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(mockListData[0]);
      req.flush(true);
    });

    it('should handle update with modified data', () => {
      const modifiedData = { ...mockListData[0], description: 'Updated Description' };

      service
        .updateCoverageVariantLevel(
          modifiedData,
          'productId',
          'coverageVariantId',
          'versionId',
          'levelId'
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(true);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels/levelId?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.body).toEqual(modifiedData);
      req.flush(true);
    });

    it('should handle update failure', () => {
      service
        .updateCoverageVariantLevel(
          mockListData[0],
          'productId',
          'coverageVariantId',
          'versionId',
          'levelId'
        )
        .subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(404);
          }
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels/levelId?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle update with undefined parameters', () => {
      service
        .updateCoverageVariantLevel(
          mockListData[0],
          undefined,
          undefined,
          undefined,
          undefined
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(true);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/undefined/coveragevariants/undefined/variantlevels/undefined?versionId=undefined&requestId=${productContextResponse.requestId}`
      );
      req.flush(true);
    });

    it('should return false on update failure response', () => {
      service
        .updateCoverageVariantLevel(
          mockListData[0],
          'productId',
          'coverageVariantId',
          'versionId',
          'levelId'
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(false);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels/levelId?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush(false);
    });
  });

  describe('deleteCoverageVariantLevel', () => {
    it('should delete a coverage variant level', () => {
      service
        .deleteCoverageVariantLevel(
          'randomProductId',
          'randomCoverageVariantId',
          'randomProductVersionId',
          'randomCoverageVariantLevelId'
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(true);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/randomProductId/coveragevariants/randomCoverageVariantId/variantlevels/randomCoverageVariantLevelId?versionId=randomProductVersionId&requestId=${productContextResponse.requestId}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(true);
    });

    it('should handle delete failure', () => {
      service
        .deleteCoverageVariantLevel(
          'productId',
          'coverageVariantId',
          'versionId',
          'levelId'
        )
        .subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(403);
          }
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels/levelId?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should return false on delete failure response', () => {
      service
        .deleteCoverageVariantLevel(
          'productId',
          'coverageVariantId',
          'versionId',
          'levelId'
        )
        .subscribe((res: boolean) => {
          expect(res).toBe(false);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products/productId/coveragevariants/coverageVariantId/variantlevels/levelId?versionId=versionId&requestId=${productContextResponse.requestId}`
      );
      req.flush(false);
    });

    it('should handle delete with empty string parameters', () => {
      service
        .deleteCoverageVariantLevel('', '', '', '')
        .subscribe((res: boolean) => {
          expect(res).toBe(true);
        });

      const req = httpMock.expectOne(
        `/canvas/api/catalyst/products//coveragevariants//variantlevels/?versionId=&requestId=${productContextResponse.requestId}`
      );
      req.flush(true);
    });
  });

  describe('Base URL and request ID handling', () => {
    it('should use correct base URL', () => {
      expect(service.baseUrl).toBe('/canvas/api/catalyst/products');
    });

    it('should include request ID in all API calls', () => {
      service.getCoverageVariantLevels('test', 'test', 'test').subscribe();
      service.createCoverageVariantLevels([], 'test', 'test', 'test').subscribe();
      service.updateCoverageVariantLevel(mockListData[0], 'test', 'test', 'test', 'test').subscribe();
      service.deleteCoverageVariantLevel('test', 'test', 'test', 'test').subscribe();

      const requests = httpMock.match(() => true);
      expect(requests).toHaveLength(4);
      
      requests.forEach(req => {
        expect(req.request.url).toContain(`requestId=${productContextResponse.requestId}`);
      });

      requests.forEach(req => req.flush(req.request.method === 'GET' || req.request.method === 'POST' ? mockResponse : true));
    });
  });

  describe('Product context edge cases', () => {
    it('should handle product context with empty country array', () => {
      const contextWithEmptyCountry: ProductContext = { ...productContextResponse, country: [] };
      productContextService._getProductContext.mockReturnValue(contextWithEmptyCountry);
      
      const newService = new CoverageVariantLevelService(
        TestBed.inject(HttpClient),
        TestBed.inject(HttpCacheManager),
        TestBed.inject(REFERENCE_DATA),
        TestBed.inject(AppContextService),
        TestBed.inject(ProductContextService)
      );
      
      expect(newService.country).toBeUndefined();
    });

    it('should preserve non-en language settings', () => {
      const contextWithFrench: ProductContext = { ...productContextResponse, language: 'fr' };
      productContextService._getProductContext.mockReturnValue(contextWithFrench);
      
      const newService = new CoverageVariantLevelService(
        TestBed.inject(HttpClient),
        TestBed.inject(HttpCacheManager),
        TestBed.inject(REFERENCE_DATA),
        TestBed.inject(AppContextService),
        TestBed.inject(ProductContextService)
      );
      
      expect(newService.productContext.language).toBe('fr');
    });

    it('should handle null product context gracefully', () => {
      productContextService._getProductContext.mockReturnValue(null as any);
      
      expect(() => {
        new CoverageVariantLevelService(
          TestBed.inject(HttpClient),
          TestBed.inject(HttpCacheManager),
          TestBed.inject(REFERENCE_DATA),
          TestBed.inject(AppContextService),
          TestBed.inject(ProductContextService)
        );
      }).not.toThrow();
    });
  });
});
