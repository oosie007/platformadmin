/* eslint-disable @typescript-eslint/no-explicit-any */
import { Subject, of, throwError } from 'rxjs';
import { AvailabilityComponent } from './availability.component';
import { AvailabilityService } from '../../services/availability.service';
import { LayoutService } from '@canvas/components';
import { SharedService } from '../../services/shared.service';
import { Router } from '@angular/router';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { RootAvailability } from '../../types/availability';

describe('AvailabilityComponent', () => {
  let component: AvailabilityComponent;
  let availabilityServiceMock: jest.Mocked<Pick<AvailabilityService, '_showModalUpdated' | 'deleteAvailability' | 'deletestandard' | 'getAvailability'>> & { _showModalUpdated: Subject<any> };
  let layoutServiceMock: { updateBreadcrumbs: jest.Mock; caption$: Subject<string>; showMessage: jest.Mock };
  let sharedServiceMock: { nextButtonClicked: Subject<any>; previousButtonClicked: Subject<any> };
  let routerMock: { navigate: jest.Mock };
  let productContextServiceMock: { _setAvailabilityId: jest.Mock; _getAvailabilityId: jest.Mock; isProductDisabled: jest.Mock };
  let productsServiceMock: { getCountry: jest.Mock; getState: jest.Mock };

  beforeEach(() => {
    // LocalStorage setup for constructor
    localStorage.setItem('productId', 'P1');
    localStorage.setItem('productVersionId', 'V1');

    availabilityServiceMock = {
      _showModalUpdated: new Subject<any>(),
      deleteAvailability: jest.fn(),
      deletestandard: jest.fn(),
      getAvailability: jest.fn(),
    } as any;

    layoutServiceMock = {
      updateBreadcrumbs: jest.fn(),
      caption$: new Subject<string>(),
      showMessage: jest.fn(),
    };

    sharedServiceMock = {
      nextButtonClicked: new Subject<any>(),
      previousButtonClicked: new Subject<any>(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    productContextServiceMock = {
      _setAvailabilityId: jest.fn(),
      _getAvailabilityId: jest.fn().mockReturnValue('AV1'),
      isProductDisabled: jest.fn().mockReturnValue(false),
    };

    productsServiceMock = {
      getCountry: jest.fn().mockReturnValue(of([{ id: '1', code: 'US', description: 'United States', rank: 1 }])),
      getState: jest.fn().mockReturnValue(of([{ id: 'CA', code: 'CA', description: 'California', rank: 1 }])),
    } as any;

    // Default getAvailability response
    const defaultAvailability: RootAvailability = {
      id: 'ROOT1',
      standards: [],
      ruleSets: [],
      requestId: 'REQ1',
    } as any;
    (availabilityServiceMock.getAvailability as jest.Mock).mockReturnValue(of(defaultAvailability));

    component = new AvailabilityComponent(
      availabilityServiceMock as any,
      layoutServiceMock as unknown as LayoutService,
      sharedServiceMock as unknown as SharedService,
      routerMock as unknown as Router,
      productContextServiceMock as unknown as ProductContextService,
      productsServiceMock as unknown as ProductsService
    );
  });

  it('should create and respond to modal updates', () => {
    expect(component).toBeTruthy();
    availabilityServiceMock._showModalUpdated.next(true);
    expect((component as any)._showModal).toBe(true);
    expect(component['open']).toBe(true);
    expect(layoutServiceMock.updateBreadcrumbs).toHaveBeenCalled();
  });

  it('ngOnInit should call getAvailabilities and reset availability id', () => {
    const spyGet = jest.spyOn(component, 'getAvailabilities').mockImplementation(jest.fn());
    component.ngOnInit();
    expect(spyGet).toHaveBeenCalled();
    expect(productContextServiceMock._setAvailabilityId).toHaveBeenCalledWith('');
  });

  it('saveAndExit should navigate to products', () => {
    component.saveAndExit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['products']);
  });

  it('next and previous should emit via SharedService', () => {
    const nextSpy = jest.fn();
    const prevSpy = jest.fn();
    sharedServiceMock.nextButtonClicked.subscribe(nextSpy);
    sharedServiceMock.previousButtonClicked.subscribe(prevSpy);
    component.next();
    component.previous();
    expect(nextSpy).toHaveBeenCalledWith({ stepCount: 1 });
    expect(prevSpy).toHaveBeenCalledWith({ stepCount: 1 });
  });

  it('onSelectedRow should navigate when conditions meet', () => {
    // Prepare country list and event
    component['countrylist'] = [{ id: '1', code: 'US', description: 'United States', rank: 1 }];
    (component as any).productId = 'P1';
    const event: any = { availabilityId: 'AV2', country: 'United States' };

    component.onSelectedRow(event);

    expect(productContextServiceMock._setAvailabilityId).toHaveBeenCalledWith('AV2');
    expect(component['disabledval']).toBe(false);
    expect(localStorage.getItem('availabilityId')).toBe('AV2');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products/P1/availability/edit']);
  });

  it('Delete should close modal, call service, and trigger deleteAvailability method', () => {
    const delSpy = jest.spyOn(component, 'deleteAvailability').mockImplementation(jest.fn());
    (component as any).open = true;
    component.Delete();
    expect(component['open']).toBe(false);
    expect(availabilityServiceMock.deleteAvailability).toHaveBeenCalledWith(true);
    expect(delSpy).toHaveBeenCalled();
  });

  it('deleteAvailability: success flow shows toast and refreshes list', () => {
    (availabilityServiceMock.deletestandard as jest.Mock).mockReturnValue(of({ succeeded: true }));
    const getSpy = jest.spyOn(component, 'getAvailabilities').mockImplementation(jest.fn());
    (component as any).productId = 'P1';
    (component as any).productVersionId = 'V1';

    component.deleteAvailability();
    expect(layoutServiceMock.showMessage).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it('deleteAvailability: error flow shows first API error', () => {
    (availabilityServiceMock.deletestandard as jest.Mock).mockReturnValue(
      throwError(() => ({ error: { errors: { CODE1: ['Boom!'] } } }))
    );
    component.deleteAvailability();
    expect(layoutServiceMock.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', message: 'Boom!' })
    );
  });

  it('getAvailabilities should fetch lists and bind data', () => {
    const bindSpy = jest.spyOn(component, 'bindData').mockImplementation(jest.fn());
    (availabilityServiceMock.getAvailability as jest.Mock).mockReturnValue(
      of({ id: 'ROOT', standards: [], ruleSets: [], requestId: 'R' } as any)
    );
    component.getAvailabilities();
    expect(productsServiceMock.getCountry).toHaveBeenCalled();
    expect(productsServiceMock.getState).toHaveBeenCalledWith('US');
    expect(bindSpy).toHaveBeenCalled();
  });

  it('bindData should transform and set availability list and availability id', () => {
    productContextServiceMock.isProductDisabled.mockReturnValue(true);
    component['countrylist'] = [{ id: '1', code: 'US', description: 'United States', rank: 1 }];
    component['stateList'] = [{ id: 'CA', code: 'CA', description: 'California', rank: 1 }];
    const response: RootAvailability = {
      id: 'R',
      requestId: 'R',
      ruleSets: [],
      standards: [
        {
          availabilityId: 'AV10',
          country: 'US',
          states: [
            {
              state: { key: 'CA', value: 'CA', category: 'STATE' },
              issuingCompany: '',
              isCurrentVersion: false,
              isRefundable: false,
              issuingCompanyCode: '',
            },
          ],
          locale: 'en_US',
          blacklistZipCodes: [],
        } as any,
      ],
    } as any;

    component.bindData(response);
    expect(component['canSaveExit']).toBe(true);
    expect(component['availabilityList']).toHaveLength(1);
    expect(productContextServiceMock._setAvailabilityId).toHaveBeenCalledWith('AV10');
    // check transformed fields
    expect((component['availabilityList'][0] as any).country).toBe('United States');
    expect((component['availabilityList'][0] as any).states).toEqual(['California']);
  });

  it('ngOnDestroy should remove query params and unsubscribe', () => {
    // Set context for _removeQueryParams
    (component as any).context = { commands: { get: { parameter: { headers: { queryparameters: { foo: 'bar' } } } } } };
    component.ngOnDestroy();
    expect((component as any).context.commands.get.parameter.headers.queryparameters).toBeUndefined();
  });
});
