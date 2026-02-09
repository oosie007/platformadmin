import { TestBed } from '@angular/core/testing';
import { PolicyConfigurationService } from './policy-configuration.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MasterData, MasterDataResponse } from '../types/product';
import { ProductContextService } from './product-context.service';
import { productContextResponse } from '../types/mockResponses';
import { of } from 'rxjs';

jest.useFakeTimers();
describe('PolicyConfigurationService', () => {
  let service: PolicyConfigurationService;
  let httpCache: any;
  let httpClientSpy: any;
  let productContext: any;

  const mockPolicyTypeResponse: MasterData[] = [
    {
      "id": "0001",
      "description": "Test1 Policy",
      "rank": 10,
      "code": "TEST1_POL",
    },
    {
      "id": "0002",
      "description": "Test2 Policy",
      "rank": 10,
      "code": "TEST2_POL",
    }
  ];

  const mockPolicyTypeDataResponse: MasterDataResponse = {
    requestId: '60405d7b434cc6049e0347',
    Succeeded: true,
    data: mockPolicyTypeResponse
  };

  beforeEach(() => {
    httpClientSpy = { get: jest.fn(), patch: jest.fn(), post: jest.fn() };
    httpCache = { get: jest.fn(), patch: jest.fn() };
    productContext = { _getProductContext: jest.fn(() => { return productContextResponse }) };
    service = new PolicyConfigurationService(httpClientSpy, productContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should test getPolicyType', () => {
    const request = '/canvas/api/catalyst/reference-data/POLTYPE?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockPolicyTypeDataResponse));
    service.getPolicyType();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test getRefundType', () => {
    const mockRefundTypeResponse: MasterData[] = [
      {
        "id": "0011",
        "description": "No Claim Bonus",
        "rank": 50,
        "code": "NO_CLAIM_BONUS",
      },
      {
        "id": "0032",
        "description": "No Claim Bonus - Fixed Amount",
        "rank": 17,
        "code": "NO_CLM_BONUS_FIXED",
      },
      {
        "id": "0008",
        "description": "No Claim Bonus with refund on Cancellation - Fixed Amount",
        "rank": 15,
        "code": "NO_CLM_BONUS_REFUND",
      },
    ];
    const mockRefundTypeDataResponse: MasterDataResponse = {
      requestId: '60405rtl434cc6049e11456',
      Succeeded: true,
      data: mockRefundTypeResponse
    }

    const req = '/canvas/api/catalyst/reference-data/RFDTYPE?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockRefundTypeDataResponse));
    service.getRefundType();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(req)
  });

  it('should test getRefundValueType', () => {
    const mockRefundValueTypeResponse: MasterData[] = [
      {
        "id": "1",
        "description": "Amount",
        "rank": 50,
        "code": "AMOUNT",
      },
      {
        "id": "32",
        "description": "Percentage",
        "rank": 17,
        "code": "PERCENTAGE",
      },
    ];
    const mockRefundValueDataResponse: MasterDataResponse = {
      requestId: '60405rtl434cc6049e11456',
      Succeeded: true,
      data: mockRefundValueTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/RFDVAL?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockRefundValueDataResponse));
    service.getRefundValueType();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test getRefundFreqType', () => {
    const mockRefundFreqTypeResponse: MasterData[] = [
      {
        "id": "123",
        "description": "Month",
        "rank": 59,
        "code": "MONTH",
      },
      {
        "id": "321",
        "description": "Week",
        "rank": 77,
        "code": "WEEK",
      },
      {
        "id": "891",
        "description": "Day",
        "rank": 77,
        "code": "DAY",
      },
    ];
    const mockRefundFreqDataResponse: MasterDataResponse = {
      requestId: 'l434cc6049e11456',
      Succeeded: true,
      data: mockRefundFreqTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/REFREQTY?language=en&country=IE&requestId=1'
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockRefundFreqDataResponse));
    service.getRefundFreqType()
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test getPolicyPeriodType', () => {
    const mockPolcyPeriodTypeResponse: MasterData[] = [
      {
        "id": "23",
        "description": "Months",
        "rank": 59,
        "code": "MONTHS",
      },
      {
        "id": "341",
        "description": "Weeks",
        "rank": 72,
        "code": "WEEKS",
      },
      {
        "id": "8",
        "description": "Days",
        "rank": 70,
        "code": "DAYS",
      },
      {
        "id": "81",
        "description": "Hours",
        "rank": 7,
        "code": "HOURS",
      },
    ];
    const mockPolcyPeriodDataResponse: MasterDataResponse = {
      requestId: 'dcb20915-68bf-443c-ba00-e71cb779cd81',
      Succeeded: true,
      data: mockPolcyPeriodTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/POLPDTYPE?language=en&country=IE&requestId=1'
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockPolcyPeriodDataResponse));
    service.getPolicyPeriodType()
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test getTaxCharge', () => {
    const mockTaxChargeTypeResponse: MasterData[] = [
      {
        "id": "23",
        "description": "All Taxes",
        "rank": 72,
        "code": "ALL_TAX",
      },
      {
        "id": "24",
        "description": "No Taxes",
        "rank": 72,
        "code": "NO_TAX",
      },
    ];
    const mockTaxChargeDataResponse: MasterDataResponse = {
      requestId: 'cc35-444b-9fd3-8ef80430bb88',
      Succeeded: true,
      data: mockTaxChargeTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/PMTAX?language=en&country=IE&requestId=1'
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockTaxChargeDataResponse));
    service.getTaxCharge()
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test getTermend', () => {
    const mockTermEndTypeResponse: MasterData[] = [
      {
        "id": "3",
        "description": "Auto Renew",
        "rank": 1949,
        "code": "AUTO_RENEW",
      },
      {
        "id": "4",
        "description": "Cancel",
        "rank": 1942,
        "code": "CANCEL",
      },
    ];
    const mockTermEndDataResponse: MasterDataResponse = {
      requestId: 'sdfr-sdf-9fd3-8ef80430bb88',
      Succeeded: true,
      data: mockTermEndTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/TERMOPTION?language=en&country=IE&requestId=1'
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockTermEndDataResponse));
    service.getTermend()
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test the renewal types', () => {
    const mockRenewalTypeResponse: MasterData[] = [
      {
        "id": "30",
        "description": "Explicit Auto renewal",
        "rank": 80,
        "code": "EXPL_AUTO_REN",
      },
      {
        "id": "34",
        "description": "TACIT Auto renewal",
        "rank": 80,
        "code": "TACIT_AUTO_REN",
      },
    ];
    const mockRenewalDataResponse: MasterDataResponse = {
      requestId: '8e3a0b1a-sdf-9fd3-8ef80430bb88',
      Succeeded: true,
      data: mockRenewalTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/RENTYP?language=en&country=IE&requestId=1'
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockRenewalDataResponse));
    service.getRenewalType()
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });

  it('should test the policy number renewal types', () => {
    const mockPolicyRenewalTypeResponse: MasterData[] = [
      {
        "id": "7",
        "description": "New Policy Number",
        "rank": 40,
        "code": "NEWPOL",
      },
      {
        "id": "8",
        "description": "Same Policy",
        "rank": 40,
        "code": "SAMEPOL",
      },
    ];
    const mockPolicyRenewalDataResponse: MasterDataResponse = {
      requestId: 'jk78t-sdf-9fd3-8ef80430bb88',
      Succeeded: true,
      data: mockPolicyRenewalTypeResponse
    }

    const request = '/canvas/api/catalyst/reference-data/POLNUM?language=en&country=IE&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(mockPolicyRenewalDataResponse));
    service.getPolicyNumberRenewal();
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(request)
  });
});
