import { SharedService } from './shared.service';
import { Subject } from 'rxjs';

describe('SharedService', () => {
  let service: SharedService;

  beforeEach(() => {
    service = new SharedService();
  });

  describe('getNextButtonClicked', () => {
    it('should return an observable from nextButtonClicked', (done) => {
      service.getNextButtonClicked().subscribe((val) => {
        expect(val).toBe('test');
        done();
      });
      service.nextButtonClicked.next('test');
    });
  });

  describe('getPreviousButtonClicked', () => {
    it('should return an observable from previousButtonClicked', (done) => {
      service.getPreviousButtonClicked().subscribe((val) => {
        expect(val).toBe('prev');
        done();
      });
      service.previousButtonClicked.next('prev');
    });
  });

  describe('_bindDomainData', () => {
    it('should bind domain data to the correct form config control', () => {
      const formConfig = [
        { control: 'country', options: [] },
        { control: 'city', options: [] },
      ] as any;

      const bindDomainData = [
        { id: '1', name: 'USA', code: 'US' },
        { id: '2', name: 'Canada', code: 'CA' },
      ];

      service._bindDomainData(
        formConfig,
        bindDomainData,
        'country',
        'code',
        'name'
      );

      expect(formConfig[0].options).toEqual([
        { value: 'US', label: 'USA' },
        { value: 'CA', label: 'Canada' },
      ]);
      expect(formConfig[1].options).toEqual([]); // Unchanged
    });

    it('should set empty string if valueKey or labelKey is missing', () => {
      const formConfig = [{ control: 'country', options: [] }] as any;

      const bindDomainData = [{ id: '1', name: undefined, code: undefined }];

      service._bindDomainData(
        formConfig,
        bindDomainData,
        'country',
        'code',
        'name'
      );

      expect(formConfig[0].options).toEqual([{ value: '', label: '' }]);
    });

    it('should not modify controls that do not match', () => {
      const formConfig = [{ control: 'city', options: [] }] as any;

      const bindDomainData = [{ id: '1', name: 'NYC', code: 'NY' }];

      service._bindDomainData(
        formConfig,
        bindDomainData,
        'country',
        'code',
        'name'
      );

      expect(formConfig[0].options).toEqual([]);
    });
  });
});
