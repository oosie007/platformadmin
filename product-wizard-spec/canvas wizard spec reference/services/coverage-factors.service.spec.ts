import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CoverageFactorsService } from './coverage-factors.service';
import { ProductContextService } from './product-context.service';
import { CoverageFactor, CoverageFactorsResponse } from '../types/coverageFactors';

describe('CoverageFactorsService', () => {
  let service: CoverageFactorsService;
  let httpMock: jest.Mocked<HttpClient>;
  let productContextServiceMock: jest.Mocked<ProductContextService>;

  const mockProductContext = { requestId: 'test-request-id' } as any;

  beforeEach(() => {
    httpMock = { post: jest.fn(), patch: jest.fn() } as any;
    productContextServiceMock = {
      _getProductContext: jest.fn().mockReturnValue(mockProductContext),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        CoverageFactorsService,
        { provide: HttpClient, useValue: httpMock },
        { provide: ProductContextService, useValue: productContextServiceMock },
      ],
    });

    service = TestBed.inject(CoverageFactorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCoverageFactors', () => {
    it('should call HttpClient.post with correct URL and body, and map response', (done) => {
      const productId = 'prod1';
      const productVersionId = 'ver1';
      const coverageVariantId = 'cov1';
      const body: CoverageFactor[] = [{ id: 'cf1' } as any];
      const mockResponse: CoverageFactorsResponse = { data: body };

      httpMock.post.mockReturnValue(of(mockResponse));

      service.createCoverageFactors(productId, productVersionId, coverageVariantId, body)
        .subscribe((result) => {
          expect(httpMock.post).toHaveBeenCalledWith(
            `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/coveragefactors?versionId=${productVersionId}&requestId=${mockProductContext.requestId}`,
            body
          );
          expect(result).toEqual(body);
          done();
        });
    });
  });

  describe('updateCoverageFactors', () => {
    it('should call HttpClient.patch with correct URL and body, and map response', (done) => {
      const productId = 'prod2';
      const productVersionId = 'ver2';
      const coverageVariantId = 'cov2';
      const body: CoverageFactor[] = [{ id: 'cf2' } as any];
      const mockResponse: CoverageFactorsResponse = { data: body };

      httpMock.patch.mockReturnValue(of(mockResponse));

      service.updateCoverageFactors(productId, productVersionId, coverageVariantId, body)
        .subscribe((result) => {
          expect(httpMock.patch).toHaveBeenCalledWith(
            `/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}/coveragefactors?versionId=${productVersionId}&requestId=${mockProductContext.requestId}`,
            body
          );
          expect(result).toEqual(body);
          done();
        });
    });
  });
});
