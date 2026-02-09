import { TestBed } from '@angular/core/testing';
import { SubCoverageLevelService } from './sub-coverage-level.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { isNullOrUndefined } from 'is-what';
import { SubcoverageService } from './subcoverage.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { productContextResponse } from '../types/mockResponses';
import { SubCoverage } from '../types/sub-coverage';
// import { mockAddSubCoverage, mockEditSubCoverage, mockSubCoverageById, mockSubCoverages } from '../../../../mock/mock-coverage-variant';

describe('SubcoverageService', () => {
  let service: SubcoverageService;
  let httpClientSpy: any;
  let productContextService!: any;

  beforeEach(() => {
    httpClientSpy = { get: jest.fn(), patch: jest.fn(), delete: jest.fn(), post: jest.fn() };
    productContextService = { _getProductContext: jest.fn(() =>  {return productContextResponse}) }
    service = new SubcoverageService(httpClientSpy, productContextService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });


  it('should test getSubcoverages', () => {
    const res = require('../../../../mock/mock-coverage-variant').mockSubCoverages;
    const url = '/canvas/api/catalyst/products/SXGG1948/coveragevariants/CVID3?versionId=1.0&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getSubcoverages('SXGG1948', 'CVID3', '1.0').subscribe((data) => {
      expect(data).toEqual(res);
    });
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });


  it('should test getsubCoverageById', () => {
    const res = { data: require('../../../../mock/mock-coverage-variant').mockSubCoverageById };
    const url = '/canvas/api/catalyst/products/SXGG1948/coveragevariants/CVID3/subcoverages/SBC-451BDE31-5535-45A2-AC3A-0B2CCC8AE564?versionId=1.0&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getsubCoverageById('SBC-451BDE31-5535-45A2-AC3A-0B2CCC8AE564', 'SXGG1948', 'CVID3', '1.0').subscribe((data) => {
      expect(data).toEqual(res);
    });
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it('should test addSubCoverage', () => {
    const req = require('../../../../mock/mock-coverage-variant').mockAddSubCoverage;
    const url = '/canvas/api/catalyst/products/SXGG1948/coveragevariants/CVID3/subcoverages?versionId=1.0&requestId=1';
    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(req));
    service.addSubCoverage('SXGG1948', '1.0', 'CVID3', req);
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(url, req);
  });

  it('should test editSubCoverage', () => {
    const req = require('../../../../mock/mock-coverage-variant').mockEditSubCoverage;
    jest.spyOn(httpClientSpy, 'patch').mockReturnValue(of(req));
    service.editSubCoverage(req, 'SBC-451BDE31-5535-45A2-AC3A-0B2CCC8AE564', 'SXGG1948','CVID3',  '1.0');
    expect(httpClientSpy.patch).toHaveBeenCalledTimes(1);
  });

  it('should test deleteSubCoverage', () => {
    const res = 'SubCoverage does not exists.';
    jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(res));
    service.deleteSubCoverage('SXGG1948', '1.0', 'CVID3', 'SBC-451BDE31-5535-45A2-AC3A-0B2CCC8AE564').subscribe({
      next: (data) => {
          expect(data).toEqual(res);
      },
      error: (e) => console.error(e),
      complete: () => console.info('complete')
    })
    expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
  });
  
});