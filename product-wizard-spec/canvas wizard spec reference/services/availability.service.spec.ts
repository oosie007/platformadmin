/* eslint-disable @typescript-eslint/no-explicit-any */
import { of, throwError } from 'rxjs';
import { UtilityService } from '../../services/utility.service';
import {
  AvailabilityRequest,
  StandardAvalability,
  State_List,
  RootAvailability,
  Standard,
} from '../types/availability';
import { productContextResponse } from '../types/mockResponses';
import { AvailabilityService } from './availability.service';
import { MasterData } from '../types/product';

jest.useFakeTimers();

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let productContext!: any;
  let httpClientSpy: any;
  let utilityService: UtilityService;

  const mockCountryData: MasterData[] = [
    { id: '87', description: 'Home Office', rank: 50, code: '00' },
    { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
  ];

  const mockStateData: State_List[] = [
    { id: '1', description: 'California', rank: '1', code: 'CA' },
    { id: '2', description: 'Texas', rank: '2', code: 'TX' },
  ];

  const mockAvailabilityData: RootAvailability = {
    id: '1',
    standards: [
      {
        availabilityId: '1',
        country: 'US',
        states: [],
        locale: 'en_US',
        blacklistZipCodes: [],
      },
    ],
    ruleSets: [],
  };

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      patch: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };
    
    productContext = {
      _getProductContext: jest.fn(() => {
        return productContextResponse;
      }),
    };

    utilityService = {
      updateMinimumPremiumDetails: jest.fn(() => of(mockAvailabilityData.standards)),
    } as any;

    const productContextServiceStub = { 
      _getProductContext: () => ({
        ...productContextResponse,
        requestId: 'test-request-id',
        language: 'en',
        country: ['US']
      })
    } as any;

    service = new AvailabilityService(
      httpClientSpy as any,
      productContextServiceStub,
      utilityService
    );
  });

  afterEach(() => {
    // Reset availability cache between tests
    service.removeAvailability();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('_productContext', () => {
    it('should set default language when language is empty', () => {
      const contextWithEmptyLanguage = {
        ...productContextResponse,
        language: '',
        requestId: '',
        country: []
      };
      
      productContext._getProductContext.mockReturnValue(contextWithEmptyLanguage);
      service['_productContext']();
      
      expect(service.productContext.language).toBe('en');
      expect(service.productContext.requestId).toBeTruthy();
      expect(service.country).toBe('IE');
    });

    it('should preserve existing language when valid', () => {
      const contextWithLanguage = {
        ...productContextResponse,
        language: 'fr',
        requestId: 'existing-id',
        country: ['FR']
      };
      
      productContext._getProductContext.mockReturnValue(contextWithLanguage);
      service['_productContext']();
      
      expect(service.productContext.language).toBe('fr');
      expect(service.productContext.requestId).toBe('existing-id');
      expect(service.country).toBe('FR');
    });

    it('should handle null/undefined values', () => {
      const contextWithNulls = {
        ...productContextResponse,
        language: null,
        requestId: undefined,
        country: [null]
      };
      
      productContext._getProductContext.mockReturnValue(contextWithNulls);
      service['_productContext']();
      
      expect(service.productContext.language).toBe('en');
      expect(service.productContext.requestId).toBeTruthy();
      expect(service.country).toBe('IE');
    });
  });

  describe('getCountry', () => {
    it('should get country list successfully', () => {
      const mockResponse = { data: mockCountryData };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));

      service.getCountry().subscribe(result => {
        expect(result).toEqual(mockCountryData);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        expect.stringContaining('/canvas/api/catalyst/reference-data/COUNTRY')
      );
    });

    it('should handle getCountry error', () => {
      const errorResponse = { status: 404, message: 'Not found' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => errorResponse));

      service.getCountry().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('getState', () => {
    it('should get state list for country', () => {
      const mockResponse = { data: mockStateData };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));

      service.getState('US').subscribe(result => {
        expect(result).toEqual(mockStateData);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        expect.stringContaining('/canvas/api/catalyst/reference-data/STATE')
      );
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        expect.stringContaining('country=US')
      );
    });

    it('should handle getState error', () => {
      const errorResponse = { status: 500, message: 'Server error' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => errorResponse));

      service.getState('US').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('getAvailability', () => {
    it('should fetch availability from API when cache is empty', () => {
      const mockResponse = { data: mockAvailabilityData };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));

      service.getAvailability('123', '1.0').subscribe(result => {
        expect(result).toEqual(mockAvailabilityData);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/123/availability?versionId=1.0'
      );
    });

    it('should return cached availability when available', () => {
      // First call to populate cache
      const mockResponse = { data: mockAvailabilityData };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));
      
      service.getAvailability('123', '1.0').subscribe();

      // Second call should use cache
      jest.clearAllMocks();
      
      service.getAvailability('123', '1.0').subscribe(result => {
        expect(result).toEqual(mockAvailabilityData);
      });

      expect(httpClientSpy.get).not.toHaveBeenCalled();
    });

    it('should handle getAvailability error', () => {
      const errorResponse = { status: 403, message: 'Forbidden' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => errorResponse));

      service.getAvailability('123', '1.0').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('removeAvailability', () => {
    it('should clear cached availability', () => {
      service['availability'] = mockAvailabilityData;
      
      service.removeAvailability();
      
      expect(service['availability']).toBeNull();
    });
  });

  describe('updatestandard', () => {
    it('should update availability and clear cache', () => {
      const mockRequest: AvailabilityRequest = {
        requestId: '1',
        standards: mockAvailabilityData.standards,
        ruleSets: [],
      };
      const mockResponse = { data: mockAvailabilityData };
      
      service['availability'] = mockAvailabilityData; // Set cache
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(mockResponse));

      service.updatestandard(mockRequest, '123', '1.0').subscribe();

      expect(httpClientSpy.patch).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/123/availability?versionId=1.0',
        mockRequest
      );
      expect(service['availability']).toBeNull(); // Cache should be cleared
    });

    it('should handle updatestandard error', () => {
      const mockRequest: AvailabilityRequest = {
        requestId: '1',
        standards: [],
        ruleSets: [],
      };
      const errorResponse = { status: 400, message: 'Bad request' };
      jest.spyOn(httpClientSpy, 'patch').mockReturnValue(throwError(() => errorResponse));

      service.updatestandard(mockRequest, '123', '1.0').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('deletestandard', () => {
    it('should delete availability standard', () => {
      const mockResponse = { success: true };
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(mockResponse));

      service.deletestandard('123', '1.0', 'avail-1').subscribe();

      expect(httpClientSpy.delete).toHaveBeenCalledWith(
        expect.stringContaining('/canvas/api/catalyst/products/123/availability/avail-1')
      );
      expect(httpClientSpy.delete).toHaveBeenCalledWith(
        expect.stringContaining('versionId=1.0')
      );
    });

    it('should handle deletestandard error', () => {
      const errorResponse = { status: 404, message: 'Not found' };
      jest.spyOn(httpClientSpy, 'delete').mockReturnValue(throwError(() => errorResponse));

      service.deletestandard('123', '1.0', 'avail-1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('createStandard', () => {
    it('should create new availability standard', () => {
      const mockStandard: StandardAvalability = {
        country: 'US',
        states: [],
        locale: 'en_US',
        blacklistZipCodes: [],
      };
      const mockResponse = { success: true };
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(mockResponse));

      service.createStandard(mockStandard, '123', '1.0').subscribe();

      expect(httpClientSpy.post).toHaveBeenCalledWith(
        expect.stringContaining('/canvas/api/catalyst/products/123/availability/standard'),
        mockStandard
      );
    });

    it('should handle createStandard error', () => {
      const mockStandard: StandardAvalability = {
        country: 'US',
        states: [],
        locale: 'en_US',
        blacklistZipCodes: [],
      };
      const errorResponse = { status: 409, message: 'Conflict' };
      jest.spyOn(httpClientSpy, 'post').mockReturnValue(throwError(() => errorResponse));

      service.createStandard(mockStandard, '123', '1.0').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('getavailabilitybyId', () => {
    it('should fetch availability by ID from API when cache is empty', () => {
      const mockStandard: Standard = mockAvailabilityData.standards[0];
      const mockResponse = { data: mockStandard };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));

      service.getavailabilitybyId('123', '1.0', '1').subscribe(result => {
        expect(result).toEqual(mockStandard);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        expect.stringContaining('/canvas/api/catalyst/products/123/availability/1')
      );
    });

    it('should return availability from cache when available', () => {
      service['availability'] = mockAvailabilityData;

      service.getavailabilitybyId('123', '1.0', '1').subscribe(result => {
        expect(result).toEqual(mockAvailabilityData.standards[0]);
      });

      expect(httpClientSpy.get).not.toHaveBeenCalled();
    });

    it('should handle getavailabilitybyId error', () => {
      const errorResponse = { status: 404, message: 'Not found' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => errorResponse));

      service.getavailabilitybyId('123', '1.0', '1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });
  });

  describe('setShowModal', () => {
    it('should set modal state and emit update', () => {
      const mockValue = true;
      const spy = jest.spyOn(service._showModalUpdated, 'next');

      service.setShowModal(mockValue);

      expect(service._showModal).toBe(mockValue);
      expect(spy).toHaveBeenCalledWith(mockValue);
    });

    it('should handle different modal values', () => {
      const spy = jest.spyOn(service._showModalUpdated, 'next');

      service.setShowModal('test');
      expect(service._showModal).toBe('test');
      expect(spy).toHaveBeenCalledWith('test');

      service.setShowModal(null);
      expect(service._showModal).toBe(null);
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  describe('deleteAvailability', () => {
    it('should set delete availability state and emit update', () => {
      const mockValue = 'delete-id';
      const spy = jest.spyOn(service._deleteAvailabilityUpdated, 'next');

      service.deleteAvailability(mockValue);

      expect(service._deleteavailability).toBe(mockValue);
      expect(spy).toHaveBeenCalledWith(mockValue);
    });
  });

  describe('getMinimumPremium', () => {
    it('should get minimum premium with utility service enhancement', () => {
      const mockResponse = { data: mockAvailabilityData };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));

      service.getMinimumPremium('123', '1.0').subscribe(result => {
        expect(result.standards).toEqual(mockAvailabilityData.standards);
        expect(result.ruleSets).toEqual(mockAvailabilityData.ruleSets);
        expect(result.requestId).toBe(mockAvailabilityData.id);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/canvas/api/catalyst/products/123/availability?versionId=1.0'
      );
      expect(utilityService.updateMinimumPremiumDetails).toHaveBeenCalledWith(
        mockAvailabilityData.standards
      );
    });

    it('should handle getMinimumPremium error', () => {
      const errorResponse = { status: 500, message: 'Server error' };
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(() => errorResponse));

      service.getMinimumPremium('123', '1.0').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
        }
      });
    });

    it('should handle utility service error in getMinimumPremium', () => {
      const mockResponse = { data: mockAvailabilityData };
      const utilityError = { message: 'Utility service error' };
      
      jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockResponse));
      jest.spyOn(utilityService, 'updateMinimumPremiumDetails').mockReturnValue(
        throwError(() => utilityError)
      );

      service.getMinimumPremium('123', '1.0').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(utilityError);
        }
      });
    });
  });

  describe('Subject observables', () => {
    it('should emit modal state changes', (done) => {
      service._showModalUpdated.subscribe(value => {
        expect(value).toBe(true);
        done();
      });

      service.setShowModal(true);
    });

    it('should emit delete availability changes', (done) => {
      service._deleteAvailabilityUpdated.subscribe(value => {
        expect(value).toBe('test-id');
        done();
      });

      service.deleteAvailability('test-id');
    });
  });

  // Legacy test compatibility
  it('should test getCountry', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getCountry();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  });

  it('should test getState', () => {
    const res = { data: [], succeeded: true };
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getState('AF');
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  });

  it('should test getavailability', () => {
    const res = 'Product does not exists.';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getAvailability('1', '1').subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  });
});
