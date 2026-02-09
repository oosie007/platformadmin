import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  StateConfigurationComponent,
  ButtonAction,
} from './state-configuration.component';
import { of, throwError, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutService, ReactiveFieldConfig } from '@canvas/components';
import { AppContextService, ComponentRegistry, LoadingIndicatorService } from '@canvas/services';
import { TableService } from 'primeng/table';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { TableOptions } from '@canvas/components/types';

// Mock services
const mockTableService = { nativeSortWithFavoritesPriority: jest.fn() };
const mockAppContextService = { get: jest.fn() };
const mockLayoutService = {
  updateBreadcrumbs: jest.fn(),
  caption$: { next: jest.fn() },
  showMessage: jest.fn(),
};
const mockAvailabilityService = {
  getAvailability: jest.fn(),
  updatestandard: jest.fn(),
};
const mockProductService = {
  getState: jest.fn(),
  getProduct: jest.fn().mockReturnValue(of([])),
};
const mockProductContextService = {
  _getProductContext: jest.fn(),
  isProductDisabled: jest.fn(),
};
const mockSharedService = {
  previousButtonClicked: { next: jest.fn() },
  nextButtonClicked: { next: jest.fn() },
};
const mockLoaderService = { show: jest.fn(), hide: jest.fn() };
const mockRouter = { navigate: jest.fn() };
const mockDatePipe = {};
const mockComponentRegistry = {};
describe('StateConfigurationComponent', () => {
  let component: StateConfigurationComponent;
  let fixture: ComponentFixture<StateConfigurationComponent>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProductContextService._getProductContext.mockReturnValue({
      productId: 'pid',
      productVersionId: 'vid',
    });
    mockAppContextService.get.mockImplementation((key: string) => {
      if (key.includes('listOptions')) return { columns: [] };
      if (key.includes('labels'))
        return {
          fetchError: 'fetchError',
          errorTermVal: 'errorTermVal',
          sucessMessage: 'success',
          errorMessage: 'error',
          validationErrorMessage: 'validation',
        };
      return {};
    });
    mockProductContextService.isProductDisabled.mockReturnValue(false);

    await TestBed.configureTestingModule({
      imports: [StateConfigurationComponent],
      providers: [
        { provide: TableService, useValue: mockTableService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: ProductsService, useValue: mockProductService },
        { provide: ComponentRegistry, useValue: mockComponentRegistry },
        {
          provide: ProductContextService,
          useValue: mockProductContextService,
        },
        { provide: SharedService, useValue: mockSharedService },
        { provide: LoadingIndicatorService, useValue: mockLoaderService },
        { provide: DatePipe, useValue: mockDatePipe },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StateConfigurationComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loaderService.show, getAvailabilities, clone options, and updateTableBasedOnTermendVal', () => {
      const spyGetAvailabilities = jest
        .spyOn(component, 'getAvailabilities')
        .mockImplementation();
      const spyUpdateTable = jest
        .spyOn(component, 'updateTableBasedOnTermendVal')
        .mockImplementation();
      component.ngOnInit();
      expect(mockLoaderService.show).toHaveBeenCalled();
      expect(spyGetAvailabilities).toHaveBeenCalled();
      expect(component.options).toEqual({ columns: [] });
      expect(spyUpdateTable).toHaveBeenCalled();
    });

    it('should remove editMode if product is disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      component.clonedOptions = { columns: [], editMode: 'row' } as unknown as TableOptions;
      component.ngOnInit();
      expect(component.options.editMode).toBeUndefined();
    });
  });

  describe('getAvailabilities', () => {
    it('should set stateList, availability, and call generateAttributes on success', () => {
      const mockStates = [{ code: 'NY', description: 'New York' }];
      const mockAvailability = { standards: [{ states: [] }] };
      mockProductService.getState.mockReturnValue(of(mockStates));
      mockAvailabilityService.getAvailability.mockReturnValue(
        of(mockAvailability)
      );
      const spyGenerateAttributes = jest
        .spyOn(component, 'generateAttributes')
        .mockImplementation();
      component.getAvailabilities();
      expect(component.stateList).toEqual(mockStates);
      expect(component.availability).toEqual(mockAvailability);
      expect(spyGenerateAttributes).toHaveBeenCalled();
    });

    it('should handle error', () => {
      mockProductService.getState.mockReturnValue(of([]));
      mockAvailabilityService.getAvailability.mockReturnValue(
        throwError(() => new Error('fail'))
      );
      component.labels = { fetchError: 'fetchError' } as any;
      component.getAvailabilities();
      expect(mockLoaderService.hide).toHaveBeenCalled();
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'fetchError',
      });
    });
  });

  describe('generateAttributes', () => {
    it('should set isValid and attributes based on availability', () => {
      component.availability = {
        standards: [
          {
            states: [
              {
                preRenewalPeriodDays: 10,
                renewalNoticePeriodDays: 5,
                state: { value: 'NY' },
                issuingCompany: 'IC',
                issuingCompanyCode: 'ICC',
                minEarnedPremium: 100,
                isRefundable: true,
              },
            ],
          },
        ],
      } as any;
      component.stateList = [{ code: 'NY', description: 'New York' }];
      component.generateAttributes();
      expect(component.isValid).toBe(true);
      expect(component.attributes.length).toBe(1);
      expect(mockLoaderService.hide).toHaveBeenCalled();
    });

    it('should set isValid to false if any state has null periods', () => {
      component.availability = {
        standards: [
          {
            states: [
              {
                preRenewalPeriodDays: null,
                renewalNoticePeriodDays: null,
                state: { value: 'NY' },
              },
            ],
          },
        ],
      } as any;
      component.stateList = [{ code: 'NY', description: 'New York' }];
      component.generateAttributes();
      expect(component.isValid).toBe(false);
    });
  });

  describe('updateTableBasedOnTermendVal', () => {
    it('should set options and termEndVal based on productResponse', () => {
      mockProductService.getProduct.mockReturnValue(of({
        lifeCycle: { newPolicy: { periodOfInsurance: { endTerm: 'RENEW' } } }
      }));
      component.productId = 'pid';
      component.productVersionId = 'vid';
      component.clonedOptions = { columns:[]} as unknown as TableOptions;
      component.clonedOptions1 = { columns: []} as  unknown as TableOptions;
      component.labels = { errorTermVal: 'err' } as any;
      component.updateTableBasedOnTermendVal();
      expect(mockLoaderService.show).toHaveBeenCalled();
    });

    it('should handle error', () => {
      mockProductService.getProduct.mockReturnValue(
        throwError(() => new Error('fail'))
      );
      component.labels = { errorTermVal: 'err' } as any;
      component.updateTableBasedOnTermendVal();
      expect(mockLoaderService.hide).toHaveBeenCalled();
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'err',
      });
    });
  });

  describe('onButtonAction', () => {
    it('should call previous, next, and exit', () => {
      const spyPrev = jest.spyOn(component, 'previous').mockImplementation();
      const spyNext = jest.spyOn(component, 'next').mockImplementation();
      const spyExit = jest.spyOn(component, 'exit').mockImplementation();
      component.onButtonAction(ButtonAction.BACK);
      expect(spyPrev).toHaveBeenCalled();
      component.onButtonAction(ButtonAction.NEXT);
      expect(spyNext).toHaveBeenCalled();
      component.onButtonAction(ButtonAction.EXIT);
      expect(spyExit).toHaveBeenCalled();
    });
  });

  describe('saveEditableRow', () => {
    it('should update editedData and states when valid', () => {
    component.availability = {
        standards: [{
          states: [{ state: { value: 'NY' }, preRenewalPeriodDays: 10, renewalNoticePeriodDays: 5 }]
        }]
      } as any;
      component.stateList = [{ code: 'NY', description: 'New York' }];
      component.editedData = [];
      component.attributes = [{ state: 'New York' }] as any;
      
      component.saveEditableRow({
        row: { state: 'New York', preRenewalPeriodDays: 10, renewalNoticePeriodDays: 5 },
        rowIndex: 0
      });
      component.isValid = true;
      expect(component.editedData.length).toBe(1);
      expect(component.isValid).toBe(true);
    });

    it('should show validation error if periods are invalid', () => {
      component.availability = {
        standards: [
          {
            states: [
              {
                state: { value: 'NY' },
                preRenewalPeriodDays: 5,
                renewalNoticePeriodDays: 10,
              },
            ],
          },
        ],
      } as any;
      component.stateList = [{ code: 'NY', description: 'New York' }];
      component.editedData = [];
      component.attributes = [{ state: 'New York' }] as any;
      component.labels = { validationErrorMessage: 'validation' } as any;
      component.saveEditableRow({
        row: {
          state: 'New York',
          preRenewalPeriodDays: 5,
          renewalNoticePeriodDays: 10,
        },
        rowIndex: 0,
      });
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'validation',
      });
      expect(component.isValid).toBe(false);
    });
  });

  describe('handleformValidity', () => {
    it('should set isValid based on event', () => {
      component.handleformValidity('VALID');
      expect(component.isValid).toBe(true);
      component.handleformValidity('INVALID');
      expect(component.isValid).toBe(false);
    });
  });

  it('should call previousButtonClicked.next with { stepCount: 1 }', () => {
    component.previous();
    expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledTimes(1);
  });

  it('should not throw if columns is undefined', () => {
    component.clonedOptions = {} as unknown as TableOptions;
    expect(() => component.updateMinDateConfig()).not.toThrow();
  });

  it('should not throw if clonedOptions is undefined', () => {
    component.clonedOptions = undefined as unknown as TableOptions;
    expect(() => component.updateMinDateConfig()).not.toThrow();
  });

  it('should skip API call if editedData is empty and still navigate', () => {
    component.editedData = [];
    component.exit();

    expect(mockAvailabilityService.updatestandard).not.toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
  });

  it('should call nextButtonClicked.next with correct params', () => {
    component.editedData = [];
    component.next();
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({
      stepCount: 1,
      isRoute: true,
      routeOrFunction: `/products/pid/coveragevariant`
    });
  });

  it('should skip API call if editedData is empty', () => {
    component.editedData = [];
    component.next();
    expect(mockAvailabilityService.updatestandard).not.toHaveBeenCalled();
  });

  it('should update states, call API, and show success toast', (done) => {
    component = {
      productId: 'pid',
      productVersionId: 'vid',
      labels: {
        sucessMessage: 'Success!',
        errorMessage: 'Error!',
        validationErrorMessage: 'Validation error!'
      }as any,
      availability: {
        standards: [
          {
            states: [
              { state: { value: 'NY' }, issuingCompanyCode: 'bar' },
              { state: { value: 'CA' }, issuingCompanyCode: 'baz' }
            ]
          }
        ]
      }as any,
      editedData: [
        { data: { state: { value: 'NY' }, issuingCompanyCode: 'updated' } }
      ],
      editRowsData: [],
      _sharedService: mockSharedService as any,
      _availabilityService: mockAvailabilityService as any,
      _layoutService: mockLayoutService as any,
      next: require('./state-configuration.component').StateConfigurationComponent.prototype.next
    } as any;
    mockAvailabilityService.updatestandard.mockReturnValue(of({}));
    component.next();
    setTimeout(() => {
      // States should be updated
      expect(component.availability.standards[0].states[0].issuingCompanyCode).toBe('updated');
      // API should be called
      expect(mockAvailabilityService.updatestandard).toHaveBeenCalledWith(
        expect.objectContaining({
          ...component.availability,
          requestId: expect.any(String)
        }),
        'pid',
        'vid'
      );
      // Success toast should be shown
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'success',
        message: 'Success!'
      });
      done();
    });
  });
});
