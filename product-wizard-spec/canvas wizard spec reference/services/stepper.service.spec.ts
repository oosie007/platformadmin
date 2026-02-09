import { StepperService } from './stepper.service';
import { TestBed } from '@angular/core/testing';


jest.useFakeTimers();

describe('StepperService', () => {
  let service: StepperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StepperService],
    });
    service = TestBed.inject(StepperService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('getStepperNodes should return the expected stepper details', () => {
    const productContext = [
      {
        id: 'update',
        index:0,
        labelId:'Product details',
        current: 'product_details',
        next: 'availability',
        previous: 'product_details',
        default: 'product_details',
      },
      {
        id: 'availability',
        index:1,
        labelId:'Availability',
        current: 'availability',
        next: 'policy_configuration',
        previous: 'availability',
        default: 'availability',
      },      
      {
        id: 'policy-configuration',
        index:2,
        labelId:'Policy configuration',
        current: 'policy-configuration',
        next: 'coverage-variant',
        previous: 'availability',
        default: 'policy-configuration',
      },
      {
        id: 'coverage-variant',
        index:3,
        labelId:'Coverage variants',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',        
      }, 
      {
        id: 'coverage-variant',
        index:0,
        labelId:'Coverage variant details',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'coverage-variant',
        index:0,
        labelId:'Coverage variant',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'insured-type',
        index:1,
        labelId:'Insured type',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'sub-coverage',
        index:2,
        labelId:'Subcoverages',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'coverage-variant-level-overview',
        index:3,
        labelId:'Coverage variant levels',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'exclusion',
        index:4,
        labelId:'Exclusions',
        current: 'coverage-variant',
        next: 'create-coverage-variant',
        previous: 'policy-configuration',
        default: 'coverage-variant',
      },
      {
        id: 'rating-factor',
        index:4,
        labelId:'Select rating factors',
        current: 'rating-factor',
        next: 'availability',
        previous: 'availability',
        default: 'availability',
      },
      {
        id: 'rating-factor',
        index:4,
        labelId:'Ratings',
        current: 'rating-factor',
        next: 'availability',
        previous: 'availability',
        default: 'availability',
      },
      {
        id: 'question-mapping',
        index:4,
        labelId:'External mapping',
        current: 'rating-factor',
        next: 'availability',
        previous: 'availability',
        default: 'availability',
      },

      {
        id: 'documents',
        index:5,
        labelId:'Documents',
        current: 'documents',
        next: 'availability',
        previous: 'availability',
        default: 'availability',
      } 
  ];
    const result = service.getStepperNodes();
    expect(result).toEqual(productContext);
  });
});
