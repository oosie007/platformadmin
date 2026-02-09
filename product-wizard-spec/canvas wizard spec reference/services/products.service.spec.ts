/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductsService } from './products.service';
import {  MasterData, MasterDataResponse, ProductHeader, ProductRequest } from '../types/product';
import { productContextResponse } from '../types/mockResponses';
import { of } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
//import axios from 'axios'; // Import axios using ES module syntax
//import { downloadFile } from './downloadFile'; // Adjust the path as necessary
//import { saveAs } from 'file-saver'; // Import saveAs from file-saver package

jest.useFakeTimers();

describe('ProductsService', () => {
  let service: ProductsService;
  let httpCache:any;
  let httpClientSpy: any;
  let poductContext:any;
const mockProductHeader:ProductHeader={
  createdOn: new Date(),
  updatedOn: new Date(),
  productName:'Ireland personal accident v1',
  productVersionName: '1.0',
  shortName: ' personal',
  description: 'Ireland personal accident v1',
  marketingName:'Ireland personal accident v1',
  status: {
    value: "FINAL",
    category: "PRODUCTSTATUS"
  },
  premiumCurrency:{
    value: "IRP",
    category: "CURRENCY"
  },
  limitsCurrency:{
    value: "IRP",
    category: "CURRENCY"
  },
  effectiveDate: new Date(),
  expiryDate: new Date(),
  country: ['US']
}
const mockProductRequest:ProductRequest={
  productId: 'SXPAirr56',
  productVersionId: '1.0',
  header: mockProductHeader,
  country: ['US'],
  rating: {
    premiumRatingFactors: [''],
  },
  requestId:'1'
}
const mockForm:any={
  id:'1'
}
  // Mock for ReferenceDataProvider
  const referenceDataServiceMock = {
    get: jest.fn(),
    invalidateCache: jest.fn() // Add any other required methods here

  };
  const mockResponse: MasterDataResponse = {
    data: [
      // Add your mock data here
    ],
    requestId: '',
    Succeeded: false
  };
  // downloadFile.test.js
// jest.mock('axios');
// jest.mock('file-saver');
  beforeEach(async () => {
    httpClientSpy = { get: jest.fn(), patch: jest.fn() ,post:jest.fn(),delete:jest.fn(),pipe:jest.fn()};
    httpCache= { get: jest.fn(), patch: jest.fn() };
    poductContext = { _getProductContext: jest.fn(() =>  {return productContextResponse}) };
    service = new ProductsService(httpClientSpy,httpCache,referenceDataServiceMock,poductContext);
  
  });
  beforeAll(() => {
    if (!global.crypto) {
      global.crypto = {} as any;
    }
  
    global.crypto.randomUUID = jest.fn().mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
  
  });
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should test getCountry', () => {
    const res = [{ id: '1', name: 'Country' }]; // Mock response
    const url = '/canvas/api/catalyst/reference-data/COUNTRY?language=en&country=00&requestId=1';

    // Spy on the correct method
    jest.spyOn(referenceDataServiceMock, 'get').mockReturnValue(of(res));
    service.getCountry().subscribe();

    expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('COUNTRY', {
      params: {
        requestId: productContextResponse.requestId
      }
    });
  });


  it('should call get on ReferenceDataService with correct parameters', (done) => {
    const countryCode = 'US';
    const mockResponse = [{ id: 1, name: 'State1' }];

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getState(countryCode).subscribe((data) => {
      expect(data).toEqual(mockResponse);

      expect(referenceDataServiceMock.get).toHaveBeenCalledWith('STATE', {
        params: {
          requestId: productContextResponse.requestId,
        },
        mappings: [
          { key: 'countryCode', value: countryCode },
          { key: 'languageId', value: productContextResponse.language },
        ],
      });

      done();
    });
  });
  it('should load the products', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
        { id: '89', description: 'Ireland', rank: 50, code: 'IE' },
      ],
    };
    const url =
      '/canvas/api/catalyst/products?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    jest.spyOn(httpClientSpy, 'pipe').mockReturnValue(of(res.data));
    service.getProductsList();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it('should use default country "IE" if no country is provided', (done) => {
    httpClientSpy.get.mockReturnValue(of(mockResponse));

    service.getCurrency().subscribe((data) => {
      expect(httpClientSpy.get).toHaveBeenCalledWith(expect.stringContaining('country=IE'), expect.any(Object));
      expect(data).toEqual(mockResponse.data);
      done();
    });
  });

  it('should use the given country if provided', (done) => {
    const country = 'US';
    httpClientSpy.get.mockReturnValue(of(mockResponse));

    service.getCurrency(country).subscribe((data) => {
      expect(httpClientSpy.get).toHaveBeenCalledWith(expect.stringContaining(`country=${country}`), expect.any(Object));
      expect(data).toEqual(mockResponse.data);
      done();
    });
  });


  // it('should call get on ReferenceDataService with correct parameters', (done) => {
  //   const mockResponse = [{ id: 1, name: 'DataType1' }];
  
  //   referenceDataServiceMock.get.mockReturnValue(of(mockResponse));
  
  //   console.log('Starting test for getDataTypes...');
    
  //   service.getDataTypes().subscribe({
  //     next: (data) => {
  //       console.log('Subscription data:', data);
  //       expect(data).toEqual(mockResponse);
  
  //       expect(referenceDataServiceMock.get).toHaveBeenCalledWith('ATTRDATATYPE', {
  //         params: {
  //           requestId: productContextResponse.requestId,
  //         },
  //         mappings: [
  //           { key: 'countryCode', value: 'US' },
  //           { key: 'languageId', value: productContextResponse.language },
  //         ],
  //       });
  
  //       done(); // Ensure this is called when the test completes
  //     },
  //     error: (err) => {
  //       console.error('Error in subscription:', err);
  //       done(err);
  //     }
  //   });
  // },10000);

  it('should handle an empty response correctly', (done) => {
    const mockResponse: MasterData[]  = [];

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getDataTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse);
      done();
    });
  });

  it('should load the Status', () => {
    const mockResponse = { data: [{ id: 'status1', name: 'Active' }] };
  const expectedUrl = '/canvas/api/catalyst/reference-data/STATUS?language=en&country=IE&requestId=123';
    // Mock get to return a successful observable response
    httpClientSpy.get.mockReturnValue(of(mockResponse));
    service.getStatus().subscribe(data => {
      expect(data).toEqual(mockResponse.data);
    });

  // Check if get was called with the correct URL
  //expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  //expect(httpClientSpy.get).toHaveBeenCalledWith(expectedUrl);
  });

  it('should update the Status', () => {
    const res = 'Product does not exists.';
  jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(res));
  service.updateStatus('1','1','A5');
  expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);

  });

  it('should get a product', () => {
       const mockResponse = { data: { id: 1, name: 'Test Product' } };
    const url = '/canvas/api/catalyst/products/1?versionId=1&requestId=1&language=en&country=IE';

    const headers = { headers: new HttpHeaders({ versioned: 'true' }) };

    // Mock response for httpClientSpy.get
    httpClientSpy.get.mockReturnValue(of(mockResponse));

    // Call the getProduct method
    service.getProduct('1', '1', true).subscribe(product => {
      expect(product).toEqual(mockResponse.data);
    });

    // Verify the call includes both URL and headers/options
    //expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
   // expect(httpClientSpy.get).toHaveBeenCalledWith(url, headers);
  });

  it('should create a product', () => {
    const res = 'Product does not exists.';

    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.create(mockProductRequest).subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
  });

  it('should clone a product', () => {
    const res = 'Product does not exists.';

    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.cloneProduct('1','1','2','test','test1','20/08/2024','30/09/2030').subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
  });

  it('should import a product', () => {
    const res = 'Product does not exists.';

    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.importProduct(mockForm).subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
  });

  it('should update a product', () => {
    const res = 'Product does not exists.';
    jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(res));
    service.updateProduct(mockProductRequest,'1').subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
  });

  it('should export a product', () => {
    const res = 'Product does not exists.';

    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
     service.exportProduct('1','1','IE','EMEA');
  });


  it('should delete product', () => {
    const res = 'Product does not exists.';
    jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(res));
    service.DeleteProduct( '1', '1');
    expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
  });

  it('should load the premium rating factors', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
        { id: '89', description: 'Ireland', rank: 50, code: 'IE' },
      ],
    };
    const url =
    '/canvas/api/catalyst/products/1/ratings/premuim-rating-factors?versionId=1&requestId=1';
  jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
  service.getProductPremiumRatingFactors('1','1');
  expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  expect(httpClientSpy.get).toHaveBeenCalledWith(url);

  });

  it('should get product attribute', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
        { id: '89', description: 'Ireland', rank: 50, code: 'IE' },
      ],
    };
    const url =
    '/canvas/api/catalyst/products/1/attribute-paths?versionId=1&requestId=1';
  jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
  service.getProductAttributes('1','1');
  expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
  expect(httpClientSpy.get).toHaveBeenCalledWith(url);

  });

  it('should create rating factor', () => {
    const res = 'Product does not exists.';

    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.PostProductPremiumRatingFactors(mockProductRequest,'1','1').subscribe({
      next: (data) => {
        expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete'),
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
  });

  it('should update the policy', () => {
    const res = 'Product does not exists.';
  jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(res));
  service.updatePolicy(mockProductRequest,'1',);
  expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);

  });

  it('should load productratingfactors', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    const url =
      '/canvas/api/catalyst/reference-data/RatingFactors?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getProductRatingFactors();
   // expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    //expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it('should set a model', () => {
    service.setShowModal('1');
  });
  it('should delete model', () => {
    service.deleteProduct('1');
  });

  it('should load country list', () => {
     const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    const url =
      '/canvas/api/catalyst/reference-data/COUNTRY?language=en&country=00&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getCountryList('EMEA');
  });

  it('should get limit scopes', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };
    
    // Mock the response from _referenceDataService.get
    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getLimitScopes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });

    //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('LIMITSCOPE', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should call _referenceDataService.get with correct parameters', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getMinMaxLimitTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });
     //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
     expect(referenceDataServiceMock.get).toHaveBeenCalledWith('LIMITTYPE', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });
  it('should get waiting period ', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example waiting period limit' }] };
    
    // Mock the response from _referenceDataService.get
    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getWaitingPeriodList().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });

    //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('WAITPRD', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should call deductables with correct parameters', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getDeductibleValueTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });
     //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
     expect(referenceDataServiceMock.get).toHaveBeenCalledWith('RFDVAL', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should call percentage value types with correct parameters', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getPercentageValueTypes('I').subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });
     //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
     expect(referenceDataServiceMock.get).toHaveBeenCalledWith('PERCENTVALUETYPES', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' },
        {
          key: 'parentCode',
          value: 'I',
        },
      ]
    });
  });

  it('should call duration type with correct parameters', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getDurationTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });
     //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
     expect(referenceDataServiceMock.get).toHaveBeenCalledWith('DURATIONTYPE', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should call to get the reference data with correct parameters', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Limit Scope' }] };

    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getReferenceData('CURRENCY').subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });
     //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
     expect(referenceDataServiceMock.get).toHaveBeenCalledWith('CURRENCY', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });
  it('should get deductible types ', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Deductible types' }] };
    
    // Mock the response from _referenceDataService.get
    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getDeductibleTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });

    //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('DEDUCTIBLETYPE', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should get insured types', () => {
    const mockResponse = { data: [{ id: '1', name: 'Example Insured Type' }] };
    
    // Mock the response from _referenceDataService.get
    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getInsuredTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });

   // expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('INSURED', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should get dependent types', () => {
    const mockResponse = { data: [{ id: '2', name: 'Example Dependent Type' }] };

    // Mock the response from _referenceDataService.get
    referenceDataServiceMock.get.mockReturnValue(of(mockResponse));

    service.getDependentTypes().subscribe((data) => {
      expect(data).toEqual(mockResponse.data);
    });

    //expect(referenceDataServiceMock.get).toHaveBeenCalledTimes(1);
    expect(referenceDataServiceMock.get).toHaveBeenCalledWith('DEPENDENTTYPE', {
      params: { requestId: '1' },
      mappings: [
        { key: 'countryCode', value: 'IE' },
        { key: 'languageId', value: 'en' }
      ]
    });
  });

  it('should return mock breakdown types', (done) => {
    service.getBreakDownType().subscribe((data: MasterData[]) => {
      expect(data).toHaveLength(2);
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({
          description: "Coverage variant",
          code: "COVGVAR",
          country: "IE"
        }),
        expect.objectContaining({
          description: "Standard coverage code",
          code: "STDCOVER",
          country: "IE"
        })
      ]));
      done();
    });
  });


});
