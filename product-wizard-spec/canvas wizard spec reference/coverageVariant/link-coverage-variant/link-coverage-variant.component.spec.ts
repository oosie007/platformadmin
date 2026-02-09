import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { LinkCoverageVariantComponent } from './link-coverage-variant.component';
import { AppContextService,CompositeLoggerService } from '@canvas/services';
import { ProductContextService } from '../../../services/product-context.service';
import { LayoutService } from '@canvas/components';
import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';


describe('LinkCoverageVariantComponent', () => {
  let component: LinkCoverageVariantComponent;
  let fixture: ComponentFixture<LinkCoverageVariantComponent>;

  // Mocks
  const appContextServiceMock = {
    get: jest.fn().mockReturnValue({
      commands: {},
    }),
  };

  const layoutServiceMock = {
    updateBanner: jest.fn(),
    updateBreadcrumbs: jest.fn(),
    caption$: new BehaviorSubject<string>(''),
  };

  const productContextServiceMock = {
    _getCoverageVariantId: jest.fn().mockReturnValue('mockCoverageVariantId'),
    _setCoverageVariantData: jest.fn(),
  };
  const compositeLoggerServiceMock = {
    log: jest.fn(),
  };
  const activatedRouteMock = {
    queryParams: of({ country: 'mockCountry', productClass: 'mock-product-class' }),
  };

  const routerMock = {
    navigate: jest.fn(),
  };

  const changeDetectorRefMock: ChangeDetectorRef = {
    detectChanges: jest.fn(),  // Ensure detectChanges is a jest.fn() mock
  } as any;

  beforeEach(() => {
    window.crypto.randomUUID = jest.fn();
    TestBed.configureTestingModule({
      imports: [
        LinkCoverageVariantComponent  // Import the standalone component here
      ],
      providers: [
        { provide: AppContextService, useValue: appContextServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ProductContextService, useValue: productContextServiceMock },
        { provide: CompositeLoggerService, useValue: compositeLoggerServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: ChangeDetectorRef, useValue: changeDetectorRefMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkCoverageVariantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call _setCoverageVariantData with empty coverageVariantData in cancel()', () => {
    const expectedCoverageVariantData = {
      country: '',
      coverageVariantId: '',
      coverageVariantName: '',
      standardCoverage: [],
      productClass: '',
      updatedOn: ''
    };

    component.cancel();

    expect(productContextServiceMock._setCoverageVariantData).toHaveBeenCalledWith(expectedCoverageVariantData);
  });
  it('should navigate to edit route if coverageVariantId is valid', () => {
    component.coverageVariantId = 'mockCoverageVariantId';

    component.linkVariant();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      `/products/${component.productId}/coveragevariant/edit/${component.coverageVariantId}`
    ]);
  });

  it('should navigate to create route if coverageVariantId is null or empty', () => {
    component.coverageVariantId = '';

    component.linkVariant();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      `/products/${component.productId}/coveragevariant/createcoveragevariant`
    ]);
  });
  it('should call linkVariant when saveTableData is invoked', () => {
    const linkVariantSpy = jest.spyOn(component, 'linkVariant');

    component.saveTableData();

    expect(linkVariantSpy).toHaveBeenCalled();
  });
  it('should update currentcoverageVariantData and call _setCoverageVariantData when coverageVariantId differs', () => {
    const initialData = { coverageVariantId: '123' };
    component.currentcoverageVariantData = { coverageVariantId: '456' } as any;

    component.onSelected(initialData);

    expect(component.currentcoverageVariantData).toEqual(initialData);
    expect(productContextServiceMock._setCoverageVariantData).toHaveBeenCalledWith(initialData);
  });

  it('should reset currentcoverageVariantData and call _setCoverageVariantData when coverageVariantId is the same', () => {
    const initialData = { coverageVariantId: '123' };
    component.currentcoverageVariantData = { coverageVariantId: '123' } as any;

    component.onSelected(initialData);

    const expectedResetData = {
      country: '',
      coverageVariantId: '',
      coverageVariantName: '',
      standardCoverage: [],
      productClass: '',
      updatedOn: '',
    };

    expect(component.currentcoverageVariantData).toEqual(expectedResetData);
    expect(productContextServiceMock._setCoverageVariantData).toHaveBeenCalledWith(expectedResetData);
  });
});