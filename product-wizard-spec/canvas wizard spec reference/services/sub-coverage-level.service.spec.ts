import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SubCoverageLevelService } from './sub-coverage-level.service';
import { Category } from '../types/ref-data';
import { SubCoverage } from '../types/sub-coverage';

describe('SubCoverageLevelService', () => {
  let service: SubCoverageLevelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubCoverageLevelService, FormBuilder],
    });
    service = TestBed.inject(SubCoverageLevelService);
  });

  describe('createLimitsForm', () => {
    let service: SubCoverageLevelService;
  
    beforeEach(() => {
      service = new SubCoverageLevelService(new FormBuilder());
    });
  
    it('should create a form group with only the requested controls', () => {
      const fields = ['maxLimitType', 'amountValue', 'percentOf'];
      const form = service.createLimitsForm(fields);
      expect(form.contains('maxLimitType')).toBe(true);
      expect(form.contains('amountValue')).toBe(true);
      expect(form.contains('percentOf')).toBe(true);
      expect(form.contains('aggregateLimitType')).toBe(false);
      expect(form.contains('aggregateamountValue')).toBe(false);
      expect(form.contains('aggregratePercentOf')).toBe(false);
      expect(form.contains('aggregateMaxPercentOf')).toBe(false);
    });
  
    it('should create a form group with all controls when all fields are provided', () => {
      const fields = [
        'maxLimitType',
        'amountValue',
        'percentOf',
        'aggregateLimitType',
        'aggregateamountValue',
        'aggregratePercentOf',
        'aggregateMaxPercentOf'
      ];
      const form = service.createLimitsForm(fields);
      expect(form.contains('maxLimitType')).toBe(true);
      expect(form.contains('amountValue')).toBe(true);
      expect(form.contains('percentOf')).toBe(true);
      expect(form.contains('aggregateLimitType')).toBe(true);
      expect(form.contains('aggregateamountValue')).toBe(true);
      expect(form.contains('aggregratePercentOf')).toBe(true);
      expect(form.contains('aggregateMaxPercentOf')).toBe(true);
    });
  
    it('should create a form group with no controls if fields is empty', () => {
      const fields: string[] = [];
      const form = service.createLimitsForm(fields);
      expect(Object.keys(form.controls).length).toBe(0);
    });
  
    it('should apply Validators.required to maxLimitType and amountValue', () => {
      const fields = ['maxLimitType', 'amountValue'];
      const form = service.createLimitsForm(fields);
      form.get('maxLimitType')!.setValue('');
      form.get('amountValue')!.setValue('');
      expect(form.get('maxLimitType')!.hasError('required')).toBe(true);
      expect(form.get('amountValue')!.hasError('required')).toBe(true);
    });
  
    it('should apply Validators.maxLength(50) to amountValue, percentOf, aggregratePercentOf', () => {
      const fields = ['amountValue', 'percentOf', 'aggregratePercentOf'];
      const form = service.createLimitsForm(fields);
      form.get('amountValue')!.setValue('a'.repeat(51));
      form.get('percentOf')!.setValue('b'.repeat(51));
      form.get('aggregratePercentOf')!.setValue('c'.repeat(51));
      expect(form.get('amountValue')!.hasError('maxlength')).toBe(true);
      expect(form.get('percentOf')!.hasError('maxlength')).toBe(true);
      expect(form.get('aggregratePercentOf')!.hasError('maxlength')).toBe(true);
    });
  
    it('should not apply Validators.required to percentOf, aggregateLimitType, aggregateamountValue, aggregratePercentOf, aggregateMaxPercentOf', () => {
      const fields = [
        'percentOf',
        'aggregateLimitType',
        'aggregateamountValue',
        'aggregratePercentOf',
        'aggregateMaxPercentOf'
      ];
      const form = service.createLimitsForm(fields);
      form.get('percentOf')!.setValue('');
      form.get('aggregateLimitType')!.setValue('');
      form.get('aggregateamountValue')!.setValue('');
      form.get('aggregratePercentOf')!.setValue('');
      form.get('aggregateMaxPercentOf')!.setValue('');
      expect(form.get('percentOf')!.hasError('required')).toBe(false);
      expect(form.get('aggregateLimitType')!.hasError('required')).toBe(false);
      expect(form.get('aggregateamountValue')!.hasError('required')).toBe(false);
      expect(form.get('aggregratePercentOf')!.hasError('required')).toBe(false);
      expect(form.get('aggregateMaxPercentOf')!.hasError('required')).toBe(false);
    });
  });

  describe('limitsForm', () => {
    it('should create a form group with all limit controls', () => {
      const form = service.limitsForm();
      expect(form.contains('maxLimitType')).toBe(true);
      expect(form.contains('amountValue')).toBe(true);
      expect(form.contains('percentOf')).toBe(true);
      expect(form.contains('aggregateLimitType')).toBe(true);
      expect(form.contains('aggregateamountValue')).toBe(true);
      expect(form.contains('aggregratePercentOf')).toBe(true);
      expect(form.contains('aggregateMaxPercentOf')).toBe(true);
    });
  });

  describe('initDeductibles', () => {
    it('should create a deductibles form group', () => {
      const form = service.initDeductibles();
      expect(form.contains('deductibleType')).toBe(true);
      expect(form.contains('valueType')).toBe(true);
      expect(form.contains('amountValue')).toBe(true);
      expect(form.contains('percentOf')).toBe(true);
    });
  });

  describe('initAdditionalFields', () => {
    it('should create an additional fields form group', () => {
      const form = service.initAdditionalFields();
      expect(form.contains('minLimitType')).toBe(true);
      expect(form.contains('amountValue')).toBe(true);
      expect(form.contains('percentOf')).toBe(true);
      expect(form.contains('durationType')).toBe(true);
      expect(form.contains('durationValue')).toBe(true);
      expect(form.contains('limitScope')).toBe(true);
      expect(form.contains('scopeValue')).toBe(true);
      expect(form.contains('waitingPeriod')).toBe(true);
      expect(form.contains('waitingPeriodValue')).toBe(true);
    });
  });

  describe('initSubCoverage', () => {
    it('should create a sub coverage form group with nested forms', () => {
      const form = service.initSubCoverage();
      expect(form.contains('limitsForm')).toBe(true);
      expect(form.contains('selectSubCoverage')).toBe(true);
      expect(form.contains('additionalFieldsForm')).toBe(true);
      expect(form.contains('deductiblesForm')).toBe(true);
    });
  });

  describe('setControlValidations', () => {
    it('should set required error if value is empty', () => {
      const control = service['_fb'].control('');
      service.setControlValidations(control);
      expect(control.errors).toEqual({ required: true });
    });

    it('should set pattern error if value is not a positive number', () => {
      const control = service['_fb'].control('abc');
      service.setControlValidations(control);
      expect(control.errors).toEqual({ pattern: true });
    });

    it('should not set error if value is a positive number', () => {
      const control = service['_fb'].control('10');
      service.setControlValidations(control);
      expect(control.errors).toBeNull();
    });
  });

  describe('setMaxlimiValidations', () => {
    it('should set maxlimit error', () => {
      const control = service['_fb'].control('10');
      service.setMaxlimiValidations(control);
      expect(control.errors).toEqual({ maxlimit: true });
    });
  });

  describe('setMaxaggregatelimiValidations', () => {
    it('should set maxaggregatelimit error', () => {
      const control = service['_fb'].control('10');
      service.setMaxaggregatelimiValidations(control);
      expect(control.errors).toEqual({ maxaggregatelimit: true });
    });
  });

  describe('setPercentageValidations', () => {
    it('should set percentagerequired error', () => {
      const control = service['_fb'].control('10');
      service.setPercentageValidations(control);
      expect(control.errors).toEqual({ percentagerequired: true });
    });
  });

  describe('setMaxLength', () => {
    it('should set maxLength error', () => {
      const control = service['_fb'].control('10');
      service.setMaxLength(control);
      expect(control.errors).toEqual({ maxLength: true });
    });
  });

  describe('getInsuredType', () => {
    it('should return INSURED category if code matches MAIN_INS', () => {
      const list = [{ code: 'MAIN_INS' }];
      const result = service.getInsuredType(list, 'MAIN_INS');
      expect(result).toEqual({
        value: 'MAIN_INS',
        category: Category.INSURED,
      });
    });

    it('should return INSURED category if type matches SPOUSE', () => {
      const list = [{ code: 'SPOUSE' }];
      const result = service.getInsuredType(list, 'SPOUSE');
      expect(result).toEqual({
        value: 'SPOUSE',
        category: Category.INSURED,
      });
    });

    it('should return DEPENDENTTYPE category if neither code nor type matches', () => {
      const list = [{ code: 'CHILD' }];
      const result = service.getInsuredType(list, 'CHILD');
      expect(result).toEqual({
        value: 'CHILD',
        category: Category.DEPENDENTTYPE,
      });
    });

    it('should return undefined if no match is found', () => {
      const list = [{ code: 'CHILD' }];
      const result = service.getInsuredType(list, 'SPOUSE');
      expect(result).toBeUndefined();
    });
  });

  describe('updateSubCoverageListStatus', () => {
    it('should set selected=true for matching subCoverId', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
        {
          subCoverId: 'B',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
        {
          subCoverId: 'C',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      const subCoverageControlsList = [
        { controls: { selectSubCoverage: { value: 'A' } } },
        { controls: { selectSubCoverage: { value: 'C' } } },
      ];
      const result = service.updateSubCoverageListStatus(
        subCoverageList,
        subCoverageControlsList
      );
      expect(result.find((x) => x.subCoverId === 'A')!.selected).toBe(true);
      expect(result.find((x) => x.subCoverId === 'B')!.selected).toBe(false);
      expect(result.find((x) => x.subCoverId === 'C')!.selected).toBe(true);
    });

    it('should set selected=false for all if no controls match', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
        {
          subCoverId: 'B',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      const subCoverageControlsList = [
        { controls: { selectSubCoverage: { value: 'X' } } },
      ];
      const result = service.updateSubCoverageListStatus(
        subCoverageList,
        subCoverageControlsList
      );
      expect(result.every((x) => x.selected === false)).toBe(true);
    });

    it('should handle duplicate selected values gracefully', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
        {
          subCoverId: 'B',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      const subCoverageControlsList = [
        { controls: { selectSubCoverage: { value: 'A' } } },
        { controls: { selectSubCoverage: { value: 'A' } } },
      ];
      const result = service.updateSubCoverageListStatus(
        subCoverageList,
        subCoverageControlsList
      );
      expect(result.find((x) => x.subCoverId === 'A')!.selected).toBe(true);
      expect(result.find((x) => x.subCoverId === 'B')!.selected).toBe(false);
    });

    it('should return original list if controls list is empty', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      const result = service.updateSubCoverageListStatus(subCoverageList, []);
      expect(result[0].selected).toBeUndefined();
    });

    it('should not select if selectSubCoverage value is empty string', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      const subCoverageControlsList = [
        { controls: { selectSubCoverage: { value: '' } } },
      ];
      const result = service.updateSubCoverageListStatus(
        subCoverageList,
        subCoverageControlsList
      );
      expect(result[0].selected).toBe(false);
    });

    it('should not fail if subCoverageControlsList is null or undefined', () => {
      const subCoverageList: SubCoverage[] = [
        {
          subCoverId: 'A',
          name: '',
          description: '',
          isCurrentVersion: false,
        },
      ];
      expect(
        service.updateSubCoverageListStatus(subCoverageList, null)
      ).toEqual(subCoverageList);
      expect(
        service.updateSubCoverageListStatus(subCoverageList, undefined)
      ).toEqual(subCoverageList);
    });
  });

  describe('filterCoverLevelId', () => {
    it('should filter subCoverageLevels by coverLevelId', () => {
      const data = {
        subCoverages: [
          {
            subCoverageLevels: [
              { coverLevelId: 'A', name: 'LevelA1' },
              { coverLevelId: 'B', name: 'LevelB1' },
              { coverLevelId: 'A', name: 'LevelA2' },
            ],
          },
        ],
      };
      const result = service.filterCoverLevelId(data, 'A');
      expect(result.subCoverages[0].subCoverageLevels.length).toBe(2);
      expect(result.subCoverages[0].subCoverageLevels[0].coverLevelId).toBe(
        'A'
      );
      expect(result.subCoverages[0].subCoverageLevels[1].coverLevelId).toBe(
        'A'
      );
    });

    it('should set subCoverageLevels to empty array if no match', () => {
      const data = {
        subCoverages: [
          {
            subCoverageLevels: [{ coverLevelId: 'B', name: 'LevelB1' }],
          },
        ],
      };
      const result = service.filterCoverLevelId(data, 'A');
      expect(result.subCoverages[0].subCoverageLevels.length).toBe(0);
    });

    it('should return undefined if subCoverages is missing', () => {
      const data = {};
      const result = service.filterCoverLevelId(data, 'A');
      expect(result).toBeUndefined();
    });

    it('should return undefined if subCoverages is empty', () => {
      const data = { subCoverages: [] };
      const result = service.filterCoverLevelId(data, 'A');
      expect(result).toBeUndefined();
    });
  });
  describe('removeRecord', () => {
    it('should remove subCoverageLevel with matching subCoverLevelId', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverageLevels: [
              { subCoverLevelId: 'A', name: 'LevelA1' },
              { subCoverLevelId: 'B', name: 'LevelB1' },
              { subCoverLevelId: 'A', name: 'LevelA2' },
            ],
          },
        ],
      };
      const result = service.removeRecord(rootData, 'A');
      expect(result.subCoverages[0].subCoverageLevels.length).toBe(1);
      expect(result.subCoverages[0].subCoverageLevels[0].subCoverLevelId).toBe(
        'B'
      );
    });

    it('should not remove any records if no match is found', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverageLevels: [{ subCoverLevelId: 'B', name: 'LevelB1' }],
          },
        ],
      };
      const result = service.removeRecord(rootData, 'A');
      expect(result.subCoverages[0].subCoverageLevels.length).toBe(1);
      expect(result.subCoverages[0].subCoverageLevels[0].subCoverLevelId).toBe(
        'B'
      );
    });

    it('should return undefined if subCoverages is missing', () => {
      const rootData = {};
      const result = service.removeRecord(rootData, 'A');
      expect(result).toBeUndefined();
    });

    it('should return undefined if subCoverages is empty', () => {
      const rootData = { subCoverages: [] };
      const result = service.removeRecord(rootData, 'A');
      expect(result).toBeUndefined();
    });
  });
  describe('validateForm', () => {
    let service: SubCoverageLevelService;
    let fb: FormBuilder;

    beforeEach(() => {
      fb = new FormBuilder();
      service = new SubCoverageLevelService(fb);
      jest.spyOn(service, 'validations'); // Spy on validations method
    });

    it('should call validations on the main form and each subCoverage', () => {
      // Mock subCoverage array with two FormGroups
      const subCoverageArray = [
        fb.group({ field1: [''] }),
        fb.group({ field2: [''] }),
      ];
      // Mock form structure
      const form = {
        controls: {
          subCoveragesForm: {
            controls: {
              subCoverage: {
                length: subCoverageArray.length,
                at: (i: number) => subCoverageArray[i],
              },
            },
          },
        },
      };

      service.validateForm(form);

      // Should call validations on main form and each subCoverage
      expect(service.validations).toHaveBeenCalledTimes(3);
      expect(service.validations).toHaveBeenCalledWith(form);
      expect(service.validations).toHaveBeenCalledWith(subCoverageArray[0]);
      expect(service.validations).toHaveBeenCalledWith(subCoverageArray[1]);
    });

    it('should not throw if subCoverage is empty', () => {
      const form = {
        controls: {
          subCoveragesForm: {
            controls: {
              subCoverage: {
                length: 0,
                at: (i: number) => undefined,
              },
            },
          },
        },
      };
      expect(() => service.validateForm(form)).not.toThrow();
      expect(service.validations).toHaveBeenCalledWith(form);
    });
  });
  describe('updateSubCoverageList', () => {
    let service: SubCoverageLevelService;

    beforeEach(() => {
      service = new SubCoverageLevelService(new FormBuilder());
    });

    it('should update an existing subCoverageLevel if all keys match', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverId: 'SC1',
            subCoverageLevels: [
              {
                coverLevelId: 'CL1',
                subCoverLevelId: 'SCL1',
                insuredType: { value: 'PERSON' },
                description: 'SC1',
                someField: 'old',
              },
            ],
          },
        ],
      };
      const formData = [
        {
          description: 'SC1',
          coverLevelId: 'CL1',
          subCoverLevelId: 'SCL1',
          insuredType: { value: 'PERSON' },
          someField: 'new',
        },
      ] as any;
      const result = service.updateSubCoverageList(
        rootData,
        formData,
        { value: 'PERSON' } as any,
        'CL1'
      );
      expect(result[0].subCoverageLevels.length).toBe(1);
      expect(result[0].subCoverageLevels[0].someField).toBe('new');
      expect(result[0].subCoverageLevels[0].subCoverLevelId).toBe('SCL1');
    });

    it('should add a new subCoverageLevel if no match is found', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverId: 'SC1',
            subCoverageLevels: [],
          },
        ],
      };
      const formData = [
        {
          description: 'SC1',
          coverLevelId: 'CL1',
          subCoverLevelId: 'SCL2',
          insuredType: { value: 'PERSON' },
          someField: 'added',
        },
      ] as any;
      const result = service.updateSubCoverageList(
        rootData,
        formData,
        { value: 'PERSON' } as any,
        'CL1'
      );
      expect(result[0].subCoverageLevels.length).toBe(1);
      expect(result[0].subCoverageLevels[0].someField).toBe('added');
    });

    it('should not update or add if subCoverId does not match', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverId: 'SC2',
            subCoverageLevels: [
              {
                coverLevelId: 'CL1',
                subCoverLevelId: 'SCL1',
                insuredType: { value: 'PERSON' },
                description: 'SC2',
                someField: 'old',
              },
            ],
          },
        ],
      };
      const formData = [
        {
          description: 'SC1',
          coverLevelId: 'CL1',
          subCoverLevelId: 'SCL1',
          insuredType: { value: 'PERSON' },
          someField: 'new',
        },
      ] as any;
      const result = service.updateSubCoverageList(
        rootData,
        formData,
        { value: 'PERSON' } as any,
        'CL1'
      );
      expect(result[0].subCoverageLevels[0].someField).toBe('old');
    });

    it('should return subCoverages unchanged if formData is empty', () => {
      const rootData = {
        subCoverages: [
          {
            subCoverId: 'SC1',
            subCoverageLevels: [
              {
                coverLevelId: 'CL1',
                subCoverLevelId: 'SCL1',
                insuredType: { value: 'PERSON' },
                description: 'SC1',
                someField: 'old',
              },
            ],
          },
        ],
      };
      const result = service.updateSubCoverageList(
        rootData,
        [],
        { value: 'PERSON' } as any,
        'CL1'
      );
      expect(result[0].subCoverageLevels[0].someField).toBe('old');
    });
  });
  describe('prepareSubCoverageLevel', () => {
    let service: SubCoverageLevelService;
    let fb: FormBuilder;

    beforeEach(() => {
      fb = new FormBuilder();
      service = new SubCoverageLevelService(fb);
      // Mock crypto.randomUUID for deterministic testing
      if (!global.crypto) {
        (global as any).crypto = {};
      }
      (global.crypto as any).randomUUID = jest.fn(() => 'mock-uuid');
    });

    function createMockFormGroup(overrides: any = {}) {
      return {
        pristine: overrides.pristine ?? false,
        controls: {
          additionalFieldsForm: {
            get: (key: string) => ({
              value: overrides[key] ?? '',
            }),
          },
          deductiblesForm: {
            get: (key: string) => ({
              value: overrides[key] ?? '',
            }),
          },
          limitsForm: {
            get: (key: string) => ({
              value: overrides[key] ?? '',
            }),
          },
          selectSubCoverage: { value: overrides.selectSubCoverage ?? 'desc' },
          subCoverageLevelId: {
            value: overrides.subCoverageLevelId ?? 'subLevelId',
          },
        },
      };
    }

    it('should build reqBody from non-pristine items', () => {
      const data = [
        createMockFormGroup({
          pristine: false,
          minLimitType: 'MIN',
          amountValue: '100',
          maxLimitType: 'Amount',
          limitScope: 'scope',
          scopeValue: 'scopeVal',
          durationType: 'Year',
          durationValue: '2',
          waitingPeriod: 'WP',
          waitingPeriodValue: '5',
          deductibleType: 'DT',
          valueType: 'Amount',
          percentOf: '10',
          aggregateLimitType: 'AMOUNT',
          aggregateamountValue: '200',
          aggregratePercentOf: '15',
          aggregateMaxPercentOf: '25',
          selectSubCoverage: 'desc',
          subCoverageLevelId: 'subLevelId',
        }),
      ];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result.length).toBe(1);
      expect(result[0].subCoverLevelId).toBe('subLevelId');
      expect(result[0].description).toBe('desc');
      expect(result[0].coverLevelId).toBe('CLID');
      expect(result[0].insuredType.value).toBe('PERSON');
      expect(result[0].limit.minType).toBe('MIN');
      expect(result[0].limit.minAmount).toBe(100);
      expect(result[0].limit.maxType).toBe('Amount');
      expect(result[0].limit.maxAmount).toBe(100);
      expect(result[0].limit.aggregateLimitType).toBe('AMOUNT');
      expect(result[0].limit.aggregateamountValue).toBe(200);
      expect(result[0].limit.aggregratePercentOf).toBe('15');
      expect(result[0].limit.scope).toBe('scope');
      expect(result[0].limit.scopeValue).toBe('scopeVal');
      expect(result[0].limit.waitingPeriod).toBe('WP');
      expect(result[0].limit.waitingPeriodValue).toBe('5');
      expect(result[0].deductible.deductibleType).toBe('DT');
      expect(result[0].deductible.type).toBe('Amount');
      expect(result[0].deductible.amount).toBe(100);
      expect(result[0].duration.type).toBe('Year');
      expect(result[0].duration.quantity).toBe('2');
      expect(result[0].ruleSet).toEqual([]);
      expect(result[0].requestId).toBe('mock-uuid');
    });

    it('should use percentOf for maxAmount if maxLimitType is Percentage', () => {
      const data = [
        createMockFormGroup({
          pristine: false,
          maxLimitType: 'Percentage',
          percentOf: '33',
          amountValue: '100',
        }),
      ];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result[0].limit.maxAmount).toBe(33);
    });

    it('should use aggregateMaxPercentOf for aggregateamountValue if aggregateLimitType is PERCENTAGE', () => {
      const data = [
        createMockFormGroup({
          pristine: false,
          aggregateLimitType: 'PERCENTAGE',
          aggregateMaxPercentOf: '99',
          aggregateamountValue: '1000',
        }),
      ];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result[0].limit.aggregateamountValue).toBe(99);
    });

    it('should use percentOf for deductible.amount if valueType is Percentage', () => {
      const data = [
        createMockFormGroup({
          pristine: false,
          valueType: 'Percentage',
          percentOf: '44',
          amountValue: '100',
        }),
      ];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result[0].deductible.amount).toBe(44);
    });

    it('should return empty array if no items are non-pristine and not cloned', () => {
      const data = [createMockFormGroup({ pristine: true })];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result).toBeUndefined();
    });

    it('should process all items if isCloned is true', () => {
      const data = [
        createMockFormGroup({
          selectSubCoverage: 'desc1',
          subCoverageLevelId: 'id1',
        }),
        createMockFormGroup({
          selectSubCoverage: 'desc2',
          subCoverageLevelId: 'id2',
        }),
      ];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        true,
        'CLID'
      );
      expect(result.length).toBe(2);
      expect(result[0].subCoverLevelId).toBe('id1');
      expect(result[1].subCoverLevelId).toBe('id2');
    });

    it('should handle missing optional fields gracefully', () => {
      const data = [createMockFormGroup({ pristine: false })];
      const result = service.prepareSubCoverageLevel(
        data,
        { value: 'PERSON' } as any,
        false,
        'CLID'
      );
      expect(result[0].limit.minType).toBe('');
      expect(result[0].limit.minAmount).toBe(0);
      expect(result[0].limit.maxType).toBe('');
      expect(result[0].limit.maxAmount).toBe(0);
      expect(result[0].deductible.deductibleType).toBe('');
      expect(result[0].deductible.type).toBe('');
      expect(result[0].deductible.amount).toBe(0);
    });
  });
  describe('validations', () => {
    let service: SubCoverageLevelService;
  
    beforeEach(() => {
      service = new SubCoverageLevelService(new FormBuilder());
      jest.spyOn(service, 'setControlValidations');
      jest.spyOn(service, 'setPercentageValidations');
      jest.spyOn(service, 'setMaxLength');
      jest.spyOn(service, 'setMaxlimiValidations');
      jest.spyOn(service, 'setMaxaggregatelimiValidations');
    });
  
    function mockControl(value: any = '') {
      return {
        value,
        get: jest.fn(() => ({ clearValidators: jest.fn() })),
        clearValidators: jest.fn(),
        setErrors: jest.fn(),
        markAsDirty: jest.fn()
      };
    }
  
    function createMockList(overrides: any = {}) {
      return {
        controls: {
          limitsForm: {
            controls: {
              maxLimitType: mockControl(overrides.maxLimitType ?? 'Amount'),
              amountValue: mockControl(overrides.amountValue ?? '100'),
              percentOf: mockControl(overrides.percentOf ?? '10'),
              aggregateLimitType: mockControl(overrides.aggregateLimitType ?? 'amt'),
              aggregateamountValue: mockControl(overrides.aggregateamountValue ?? '50'),
              aggregratePercentOf: mockControl(overrides.aggregratePercentOf ?? ''),
              aggregateMaxPercentOf: mockControl(overrides.aggregateMaxPercentOf ?? '20'),
            }
          },
          additionalFieldsForm: {
            controls: {
              minLimitType: mockControl(overrides.minLimitType ?? 'Amount'),
              amountValue: mockControl(overrides.additionalAmountValue ?? '10'),
              percentOf: mockControl(overrides.additionalPercentOf ?? '5'),
              durationType: mockControl(overrides.durationType ?? 'Year'),
              durationValue: mockControl(overrides.durationValue ?? '1'),
              limitScope: mockControl(overrides.limitScope ?? 'Scope'),
              scopeValue: mockControl(overrides.scopeValue ?? 'ScopeVal'),
              waitingPeriod: mockControl(overrides.waitingPeriod ?? 'WP'),
              waitingPeriodValue: mockControl(overrides.waitingPeriodValue ?? '2'),
            }
          },
          deductiblesForm: {
            controls: {
              amountValue: mockControl(overrides.deductAmountValue ?? '20'),
              deductibleType: mockControl(overrides.deductibleType ?? 'Type'),
              percentOf: mockControl(overrides.deductPercentOf ?? '10'),
              valueType: mockControl(overrides.valueType ?? 'Amount'),
            }
          }
        }
      };
    }
  
    it('should call setControlValidations and setMaxlimiValidations for Percentage maxLimitType', () => {
      const mock = createMockList({ maxLimitType: 'Percentage', percentOf: '5', additionalPercentOf: '10' });
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.percentOf);
      expect(service.setMaxlimiValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.percentOf);
    });
  
    it('should call setMaxaggregatelimiValidations for aggregateLimitType "amt" and aggregateamountValue < amountValue', () => {
      const mock = createMockList({ aggregateLimitType: 'amt', aggregateamountValue: '50', amountValue: '100' });
      service.validations(mock);
      expect(service.setMaxaggregatelimiValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.aggregateamountValue);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.aggregateamountValue);
    });
  
    it('should call setPercentageValidations and setMaxLength for aggregateLimitType "percentage"', () => {
      const mock = createMockList({ aggregateLimitType: 'percentage', aggregratePercentOf: '', aggregateMaxPercentOf: '101' });
      service.validations(mock);
      expect(service.setPercentageValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.aggregratePercentOf);
      expect(service.setMaxLength).toHaveBeenCalledWith(mock.controls.limitsForm.controls.aggregateMaxPercentOf);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.limitsForm.controls.aggregateMaxPercentOf);
    });
  
    it('should call setControlValidations for additionalFieldsForm minLimitType "Percentage"', () => {
      const mock = createMockList({ minLimitType: 'Percentage' });
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.additionalFieldsForm.controls.percentOf);
    });
  
    it('should call setControlValidations for additionalFieldsForm minLimitType "Amount"', () => {
      const mock = createMockList({ minLimitType: 'Amount' });
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.additionalFieldsForm.controls.amountValue);
    });
  
    it('should call setControlValidations for duration, scope, and waitingPeriod', () => {
      const mock = createMockList();
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.additionalFieldsForm.controls.durationValue);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.additionalFieldsForm.controls.scopeValue);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.additionalFieldsForm.controls.waitingPeriodValue);
    });
  
    it('should call setControlValidations for deductiblesForm valueType "Percentage"', () => {
      const mock = createMockList({ valueType: 'Percentage' });
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.deductiblesForm.controls.percentOf);
    });
  
    it('should call setControlValidations for deductiblesForm valueType "Amount"', () => {
      const mock = createMockList({ valueType: 'Amount' });
      service.validations(mock);
      expect(service.setControlValidations).toHaveBeenCalledWith(mock.controls.deductiblesForm.controls.amountValue);
    });
  
    it('should mark valueType as dirty and set errors if valueType is missing', () => {
      const mock = createMockList({ valueType: '' });
      service.validations(mock);
      expect(mock.controls.deductiblesForm.controls.valueType.markAsDirty).toHaveBeenCalled();
      expect(mock.controls.deductiblesForm.controls.valueType.setErrors).toHaveBeenCalledWith({ required: true });
    });
  });
  
});
