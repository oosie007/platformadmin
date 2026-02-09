import { InsuredTypeService } from "./insured-type.service";
import { productContextResponse } from "../types/mockResponses";
import { of } from "rxjs";
import { referenceDataDataType } from '../../../../../products/mock/mock-insured-type';
import { referenceDataAllowedParties } from '../../../../../products/mock/mock-insured-type';
import { insuredObjectsData } from '../../../../../products/mock/mock-insured-type';
import { mockReferenceDataInsured } from '../../../../../products/mock/mock-reference-data';
import { mockReferenceDataDependentType } from '../../../../../products/mock/mock-reference-data';


jest.useFakeTimers();

describe('InsuredTypeService', () => {
    let service: InsuredTypeService;
    let productContext!: any;
    let httpClientSpy: any;

    beforeEach(() => {
        httpClientSpy = { get: jest.fn(), patch: jest.fn(), post: jest.fn(), delete: jest.fn() };
        productContext = { _getProductContext: jest.fn(() => { return productContextResponse }) }
        service = new InsuredTypeService(httpClientSpy, productContext);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call getPredefinedAttributes and return data', () => {
        const productClass = 'GADGETS';
        const url = '/canvas/api/catalyst/Insured/GADGETS?insuredType=OBJECT';
        const mockData = { some: 'data' };
        jest.spyOn(httpClientSpy, 'get').mockReturnValue(of({ data: mockData }));
        // Patch the service to use the spy httpClient
        service = new InsuredTypeService(httpClientSpy, productContext);
        service.getPredefinedAttributes(productClass).subscribe((data) => {
            expect(data).toEqual(mockData);
        });
        expect(httpClientSpy.get).toHaveBeenCalledWith(url);
    });
});
