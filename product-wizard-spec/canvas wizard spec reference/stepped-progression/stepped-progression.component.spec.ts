import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import { of, Subject } from 'rxjs';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { SteppedProgressionComponent } from './stepped-progression.component';

describe('SteppedProgressionComponent', () => {
  let component: SteppedProgressionComponent;
  let fixture: ComponentFixture<SteppedProgressionComponent>;
  let mockRouter: Router;
  let mockAppContextService: AppContextService;
  let mockLayoutService: LayoutService;
  let mockSharedService: SharedService;
  let mockProductContextService: ProductContextService;
  let mockProductsService: ProductsService;
  let mockAvailabilityService: AvailabilityService;
  let mockActivatedRoute: ActivatedRoute;

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
    } as unknown as Router;

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn().mockReturnValue('123'), // Mock route parameters
        },
      },
    } as unknown as ActivatedRoute;

    mockAppContextService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'pages.product.stepper-configuration') {
          return {
            steps: [],
            labels: { stateError: 'State error message' },
          };
        }
        return null;
      }),
    } as unknown as AppContextService;

    mockLayoutService = {
      updateBanner: jest.fn(),
      showMessage: jest.fn(),
    } as unknown as LayoutService;

    mockSharedService = {
      getNextButtonClicked: jest.fn().mockReturnValue(of({ stepCount: 1 })),
      getPreviousButtonClicked: jest.fn().mockReturnValue(of({ stepCount: 1 })),
    } as unknown as SharedService;

    mockProductContextService = {
      selectedProductId$: new Subject<string>(),
      coverageVariantId$: new Subject<string>(),
      removeLocalStorage: jest.fn(),
    } as unknown as ProductContextService;

    mockProductsService = {
      getSelectedCountry: jest.fn().mockReturnValue('US'),
    } as unknown as ProductsService;

    mockAvailabilityService = {
      removeAvailability: jest.fn(),
    } as unknown as AvailabilityService;

    await TestBed.configureTestingModule({
      imports: [SteppedProgressionComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SteppedProgressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedProductId$', () => {
      const productId = '123';
      mockProductContextService.selectedProductId$.next(productId);
      component.ngOnInit();
      expect(component.selectedProductId).toBe(productId);
    });

    it('should subscribe to coverageVariantId$', () => {
      const coverageVariantId = '456';
      mockProductContextService.coverageVariantId$.next(coverageVariantId);
      component.ngOnInit();
      expect(component.coverageVariantId).toBe(coverageVariantId);
    });

    it('should subscribe to nextButtonClicked', () => {
      component.ngOnInit();
      expect(mockSharedService.getNextButtonClicked).toHaveBeenCalled();
    });

    it('should subscribe to previousButtonClicked', () => {
      component.ngOnInit();
      expect(mockSharedService.getPreviousButtonClicked).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions and call cleanup methods', () => {
      const nextButtonUnsubscribeSpy = jest.spyOn(
        component.nextButtonSubScription,
        'unsubscribe'
      );
      const previousButtonUnsubscribeSpy = jest.spyOn(
        component.previousButtonSubScription,
        'unsubscribe'
      );
      component.ngOnDestroy();
      expect(nextButtonUnsubscribeSpy).toHaveBeenCalled();
      expect(previousButtonUnsubscribeSpy).toHaveBeenCalled();
      expect(mockAvailabilityService.removeAvailability).toHaveBeenCalled();
      expect(mockProductContextService.removeLocalStorage).toHaveBeenCalled();
    });
  });

  describe('onClickEvent', () => {
    it('should navigate to coverage variant route when COVERAGE_VARIANTS is clicked', () => {
      component.selectedProductId = '123';
      const event = { target: { textContent: 'Coverage variants' } };
      component.onClickEvent(event);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/products/123/coveragevariant',
      ]);
    });

    it('should navigate to coverage variant details route when COVERAGE_VARIANT_DETAILS is clicked', () => {
      component.selectedProductId = '123';
      component.coverageVariantId = '456';
      const event = { target: { textContent: 'Coverage variant details' } };
      component.onClickEvent(event);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/products/123/coveragevariant/edit',
        '456',
      ]);
    });
  });

  describe('onSelectedStepChange', () => {
    it('should update currentStep and call navigateToRoute', () => {
      const navigateToRouteSpy = jest.spyOn(component, 'navigateToRoute');
      component.onSelectedStepChange(2);
      expect(component.currentStep).toBe(2);
      expect(navigateToRouteSpy).toHaveBeenCalled();
    });
  });

  describe('onSelectedSubStepChange', () => {
    it('should update currentSubStep and call navigateToRoute', () => {
      const navigateToRouteSpy = jest.spyOn(component, 'navigateToRoute');
      component.onSelectedSubStepChange(1);
      expect(component.currentSubStep).toBe(1);
      expect(navigateToRouteSpy).toHaveBeenCalled();
    });
  });

  describe('navigateToRoute', () => {
    it('should navigate to the correct route based on currentStep and currentSubStep', () => {
      component.steps = [
        { label: 'Step 1', routeOrFunction: '/step1' }, // Added 'label'
        {
          label: 'Step 2',
          routeOrFunction: '/step2',
          subSteps: [{ label: 'Sub Step 1', routeOrFunction: '/step2/sub1' }], // Added 'label' to subSteps
        },
      ];
      component.currentStep = 1;
      component.currentSubStep = 0;
      component.navigateToRoute();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/step2/sub1'], {
        relativeTo: expect.anything(),
      });
    });
  });
});
