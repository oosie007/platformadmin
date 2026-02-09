import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CoherentMappingService } from './coherent-mapping.service';
import { ProductContextService } from './product-context.service';
import { of } from 'rxjs';

// Mock data
const mockProductContext = {
  language: 'en',
  requestId: 'mock-request-id',
  country: ['SG'],
};
const mockCoherentInputData = { /* ... */ };
const mockCoherentMappingResponse = { data: mockCoherentInputData };
const mockMappingPayload = { /* ... */ };
const mockSaveMappingResponse = { /* ... */ };
const mockRatingEndpointResponse = { data: [{ /* ... */ }] };

describe('CoherentMappingService', () => {
  let service: CoherentMappingService;
  let httpMock: HttpTestingController;
  let mockProductContextService: Partial<ProductContextService>;

  beforeEach(() => {
    mockProductContextService = {
      _getProductContext: jest.fn().mockReturnValue(mockProductContext),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CoherentMappingService,
        { provide: ProductContextService, useValue: mockProductContextService },
      ],
    });

    service = TestBed.inject(CoherentMappingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch coherent list', () => {
    const endpoint = 'test-endpoint';
    const mockResponse = ['item1', 'item2'];
    service.getCoherentList(endpoint).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/reference-data/coherent-inputs?endPoint=${endpoint}&country=SG&requestId=mock-request-id&language=en`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create coherent mapping', () => {
    const data = {} as any;
    const productId = 'prod1';
    const productVersionId = 'ver1';
    service.create(data, productId, productVersionId).subscribe((res) => {
      expect(res).toEqual(mockCoherentInputData);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/products/${productId}/ratings/premium/inputmappings?versionId=${productVersionId}&requestId=mock-request-id`
    );
    expect(req.request.method).toBe('POST');
    req.flush(mockCoherentMappingResponse);
  });

  it('should get coherent question list', () => {
    const productId = 'prod1';
    const productVersionId = 'ver1';
    service.getCoherentQuestionList(productId, productVersionId).subscribe((res) => {
      expect(res).toEqual(mockCoherentMappingResponse);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/products/${productId}/ratings/premium/inputmappings?versionId=${productVersionId}&requestId=mock-request-id`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockCoherentMappingResponse);
  });

  it('should get rating endpoints', () => {
    const productClasses = 'class1';
    service.getRatingEndpoints(productClasses).subscribe((res) => {
      expect(res).toEqual(mockRatingEndpointResponse.data);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/reference-data/rating-endpoints?requestId=mock-request-id&productClasses=${productClasses}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockRatingEndpointResponse);
  });

  it('should get mappings', () => {
    const productId = 'prod1';
    const productVersionId = 'ver1';
    service.getMappings(productId, productVersionId).subscribe((res) => {
      expect(res).toEqual(mockMappingPayload);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/products/${productId}/ratings/mappings?versionId=${productVersionId}&requestId=mock-request-id`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockMappingPayload });
  });

  it('should save mappings', () => {
    const productId = 'prod1';
    const productVersionId = 'ver1';
    service.saveMappings(productId, productVersionId, mockMappingPayload as any).subscribe((res) => {
      expect(res).toEqual(mockSaveMappingResponse);
    });

    const req = httpMock.expectOne(
      `/canvas/api/catalyst/products/${productId}/ratings/mappings?versionId=${productVersionId}&requestId=mock-request-id`
    );
    expect(req.request.method).toBe('POST');
    req.flush(mockSaveMappingResponse);
  });
});
