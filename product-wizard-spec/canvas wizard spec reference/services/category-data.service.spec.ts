/* eslint-disable @typescript-eslint/no-explicit-any */
import { productContextResponse } from '../types/mockResponses';
import { of } from 'rxjs';
import { CategoryDataService } from './category-data.service';

jest.useFakeTimers();

describe('CategoryDataService', () => {
  let service: CategoryDataService;
  let httpClientSpy: any;
  let poductContext:any;
  beforeEach(async () => {
    httpClientSpy = { get: jest.fn(), patch: jest.fn() ,post:jest.fn(),delete:jest.fn(),pipe:jest.fn()};
    poductContext = { _getProductContext: jest.fn(() =>  {return productContextResponse}) };
    service = new CategoryDataService(httpClientSpy,poductContext);   
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load product class', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    const url =
      '/canvas/api/catalyst/reference-data/PRODUCTCLASS?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getProductClass();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it('should load product subclass', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    const url =
      '/canvas/api/catalyst/reference-data/PRODTYPE?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getProductSubClass();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });
  
  it('should load product subclass', () => {
    const res = {
      data: [
        { id: '87', description: 'Home Office', rank: 50, code: '00' },
        { id: '88', description: 'Afghanistan', rank: 50, code: 'AF' },
      ],
    };
    const url =
      '/canvas/api/catalyst/reference-data/CVT?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getCoverageType();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });
  
});
