import { VariantLevelService } from './variant-level.service';
import { HttpClient } from '@angular/common/http';
import { ProductContextService } from './product-context.service';
import { StepperNavigationService } from '../home/coverage-variant-v2/services/stepper-navigation.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { InsuredTypeKeys } from '../types/coverage-variant-level';

describe('VariantLevelService', () => {
  let service: VariantLevelService;
  let http: jest.Mocked<HttpClient>;
  let productContextService: jest.Mocked<ProductContextService>;
  let stepperNavigationService: jest.Mocked<StepperNavigationService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    http = {
      get: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    } as any;

    productContextService = {
      _getProductContext: jest.fn().mockReturnValue({
        requestId: 'req123',
        country: ['IE'],
        language: 'en'
      })
    } as any;

    stepperNavigationService = {
      emitNext: jest.fn()
    } as any;

    router = {
      navigate: jest.fn()
    } as any;

    service = new VariantLevelService(
      http,
      productContextService,
      stepperNavigationService,
      router
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCoverageVariantDetails should call HttpClient.get with correct URL', (done) => {
    http.get.mockReturnValue(of({ data: { id: 'cv1' } }));
    service.getCoverageVariantDetails('prod1', 'v1', 'cv1').subscribe(data => {
      expect(data).toEqual({ id: 'cv1' });
      expect(http.get).toHaveBeenCalledWith('/canvas/api/catalyst/products/prod1/coveragevariants/cv1?versionId=v1&requestId=req123');
      done();
    });
  });

  it('selectVariant should navigate to maininsured route if variant is MAININSURED and cvLevelId is empty', () => {
    service.selectVariant(InsuredTypeKeys.MAININSURED, 'prod1', '', 'cv1');
    expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/miVariantLevel']);
  });

  it('selectVariant should navigate to update route if variant is MAININSURED and cvLevelId is present', () => {
    service.selectVariant(InsuredTypeKeys.MAININSURED, 'prod1', 'level1', 'cv1');
    expect(router.navigate).toHaveBeenCalledWith(['products/prod1/coveragevariants/cv1/variantLevels/level1/update&type=maininsured']);
  });

  it('selectVariant should navigate to default route if variant is unknown', () => {
    service.selectVariant('UNKNOWN', 'prod1', '', 'cv1');
    expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/coveragevariantlevels']);
  });

  it('selectVariantV2 should call emitNext for unknown variant', () => {
    service.selectVariantV2('UNKNOWN', 'prod1', '', 'cv1');
    expect(stepperNavigationService.emitNext).toHaveBeenCalled();
  });

  it('selectVariantV2 should navigate to childVariantLevel if variant is CHILD and cvLevelId is empty', () => {
    service.selectVariantV2('CHILD', 'prod1', '', 'cv1');
    expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/cv1/childVariantLevel']);
  });

  it('upsertCoverageVariantLevel should call HttpClient.put with correct URL and body', (done) => {
    http.put.mockReturnValue(of({ data: [{ id: 'level1' }] }));
    service.upsertCoverageVariantLevel('prod1', 'v1', 'cv1', { some: 'body' } as any).subscribe(data => {
      expect(data).toEqual([{ id: 'level1' }]);
      expect(http.put).toHaveBeenCalledWith('/canvas/api/catalyst/products/prod1/coveragevariants/cv1/variantlevels?versionId=v1&requestId=req123', { some: 'body' });
      done();
    });
  });

  it('patchCoverageVariantLevel should call HttpClient.patch with correct URL and body', (done) => {
    http.patch.mockReturnValue(of({ data: [{ id: 'level1' }] }));
    service.patchCoverageVariantLevel('prod1', 'v1', 'cv1', 'lvl1', { some: 'body' } as any).subscribe(data => {
      expect(data).toEqual([{ id: 'level1' }]);
      expect(http.patch).toHaveBeenCalledWith('/canvas/api/catalyst/products/prod1/coveragevariants/cv1/variantlevels/lvl1?versionId=v1&requestId=req123', { some: 'body' });
      done();
    });
  });

  it('deleteSubCoverageVariantLevel should call HttpClient.delete with correct URL', (done) => {
    http.delete.mockReturnValue(of(true));
    service.deleteSubCoverageVariantLevel('prod1', 'v1', 'cv1', 'sub1', 'subLvl1').subscribe(data => {
      expect(data).toBe(true);
      expect(http.delete).toHaveBeenCalledWith('/canvas/api/catalyst/products/prod1/coveragevariants/cv1/subcoverages/sub1/subcoveragelevel/subLvl1?versionId=1.0&requestId=1');
      done();
    });
  });

  it('getCoverageVariantLevelPermutations should call HttpClient.get with correct URL and map response', (done) => {
    // Arrange
    const mockResponse = { data: [[{ id: 'perm1' }]] };
    // Mock the HTTP get call to return an observable of mockResponse
    http.get.mockReturnValue(of(mockResponse));
  
    // Act
    service.getCoverageVariantLevelPermutations('prod1', 'v1', 'cv1').subscribe(data => {
      // Assert
      expect(data).toEqual([[{ id: 'perm1' }]]);
      expect(http.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/prod1/coveragevariants/cv1/coveragefactors/permutations?versionId=v1&requestId=req123'
      );
      done();
    });
  });
  
  it('getCoverageVaraintLevels should call HttpClient.get with correct URL and map response', (done) => {
    // Arrange
    const mockResponse = { data: [{ id: 'level1' }] };
    http.get.mockReturnValue(of(mockResponse));
  
    // Act
    service.getCoverageVaraintLevels('prod1', 'v1', 'cv1').subscribe(data => {
      // Assert
      expect(data).toEqual([{ id: 'level1' }]);
      expect(http.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/prod1/coveragevariants/cv1/variantlevels?versionId=v1&requestId=req123'
      );
      done();
    });
  });
  it('postSubCoverageVariantLevel should call HttpClient.post with correct URL and body, and map response', (done) => {
    // Arrange
    const mockBody = [{ some: 'value' }];
    const mockResponse = { data: [{ id: 'subLevel1' }] };
    http.post.mockReturnValue(of(mockResponse));
  
    // Act
    service.postSubCoverageVariantLevel('prod1', 'v1', 'cv1', 'sub1', mockBody as any).subscribe(data => {
      // Assert
      expect(data).toEqual([{ id: 'subLevel1' }]);
      expect(http.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/prod1/coveragevariants/cv1/subcoverages/sub1/subcoveragelevel?versionId=v1',
        mockBody
      );
      done();
    });
  });
  it('patchSubCoverageVariantLevel2 should call HttpClient.patch with correct URL and body, and map response', (done) => {
    // Arrange
    const mockBody = { some: 'value' };
    http.patch.mockReturnValue(of(true));
  
    // Act
    service.patchSubCoverageVariantLevel2('prod1', 'v1', 'cv1', mockBody).subscribe(data => {
      // Assert
      expect(data).toBe(true);
      expect(http.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/prod1/coveragevariants/cv1?versionId=v1',
        mockBody
      );
      done();
    });
  });
  describe('selectVariant', () => {
    beforeEach(() => {
      router.navigate.mockClear();
    });
  
    it('should navigate to miVariantLevel if variant is MAININSURED and cvLevelId is empty', () => {
      service.selectVariant(InsuredTypeKeys.MAININSURED, 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/miVariantLevel']);
    });
  
    it('should navigate to update maininsured route if variant is MAININSURED and cvLevelId is present', () => {
      service.selectVariant(InsuredTypeKeys.MAININSURED, 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['products/prod1/coveragevariants/cv1/variantLevels/level1/update&type=maininsured']);
    });
  
    it('should navigate to spouseVariantLevel if variant is SPOUSE and cvLevelId is empty', () => {
      service.selectVariant('SPOUSE', 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/spouseVariantLevel']);
    });
  
    it('should navigate to update spouse route if variant is SPOUSE and cvLevelId is present', () => {
      service.selectVariant('SPOUSE', 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['products/prod1/coveragevariants/cv1/variantLevels/level1/update&type=spouse']);
    });
  
    it('should navigate to childVariantLevel if variant is CHILD and cvLevelId is empty', () => {
      service.selectVariant('CHILD', 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/childVariantLevel']);
    });
  
    it('should navigate to update child route if variant is CHILD and cvLevelId is present', () => {
      service.selectVariant('CHILD', 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['products/prod1/coveragevariants/cv1/variantLevels/level1/update&type=child']);
    });
  
    it('should navigate to adultVariantLevel if variant is ADULT and cvLevelId is empty', () => {
      service.selectVariant('ADULT', 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/adultVariantLevel']);
    });
  
    it('should navigate to update adult route if variant is ADULT and cvLevelId is present', () => {
      service.selectVariant('ADULT', 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['products/prod1/coveragevariants/cv1/variantLevels/level1/update&type=adult']);
    });
  
    it('should navigate to coveragevariantlevels if variant is unknown and cvLevelId is empty', () => {
      service.selectVariant('UNKNOWN', 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/coveragevariantlevels']);
    });
  
    it('should navigate to coverage-variant-level-overview if variant is unknown and cvLevelId is present', () => {
      service.selectVariant('UNKNOWN', 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/coverage-variant-level-overview']);
    });
  
    it('should navigate to coveragevariantlevels if variant is empty and cvLevelId is empty', () => {
      service.selectVariant('', 'prod1', '', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/coveragevariantlevels']);
    });
  
    it('should navigate to coverage-variant-level-overview if variant is empty and cvLevelId is present', () => {
      service.selectVariant('', 'prod1', 'level1', 'cv1');
      expect(router.navigate).toHaveBeenCalledWith(['/products/prod1/coveragevariant/coverage-variant-level-overview']);
    });
  });
  describe('selectVariantV2', () => {
    beforeEach(() => {
      router.navigate.mockClear();
      stepperNavigationService.emitNext.mockClear();
    });
  
    const productId = 'prod1';
    const coverageVariantId = 'cv1';
    const urlPath = `/products/${productId}/coveragevariant/${coverageVariantId}`;
  
    it('should navigate to miVariantLevel if variant is MAININSURED and cvLevelId is empty', () => {
      service.selectVariantV2(InsuredTypeKeys.MAININSURED, productId, '', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/miVariantLevel`]);
    });
  
    it('should navigate to update maininsured route if variant is MAININSURED and cvLevelId is present', () => {
      service.selectVariantV2(InsuredTypeKeys.MAININSURED, productId, 'level1', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/variantLevels/level1/update&type=maininsured`]);
    });
  
    it('should navigate to spouseVariantLevel if variant is SPOUSE and cvLevelId is empty', () => {
      service.selectVariantV2('SPOUSE', productId, '', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/spouseVariantLevel`]);
    });
  
    it('should navigate to update spouse route if variant is SPOUSE and cvLevelId is present', () => {
      service.selectVariantV2('SPOUSE', productId, 'level1', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/variantLevels/level1/update&type=spouse`]);
    });
  
    it('should navigate to childVariantLevel if variant is CHILD and cvLevelId is empty', () => {
      service.selectVariantV2('CHILD', productId, '', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/childVariantLevel`]);
    });
  
    it('should navigate to update child route if variant is CHILD and cvLevelId is present', () => {
      service.selectVariantV2('CHILD', productId, 'level1', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/variantLevels/level1/update&type=child`]);
    });
  
    it('should navigate to adultVariantLevel if variant is ADULT and cvLevelId is empty', () => {
      service.selectVariantV2('ADULT', productId, '', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/adultVariantLevel`]);
    });
  
    it('should navigate to update adult route if variant is ADULT and cvLevelId is present', () => {
      service.selectVariantV2('ADULT', productId, 'level1', coverageVariantId);
      expect(router.navigate).toHaveBeenCalledWith([`${urlPath}/variantLevels/level1/update&type=adult`]);
    });
  
    it('should call emitNext if variant is unknown', () => {
      service.selectVariantV2('UNKNOWN', productId, '', coverageVariantId);
      expect(stepperNavigationService.emitNext).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  
    it('should call emitNext if variant is empty', () => {
      service.selectVariantV2('', productId, '', coverageVariantId);
      expect(stepperNavigationService.emitNext).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
  
});
