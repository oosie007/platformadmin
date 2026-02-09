import { TestBed } from "@angular/core/testing";
import { ExclusionService } from "./exclusion.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { productContextResponse } from "../types/mockResponses";
import { of } from "rxjs";
import { Exclusion, ExclusionRequest } from "../types/exclusion";

describe('ExclusionService', () => {
    let service: ExclusionService;
    let httpClientSpy: any;
    let productContextService!: any;

    const mockAddExclusion: ExclusionRequest = {
        type: "SRTEST",
        description: "Test",
        phrase: "SRTEST",
        requestId: "2",
        isCurrentVersion: false
    };

    const mockUpdateExclusion: Exclusion = {
        exclusionId: "3",
        type: "SRTEST",
        description: "Test",
        phrase: "SRTEST",
        requestId: "2",
        isCurrentVersion: false
    };

    beforeEach(() => {
        httpClientSpy = { get: jest.fn(), patch: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
        productContextService = { _getProductContext: jest.fn(() => { return productContextResponse }) }
        service = new ExclusionService(httpClientSpy, productContextService)
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should test getexclusions', () => {
        const res = "Product does not exists"
        const req = '/canvas/api/catalyst/products/PRD123/coveragevariants/CVID3/exclusions?versionId=1.0&requestId=1';

        jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
        service.getexclusions('PRD123', 'CVID3', '1.0').subscribe({
            next: (data) => {
                expect(data).toEqual(res);
            },
            error: (e) => console.error(e),
            complete: () => console.info('complete'),
        });
        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(req);
    });

    it('should test createExclusion', () => {
        const res = "Product does not exists";
        const req = '/canvas/api/catalyst/products/PRD123/coveragevariants/CVID3/exclusions?versionId=1.0&requestId=1';

        jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
        service.createExclusion(mockAddExclusion, 'PRD123', 'CVID3', '1.0').subscribe({
            next: (data) => {
                expect(data).toEqual(res);
            },
            error: (e) => console.error(e),
            complete: () => console.info('complete'),
        })
        expect(httpClientSpy.post).toHaveBeenCalledTimes(1);

    });

    it('should test updateExclusion', () => {
        const res = "Product does not exists";
        const req = '/canvas/api/catalyst/products/PRD123/coveragevariants/CVID3/exclusions/3?versionId=1.0&requestId=1';

        jest.spyOn(httpClientSpy, 'put').mockReturnValue(of(res));
        service.updateExclusion(mockUpdateExclusion, 'PRD123', 'CVID3', '1.0', '3').subscribe({
            next: (data) => {
                expect(data).toEqual(res);
            },
            error: (e) => console.error(e),
            complete: () => console.info('complete'),
        })
        expect(httpClientSpy.put).toHaveBeenCalledTimes(1);
    });

    it('should test getExclusionbyId', () => {
        const res = "Product does not exists";
        const req = '/canvas/api/catalyst/products/PRD123/coveragevariants/CVID3/exclusions/3?versionId=1.0&requestId=1';

        jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
        service.getExclusionbyId('3', 'PRD123', 'CVID3', '1.0').subscribe({
            next: (data) => {
                expect(data).toEqual(res);
            },
            error: (e) => console.error(e),
            complete: () => console.info('complete'),
        })
        expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.get).toHaveBeenCalledWith(req);
    });

    it('should test deleteExclusion', () => {
        const res = "Product does not exists";
        const req = '/canvas/api/catalyst/products/PRD123/coveragevariants/CVID3/exclusions/3?versionId=1.0&requestId=1';

        jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(res));
        service.deleteExclusion('3', 'PRD123', 'CVID3', '1.0').subscribe({
            next: (data) => {
                expect(data).toEqual(res);
            },
            error: (e) => console.error(e),
            complete: () => console.info('complete'),
        })
        expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.delete).toHaveBeenCalledWith(req);
    });

});