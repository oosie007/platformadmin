/* eslint-disable @typescript-eslint/no-explicit-any */
import { of, throwError } from 'rxjs';
import { productContextResponse } from '../types/mockResponses';
import { CoverageVariantService } from './coverage-variant.service';
import { 
  CoverageVariant, 
  CoverageVariantsResponse, 
  CoverageVariantResponse, 
  CreateCoverageVariant, 
  StandardCoverage, 
  StandardCoverageResponse,
  coveragespremiumregistration 
} from '../types/coverage';
import { ProductContext } from '../types/product-context';

jest.useFakeTimers();

describe('CoverageVariantService', () => {
  let service: CoverageVariantService;
  let productContext: any;
  let httpClientSpy: any;

  const mockCoverageVariant: CoverageVariant = {
    coverageVariantId: 'CV001',
    name: 'CVID1',
    isPeril: false,
    isRateBearing: false,
    is3rdParty: false,
    relatedCoverageVariantIds: ['CVID1'],
    lastUpdated: new Date().toISOString(),
    allocationPercent: 10,
    coveragespremiumregistration: [],
    subCoverages: [],
    insuredObjects: [],
    coverageVariantLevels: [],
    exclusions: [],
    isCurrentVersion: true,
    id: 'CV001'
  };

  const mockCreateCoverageVariant: CreateCoverageVariant = {
    coverageVariantId: 'CV001',
    name: 'CVID1',
    isPeril: false,
    isRateBearing: false,
    is3rdParty: false,
    relatedCoverageVariantIds: ['CVID1'],
    lastUpdated: new Date(),
    allocationPercent: 10,
    coveragespremiumregistration: [],
    subCoverages: [],
    insuredObjects: [],
    coverageVariantLevels: [],
    exclusions: [],
    requestId: '1',
    isCurrentVersion: true
  };

  const mockStandardCoverage: StandardCoverage[] = [
    { id: '87', name: 'Home Office', rank: 50, code: '00' } as any,
    { id: '88', name: 'Afghanistan', rank: 50, code: 'AF' } as any,
  ];

  const mockCoveragesPremiumRegistration: coveragespremiumregistration = {
    coverageId: 'COV001',
    name: 'Test Coverage',
    description: 'Test Coverage Description'
  } as any;

  beforeEach(() => {
    httpClientSpy = { 
      get: jest.fn(), 
      patch: jest.fn(), 
      post: jest.fn(), 
      delete: jest.fn() 
    };
    productContext = { 
      _getProductContext: jest.fn(() => productContextResponse) 
    };
    service = new CoverageVariantService(httpClientSpy, productContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with product context', () => {
    expect(productContext._getProductContext).toHaveBeenCalled();
    expect(service.productContext).toBeDefined();
    expect(service.country).toBe('IE');
  });

  it('should set default language to en when not provided', () => {
    const contextWithoutLanguage: ProductContext = { ...productContextResponse, language: undefined as any };
    productContext._getProductContext.mockReturnValue(contextWithoutLanguage);
    
    const newService = new CoverageVariantService(httpClientSpy, productContext);
    expect(newService.productContext.language).toBe('en');
  });

  it('should generate requestId when not provided', () => {
    const contextWithoutRequestId: ProductContext = { ...productContextResponse, requestId: undefined as any };
    productContext._getProductContext.mockReturnValue(contextWithoutRequestId);
    
    const newService = new CoverageVariantService(httpClientSpy, productContext);
    expect(newService.productContext.requestId).toBeDefined();
    expect(newService.productContext.requestId).not.toBeNull();
  });

  it('should set default country to IE when country array is empty', () => {
    const contextWithEmptyCountry: ProductContext = { ...productContextResponse, country: [] };
    productContext._getProductContext.mockReturnValue(contextWithEmptyCountry);
    
    const newService = new CoverageVariantService(httpClientSpy, productContext);
    expect(newService.country).toBe('IE');
  });

  describe('getCoverageVariants', () => {
    it('should load coverage variants', () => {
      const res: CoverageVariantsResponse = {
        requestId: '1',
        data: [mockCoverageVariant],
      };
      const url = '/canvas/api/catalyst/products/1/coveragevariants?versionId=1&requestId=1';
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariants('1', '1').subscribe((data: CoverageVariant[]) => {
        expect(data).toEqual(res.data);
      });
      
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url);
    });

    it('should handle empty coverage variants response', () => {
      const res: CoverageVariantsResponse = { requestId: '1', data: [] };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariants('1', '1').subscribe((data: CoverageVariant[]) => {
        expect(data).toEqual([]);
      });
    });

    it('should handle undefined parameters', () => {
      const res: CoverageVariantsResponse = { requestId: '1', data: [mockCoverageVariant] };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariants(undefined, undefined).subscribe();
      
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants?versionId=undefined&requestId=1'
      );
    });

    it('should handle HTTP errors', () => {
      const error = new Error('HTTP Error');
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => error));
      
      service.getCoverageVariants('1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should refresh product context on each call', () => {
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of({ data: [] }));
      
      service.getCoverageVariants('1', '1').subscribe();
      service.getCoverageVariants('2', '2').subscribe();
      
      expect(productContext._getProductContext).toHaveBeenCalledTimes(3); // 1 in constructor + 2 in method calls
    });
  });

  describe('createCoverageVariant', () => {
    it('should create coverage variant', () => {
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockCoverageVariant));
      
      service.createCoverageVariant(mockCreateCoverageVariant, '1', '1').subscribe((result: CoverageVariant) => {
        expect(result).toEqual(mockCoverageVariant);
      });
      
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/1/coveragevariants?versionId=1&requestId=1',
        mockCreateCoverageVariant
      );
    });

    it('should handle creation with minimal data', () => {
      const minimalData: CreateCoverageVariant = {
        coverageVariantId: 'MIN001',
        name: 'Minimal',
        isPeril: false,
        isRateBearing: false,
        is3rdParty: false,
        relatedCoverageVariantIds: [],
        lastUpdated: new Date(),
        allocationPercent: 0,
        coveragespremiumregistration: [],
        subCoverages: [],
        insuredObjects: [],
        coverageVariantLevels: [],
        exclusions: [],
        requestId: '1',
        isCurrentVersion: true
      };
      
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(minimalData));
      
      service.createCoverageVariant(minimalData, '1', '1').subscribe((result: any) => {
        expect(result).toEqual(minimalData);
      });
    });

    it('should handle creation errors', () => {
      const error = new Error('Creation failed');
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(throwError(() => error));
      
      service.createCoverageVariant(mockCreateCoverageVariant, '1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle undefined product parameters', () => {
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockCoverageVariant));
      
      service.createCoverageVariant(mockCreateCoverageVariant, undefined, undefined).subscribe();
      
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants?versionId=undefined&requestId=1',
        mockCreateCoverageVariant
      );
    });

    it('should refresh product context before creation', () => {
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockCoverageVariant));
      
      service.createCoverageVariant(mockCreateCoverageVariant, '1', '1').subscribe();
      
      expect(productContext._getProductContext).toHaveBeenCalledTimes(2); // 1 in constructor + 1 in method
    });
  });

  describe('getCoverageVariant', () => {
    it('should get single coverage variant', () => {
      const res: CoverageVariantResponse = { requestId: '1', data: mockCoverageVariant };
      const url = '/canvas/api/catalyst/products/1/coveragevariants/CV001?versionId=1&requestId=1';
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariant('CV001', '1', '1').subscribe((data: CoverageVariant) => {
        expect(data).toEqual(res.data);
      });
      
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url);
    });

    it('should handle empty coverage variant response', () => {
      const res: CoverageVariantResponse = { requestId: '1', data: null as any };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariant('CV001', '1', '1').subscribe((data: CoverageVariant) => {
        expect(data).toBeNull();
      });
    });

    it('should handle get coverage variant errors', () => {
      const error = new Error('Not found');
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => error));
      
      service.getCoverageVariant('CV001', '1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle undefined parameters in get', () => {
      const res: CoverageVariantResponse = { requestId: '1', data: mockCoverageVariant };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getCoverageVariant('CV001', undefined, undefined).subscribe();
      
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants/CV001?versionId=undefined&requestId=1'
      );
    });
  });

  describe('updateCoverageVariant', () => {
    it('should update coverage variant', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(mockCoverageVariant));
      
      service.updateCoverageVariant(mockCreateCoverageVariant, 'CV001', '1', '1').subscribe((result: CoverageVariant) => {
        expect(result).toEqual(mockCoverageVariant);
      });
      
      expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/1/coveragevariants/CV001?versionId=1',
        mockCreateCoverageVariant
      );
    });

    it('should handle update with modified data', () => {
      const modifiedData = { ...mockCreateCoverageVariant, name: 'Modified Name' };
      
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(modifiedData));
      
      service.updateCoverageVariant(modifiedData, 'CV001', '1', '1').subscribe((result: any) => {
        expect(result.name).toBe('Modified Name');
      });
    });

    it('should handle update errors', () => {
      const error = new Error('Update failed');
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(throwError(() => error));
      
      service.updateCoverageVariant(mockCreateCoverageVariant, 'CV001', '1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle undefined parameters in update', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(mockCoverageVariant));
      
      service.updateCoverageVariant(mockCreateCoverageVariant, 'CV001', undefined, undefined).subscribe();
      
      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants/CV001?versionId=undefined',
        mockCreateCoverageVariant
      );
    });

    it('should refresh product context before update', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(mockCoverageVariant));
      
      service.updateCoverageVariant(mockCreateCoverageVariant, 'CV001', '1', '1').subscribe();
      
      expect(productContext._getProductContext).toHaveBeenCalledTimes(2); // 1 in constructor + 1 in method
    });
  });

  describe('deleteCoverageVariant', () => {
    it('should delete coverage variant', () => {
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(true));
      
      service.deleteCoverageVariant('CV001').subscribe((result: boolean) => {
        expect(result).toBe(true);
      });
      
      expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.delete).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/PROD17/coveragevariants/CV001?versionId=17&requestId=1'
      );
    });

    it('should handle delete errors', () => {
      const error = new Error('Delete failed');
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(throwError(() => error));
      
      service.deleteCoverageVariant('CV001').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle deletion with empty ID', () => {
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(false));
      
      service.deleteCoverageVariant('').subscribe((result: boolean) => {
        expect(result).toBe(false);
      });
      
      expect(httpClientSpy.delete).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/PROD17/coveragevariants/?versionId=17&requestId=1'
      );
    });

    it('should refresh product context before deletion', () => {
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(true));
      
      service.deleteCoverageVariant('CV001').subscribe();
      
      expect(productContext._getProductContext).toHaveBeenCalledTimes(2); // 1 in constructor + 1 in method
    });
  });

  describe('getStandardCoverage', () => {
    it('should load standard coverage codes', () => {
      const res: StandardCoverageResponse = { requestId: '1', data: mockStandardCoverage };
      const url = '/canvas/api/catalyst/products/GetCoverageMasterGeniusData?prodClass=1&language=en&country=IE&requestId=1';
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getStandardCoverage(['1']).subscribe((data: StandardCoverage[]) => {
        expect(data).toEqual(mockStandardCoverage);
      });
      
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(url);
    });

    it('should handle multiple product class IDs', () => {
      const res: StandardCoverageResponse = { requestId: '1', data: mockStandardCoverage };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getStandardCoverage(['1', '2', '3']).subscribe();
      
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/GetCoverageMasterGeniusData?prodClass=1,2,3&language=en&country=IE&requestId=1'
      );
    });

    it('should handle empty product class array', () => {
      const res: StandardCoverageResponse = { requestId: '1', data: [] };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getStandardCoverage([]).subscribe((data: StandardCoverage[]) => {
        expect(data).toEqual([]);
      });
    });

    it('should handle undefined product class IDs', () => {
      const res: StandardCoverageResponse = { requestId: '1', data: mockStandardCoverage };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
      
      service.getStandardCoverage([undefined]).subscribe();
      
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/GetCoverageMasterGeniusData?prodClass=&language=en&country=IE&requestId=1'
      );
    });

    it('should handle standard coverage errors', () => {
      const error = new Error('Standard coverage failed');
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => error));
      
      service.getStandardCoverage(['1']).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should use correct language and country', () => {
      const contextWithFrench: ProductContext = { ...productContextResponse, language: 'fr', country: ['FR'] };
      productContext._getProductContext.mockReturnValue(contextWithFrench);
      
      const newService = new CoverageVariantService(httpClientSpy, productContext);
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of({ data: [] }));
      
      newService.getStandardCoverage(['1']).subscribe();
      
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        expect.stringContaining('language=fr&country=FR')
      );
    });
  });

  describe('updateStandardVariant', () => {
    it('should update standard variant', () => {
      const data = [mockCoveragesPremiumRegistration];
      
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockCoveragesPremiumRegistration));
      
      service.updateStandardVariant(data, 'CV001', '1', '1').subscribe((result: coveragespremiumregistration) => {
        expect(result).toEqual(mockCoveragesPremiumRegistration);
      });
      
      expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/1/coveragevariants/CV001/coverage?versionId=1',
        data
      );
    });

    it('should handle empty data array', () => {
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(null));
      
      service.updateStandardVariant([], 'CV001', '1', '1').subscribe();
      
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/1/coveragevariants/CV001/coverage?versionId=1',
        []
      );
    });

    it('should handle update standard variant errors', () => {
      const error = new Error('Update standard variant failed');
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(throwError(() => error));
      
      service.updateStandardVariant([mockCoveragesPremiumRegistration], 'CV001', '1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle undefined parameters in updateStandardVariant', () => {
      const data = [mockCoveragesPremiumRegistration];
      
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockCoveragesPremiumRegistration));
      
      service.updateStandardVariant(data, 'CV001', undefined, undefined).subscribe();
      
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants/CV001/coverage?versionId=undefined',
        data
      );
    });
  });

  describe('updateCoverageCode', () => {
    it('should update coverage code', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of({ data: mockCoveragesPremiumRegistration }));
      
      service.updateCoverageCode(mockCoveragesPremiumRegistration, 'CV001', 'COV001', '1', '1').subscribe((result: any) => {
        expect(result).toBeDefined();
      });
      
      expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/1/coveragevariants/CV001/coverages/COV001?versionId=1&requestId=1',
        mockCoveragesPremiumRegistration
      );
    });

    it('should handle update coverage code errors', () => {
      const error = new Error('Update coverage code failed');
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(throwError(() => error));
      
      service.updateCoverageCode(mockCoveragesPremiumRegistration, 'CV001', 'COV001', '1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle undefined parameters in updateCoverageCode', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of({}));
      
      service.updateCoverageCode(mockCoveragesPremiumRegistration, 'CV001', 'COV001', undefined, undefined).subscribe();
      
      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/undefined/coveragevariants/CV001/coverages/COV001?versionId=undefined&requestId=1',
        mockCoveragesPremiumRegistration
      );
    });

    it('should refresh product context before updating coverage code', () => {
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of({}));
      
      service.updateCoverageCode(mockCoveragesPremiumRegistration, 'CV001', 'COV001', '1', '1').subscribe();
      
      expect(productContext._getProductContext).toHaveBeenCalledTimes(2); // 1 in constructor + 1 in method
    });
  });

  describe('Modal and code management', () => {
    it('should set show modal value', () => {
      const spy = jest.spyOn(service._showModalUpdated, 'next');
      
      service.setShowModal(true);
      
      expect(service._showModal).toBe(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should set show modal with different values', () => {
      const spy = jest.spyOn(service._showModalUpdated, 'next');
      
      service.setShowModal('test');
      service.setShowModal(false);
      service.setShowModal(null);
      
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'test');
      expect(spy).toHaveBeenNthCalledWith(2, false);
      expect(spy).toHaveBeenNthCalledWith(3, null);
    });

    it('should delete allocation code', () => {
      const spy = jest.spyOn(service._deleteCoverageCodeUpdated, 'next');
      
      service.deleteAllocationCode(true);
      
      expect(service._deletecoverageCode).toBe(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should delete allocation code with different values', () => {
      const spy = jest.spyOn(service._deleteCoverageCodeUpdated, 'next');
      
      service.deleteAllocationCode('delete');
      service.deleteAllocationCode(false);
      service.deleteAllocationCode(undefined);
      
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'delete');
      expect(spy).toHaveBeenNthCalledWith(2, false);
      expect(spy).toHaveBeenNthCalledWith(3, undefined);
    });
  });

  describe('Service properties and configuration', () => {
    it('should have correct favorites key', () => {
      expect(service['_favoritesKey']).toBe('coveragevariant');
    });

    it('should have correct base URL', () => {
      expect(service.baseUrl).toBe('/canvas/api/catalyst/products');
    });

    it('should initialize subjects', () => {
      expect(service._showModalUpdated).toBeDefined();
      expect(service._deleteCoverageCodeUpdated).toBeDefined();
    });

    it('should handle multiple product context refreshes', () => {
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of({ data: [] }));
      
      service.getCoverageVariants('1', '1').subscribe();
      service.getCoverageVariant('CV001', '1', '1').subscribe();
      service.getStandardCoverage(['1']).subscribe();
      
      // Should be called multiple times (constructor + each method call)
      expect(productContext._getProductContext).toHaveBeenCalledTimes(4);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle null product context response', () => {
      productContext._getProductContext.mockReturnValue(null);
      
      expect(() => {
        new CoverageVariantService(httpClientSpy, productContext);
      }).not.toThrow();
    });

    it('should handle malformed product context', () => {
      const malformedContext = { country: null, language: null, requestId: null };
      productContext._getProductContext.mockReturnValue(malformedContext);
      
      expect(() => {
        new CoverageVariantService(httpClientSpy, productContext);
      }).not.toThrow();
    });

    it('should handle network timeouts', () => {
      const timeoutError = new Error('Timeout');
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => timeoutError));
      
      service.getCoverageVariants('1', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err.message).toBe('Timeout');
        }
      });
    });

    it('should handle malformed response data', () => {
      const malformedResponse = { unexpectedProperty: 'value' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(malformedResponse));
      
      service.getCoverageVariants('1', '1').subscribe((data: any) => {
        expect(data).toBeUndefined();
      });
    });
  });
});