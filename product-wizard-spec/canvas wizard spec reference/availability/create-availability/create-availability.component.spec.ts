import { CreateAvailabilityComponent } from './create-availability.component';
import { Router } from '@angular/router';

describe('CreateAvailabilityComponent', () => {
  const makeComponent = () => {
    const routerMock = { navigate: jest.fn() } as any;
    const layoutServiceMock = {
      updateBreadcrumbs: jest.fn(),
      caption$: { next: jest.fn() },
      showMessage: jest.fn(),
    } as any;
    const sharedServiceMock = {} as any;
    const formBuilderMock = {} as any;
    const cdrMock = { detectChanges: jest.fn() } as any;
    const cmp = new CreateAvailabilityComponent(
      routerMock as unknown as Router,
      layoutServiceMock,
      sharedServiceMock,
      formBuilderMock,
      cdrMock
    );
    return { cmp, routerMock, layoutServiceMock };
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should create component and set defaults when no localStorage keys', () => {
    const { cmp } = makeComponent();
    expect(cmp).toBeTruthy();
    expect(cmp.productId).toBe('');
    expect(cmp.productVersionId).toBe('');
    expect(cmp.country).toBe('');
    expect(cmp.toShowtoogle).toBe(false);
    expect(cmp.isDisabled).toBe(false);
    expect(Array.isArray(cmp.blacklistedzipcode)).toBe(true);
  });

  it('should read productId, productVersionId, and country from localStorage', () => {
    localStorage.setItem('productId', 'P123');
    localStorage.setItem('productVersionId', 'V9');
    localStorage.setItem('country', 'US');
    const { cmp } = makeComponent();
    expect(cmp.productId).toBe('P123');
    expect(cmp.productVersionId).toBe('V9');
    expect(cmp.country).toBe('US');
  });

  it('should expose mutable state properties with expected defaults', () => {
    const { cmp } = makeComponent();
    expect(cmp.selectedstateValues).toEqual([]);
    expect(cmp.selectedcountrycode).toBe('');
    expect(cmp.selectedcountrytext).toBe('');
    expect(cmp.selectedstates).toBe('');
    expect(cmp.toShow).toBe(false);
  });

  it('should be able to toggle flags manually (sanity check)', () => {
    const { cmp } = makeComponent();
    cmp.toShow = true;
    cmp.toShowtoogle = true;
    cmp.isDisabled = true;
    expect(cmp.toShow).toBe(true);
    expect(cmp.toShowtoogle).toBe(true);
    expect(cmp.isDisabled).toBe(true);
  });
});