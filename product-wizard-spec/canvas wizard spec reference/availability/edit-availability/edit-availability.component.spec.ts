/* eslint-disable @typescript-eslint/no-explicit-any */
import { of, Subject, throwError } from 'rxjs';
import { EditAvailabilityComponent } from './edit-availability.component';
import { AvailabilityService } from '../../../services/availability.service';
import { LayoutService } from '@canvas/components';
import { SharedService } from '../../../services/shared.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { ProductContextService } from '../../../services/product-context.service';
import { Statuskeys } from '../../../types/product';
import { Category } from '../../../types/ref-data';

describe('EditAvailabilityComponent', () => {
  const makeComponent = (status: Statuskeys = Statuskeys.DESIGN) => {
    // LocalStorage
    localStorage.setItem('productId', 'P1');
    localStorage.setItem('productVersionId', 'V1');
    localStorage.setItem('availabilityId', 'AV1');

    const availabilityServiceMock = {
      getCountry: jest.fn().mockReturnValue(of([{ id: '1', code: 'US', description: 'United States', rank: 1 }])),
      getState: jest.fn().mockReturnValue(of([{ code: 'CA', description: 'California' }])),
      getavailabilitybyId: jest.fn().mockReturnValue(
        of({
          availabilityId: 'AV1',
          country: 'US',
          states: [
            {
              state: { value: 'CA', category: Category.STATE },
              isCurrentVersion: true,
            },
          ],
          locale: 'en_US',
          blacklistZipCodes: ['90001'],
        })
      ),
      updatestandard: jest.fn().mockReturnValue(of({ succeeded: true })),
    } as any as jest.Mocked<AvailabilityService>;

    const layoutServiceMock = {
      updateBreadcrumbs: jest.fn(),
      caption$: new Subject<string>(),
      showMessage: jest.fn(),
    } as any as LayoutService;

    const sharedServiceMock = {} as any as SharedService;
    const routerMock = { navigate: jest.fn() } as any as Router;
    const fb = new FormBuilder();
    const cdr = { detectChanges: jest.fn() } as any as ChangeDetectorRef;
    const productContextServiceMock = {
      _getAvailabilityId: jest.fn().mockReturnValue('AV1'),
      _getProductContext: jest.fn().mockReturnValue({ status }),
    } as any as ProductContextService;

    const cmp = new EditAvailabilityComponent(
      availabilityServiceMock,
      routerMock,
      layoutServiceMock,
      sharedServiceMock,
      fb,
      cdr,
      productContextServiceMock
    );

    // minimal defaults needed by methods
    (cmp as any).countrylist = [{ code: 'US', description: 'United States' }];
    return { cmp, availabilityServiceMock, layoutServiceMock, routerMock, productContextServiceMock };
  };

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  it('should construct and set product IDs from localStorage', () => {
    const { cmp } = makeComponent();
    expect(cmp.productId).toBe('P1');
    expect(cmp.productVersionId).toBe('V1');
    expect(cmp.availabilityId).toBe('AV1');
  });

  it('ngOnInit enables form and calls fetch; disables when FINAL', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    expect(cmp.availabilityForm).toBeTruthy();
    expect(cmp.isSelect).toBe(false);

    const { cmp: cmpFinal } = makeComponent(Statuskeys.FINAL);
    const disableSpy = jest.spyOn(FormBuilder.prototype, 'group');
    cmpFinal.ngOnInit();
    expect(cmpFinal.isSelect).toBe(true);
  });

  it('onCountryChange toggles flags based on countrycontrol value', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    cmp.availabilityForm.patchValue({ countrycontrol: 'US' });
    cmp.onCountryChange();
    expect(cmp['toShowtoogle']).toBe(true);
    cmp.availabilityForm.patchValue({ countrycontrol: 'IE' });
    cmp.onCountryChange();
    expect(cmp['toShowtoogle']).toBe(false);
    expect(cmp['toShow']).toBe(false);
  });

  it('onavailabiltyChange toggles based on states and country', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    cmp.availabilityForm.patchValue({ countrycontrol: 'US', availabilitybyStates: true });
    cmp.onavailabiltyChange();
    expect(cmp['toShow']).toBe(true);
    cmp.availabilityForm.patchValue({ countrycontrol: 'IE', availabilitybyStates: true });
    cmp.onavailabiltyChange();
    expect(cmp['toShow']).toBe(false);
  });

  it('createAvailability builds standards with states for US and with none for non-US', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    // US flow with states
    cmp.availabilityForm.patchValue({ countrycontrol: 'US', availabilitybyStates: true, selectStates: [{ code: 'CA', description: 'California', disabled: false }], zipcodes: '90001,90002' });
    cmp.createAvailability();
    expect(cmp.availabilityRequest.standards.length).toBe(1);
    expect(cmp.availabilityRequest.standards[0].states.length).toBe(1);

    // Non-US flow
    cmp.availabilityRequest.standards = [];
    cmp.availabilityForm.patchValue({ countrycontrol: 'IE', availabilitybyStates: false });
    cmp.createAvailability();
    expect(cmp.availabilityRequest.standards[0].states).toEqual([]);
  });

  it('bindformData wraps requestId and rules', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    cmp.availabilityRequest.standards = [{ country: 'US', states: [], locale: 'en', blacklistZipCodes: [], availabilityId: 'AV1' } as any];
    cmp.bindformData();
    expect(cmp.availabilityRequest.requestId).toBe('1');
    expect(cmp.availabilityRequest.ruleSets).toEqual([]);
  });

  it('updateAvailability prevents duplicates and shows error toast', () => {
    const { cmp, layoutServiceMock } = makeComponent();
    cmp.selectedStateValues = ['CA', 'CA'];
    cmp.updateAvailability();
    expect(layoutServiceMock.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });

  it('updateAvailability success shows success toast and navigates per flag', () => {
    const { cmp, layoutServiceMock, routerMock } = makeComponent();
    cmp.ngOnInit();
    cmp.selectedStateValues = ['CA'];
    cmp.availabilityForm.patchValue({ countrycontrol: 'US', availabilitybyStates: true, selectStates: [{ code: 'CA', description: 'California', disabled: false }], zipcodes: '90001' });
    cmp.updateAvailability(true);
    expect(layoutServiceMock.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    );
    expect(routerMock.navigate).toHaveBeenCalled();
  });

  it('updateAvailability error shows error toast', () => {
    const { cmp, availabilityServiceMock, layoutServiceMock } = makeComponent();
    (availabilityServiceMock.updatestandard as any).mockReturnValue(
      throwError(() => ({}))
    );
    cmp.ngOnInit();
    cmp.selectedStateValues = ['CA'];
    cmp.availabilityForm.patchValue({ countrycontrol: 'US', availabilitybyStates: true, selectStates: [{ code: 'CA', description: 'California', disabled: false }], zipcodes: '90001' });
    cmp.updateAvailability();
    expect(layoutServiceMock.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });

  it('previous and next navigate to the availability route', () => {
    const { cmp, routerMock } = makeComponent();
    cmp.previous();
    cmp.next();
    expect(routerMock.navigate).toHaveBeenCalledTimes(2);
  });

  it('onMultiSelectChange patches chip control', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    cmp.availabilityForm.patchValue({ statesChipControl: [] });
    cmp.onMultiSelectChange({ itemValue: { code: 'CA' }, value: [{ code: 'CA' }] } as any);
    expect(cmp.availabilityForm.get('statesChipControl')?.value).toEqual([{ code: 'CA' }]);
  });

  it('onMultiSelectSelectAllChange selects/deselects states', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    (cmp as any).stateList = [
      { code: 'CA', description: 'California', disabled: false },
      { code: 'TX', description: 'Texas', disabled: true },
    ] as any;
    cmp.onMultiSelectSelectAllChange({ checked: true } as any);
    expect(cmp['selectAllStates']).toBe(true);
    expect(Array.isArray(cmp['selectedState'])).toBe(true);
    cmp.onMultiSelectSelectAllChange({ checked: false } as any);
    expect(cmp['selectAllStates']).toBe(false);
  });

  it('onChipRemove restores value and shows error if chip disabled; otherwise filters selection', () => {
    const { cmp } = makeComponent();
    cmp.ngOnInit();
    cmp.availabilityForm.patchValue({ selectStates: [{ code: 'CA', disabled: false }, { code: 'TX', disabled: true }], statesChipControl: [{ code: 'CA', disabled: false }, { code: 'TX', disabled: true }] });
    const spyDeleteError = jest.spyOn<any, any>(cmp as any, 'deleteError');

    // Disabled removal should revert and call deleteError
    cmp['onChipRemove']({ value: { code: 'TX', disabled: true } } as any);
    expect(spyDeleteError).toHaveBeenCalled();

    // Enabled removal should filter
    cmp['onChipRemove']({ value: { code: 'CA', disabled: false } } as any);
    const vals = cmp.availabilityForm.get('selectStates')?.value;
    expect(vals.find((v: any) => v.code === 'CA')).toBeUndefined();
  });
});
