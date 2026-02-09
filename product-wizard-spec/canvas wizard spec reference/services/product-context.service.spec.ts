import { ProductContextService } from './product-context.service';
import { AuthService } from '@canvas/shared/data-access/auth';
import { Statuskeys } from '../types/product';

describe('ProductContextService', () => {
  let service: ProductContextService;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      userEntitlements: {
        entitlements: { UpdateLockStatus: { enabled: false } },
        name: 'testuser',
      },
    };
    service = new ProductContextService(mockAuthService);
    jest.clearAllMocks();
    // Mock localStorage
    // Use jest.spyOn to mock localStorage methods
    jest.spyOn(window.localStorage['__proto__'], 'getItem');
    jest.spyOn(window.localStorage['__proto__'], 'setItem');
    jest.spyOn(window.localStorage['__proto__'], 'removeItem');
    (localStorage.getItem as jest.Mock).mockReset();
    (localStorage.setItem as jest.Mock).mockReset();
    (localStorage.removeItem as jest.Mock).mockReset();
  });

  describe('_getProductContext', () => {
    it('should return default values if localStorage is empty', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      const context = service._getProductContext();
      expect(context.productId).toBe('');
      expect(context.country).toEqual(['IE']);
      expect(context.language).toBe('en');
    });

    it('should return parsed values from localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          productVersionId: 'vid',
          requestId: 'rid',
          country: ['US'],
          language: 'fr',
          status: 'ACTIVE',
        })
      );
      const context = service._getProductContext();
      expect(context.productId).toBe('pid');
      expect(context.country).toEqual(['US']);
      expect(context.language).toBe('fr');
      expect(context.status).toBe('ACTIVE');
    });
  });

  describe('_setProductContext', () => {
    it('should set product context and call _setProductId', () => {
      const spy = jest.spyOn(service, '_setProductId');
      service._setProductContext('pid', 'vid', 'rid', ['US'], ['en'], 'ACTIVE');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'productContext',
        expect.any(String)
      );
      expect(spy).toHaveBeenCalledWith('pid');
    });
  });

  describe('_setProductId/_getProductId', () => {
    it('should set and get productId', () => {
      service._setProductId('pid');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"productId":"pid"')
      );
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productId: 'pid' })
      );
      expect(service._getProductId()).toBe('pid');
    });
  });

  describe('_setCoverageVariantId/_getCoverageVariantId', () => {
    it('should set and get coverageVariantId', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      service._setCoverageVariantId('covId');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"coverageVariantId":"covId"')
      );
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ coverageVariantId: 'covId' })
      );
      expect(service._getCoverageVariantId()).toBe('covId');
    });
  });

  describe('setProductLock/isProductLocked', () => {
    it('should set and get productLock', () => {
      service.setProductLock(true);
      expect(service.isProductLocked()).toBe(true);
      service.setProductLock(false);
      expect(service.isProductLocked()).toBe(false);
    });
  });

  describe('isReadonlyProduct', () => {
    it('should return false if productLock is false', () => {
      service.productLock = false;
      expect(service.isReadonlyProduct()).toBe(false);
    });

    it('should return true if user cannot edit', () => {
      service.productLock = true;
      service.productHeader = {
        createdBy: 'someone',
        allowedLockStatusUsers: [],
      } as any;
      mockAuthService.userEntitlements.entitlements.UpdateLockStatus.enabled =
        false;
      mockAuthService.userEntitlements.name = 'notcreator';
      expect(service.isReadonlyProduct()).toBe(true);
    });

    it('should return false if user can edit', () => {
      service.productLock = true;
      service.productHeader = {
        createdBy: 'testuser',
        allowedLockStatusUsers: ['testuser'],
      } as any;
      mockAuthService.userEntitlements.entitlements.UpdateLockStatus.enabled =
        true;
      mockAuthService.userEntitlements.name = 'testuser';
      expect(service.isReadonlyProduct()).toBe(false);
    });
  });

  describe('removeLocalStorage', () => {
    it('should remove all relevant localStorage keys', () => {
      service.removeLocalStorage();
      expect(localStorage.removeItem).toHaveBeenCalledWith('productContext');
      expect(localStorage.removeItem).toHaveBeenCalledWith('productId');
      expect(localStorage.removeItem).toHaveBeenCalledWith('productVersions');
      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
    });
  });
  describe('_getAvailabilityId', () => {
    it('should return availabilityId if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ availabilityId: 'avail-123' })
      );
      expect(service._getAvailabilityId()).toBe('avail-123');
    });

    it('should return undefined if availabilityId is not present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getAvailabilityId()).toBeUndefined();
    });

    it('should return undefined if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('');
      expect(() => service._getAvailabilityId()).toThrow();
    });
  });

  describe('_getCoverageVariantName', () => {
    it('should return the value from localStorage if present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('variant-abc');
      expect(service._getCoverageVariantName()).toBe('variant-abc');
    });

    it('should return an empty string if localStorage returns null', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      expect(service._getCoverageVariantName()).toBe('');
    });

    it('should return an empty string if localStorage returns undefined', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(undefined);
      expect(service._getCoverageVariantName()).toBe('');
    });
  });

  describe('_getProductAggregateLimitValue', () => {
    it('should return productAggregateLimitValue if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productAggregateLimitValue: 12345 })
      );
      expect(service._getProductAggregateLimitValue()).toBe(12345);
    });

    it('should return undefined if productAggregateLimitValue is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getProductAggregateLimitValue()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getProductAggregateLimitValue()).toThrow();
    });

    describe('_getProductAggregateLimitType', () => {
      it('should return productAggregateLimitType if present in localStorage', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(
          JSON.stringify({ productAggregateLimitType: 'LIMIT_TYPE_X' })
        );
        expect(service._getProductAggregateLimitType()).toBe('LIMIT_TYPE_X');
      });

      it('should return undefined if productAggregateLimitType is not present', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
        expect(service._getProductAggregateLimitType()).toBeUndefined();
      });

      it('should throw if localStorage returns invalid JSON', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
        expect(() => service._getProductAggregateLimitType()).toThrow();
      });
    });
  });

  describe('_getproductAggregatePercentageType', () => {
    it('should return productAggregatePercentageType if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productAggregatePercentageType: 'PERCENT_TYPE_X' })
      );
      expect(service._getproductAggregatePercentageType()).toBe(
        'PERCENT_TYPE_X'
      );
    });

    it('should return undefined if productAggregatePercentageType is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getproductAggregatePercentageType()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getproductAggregatePercentageType()).toThrow();
    });
  });

  describe('_getPartnerProvidedData', () => {
    it('should return isPartnerProvidedPremium if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ isPartnerProvidedPremium: true })
      );
      expect(service._getPartnerProvidedData()).toBe(true);
    });

    it('should return undefined if isPartnerProvidedPremium is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getPartnerProvidedData()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getPartnerProvidedData()).toThrow();
    });
  });

  describe('getToastMessage', () => {
    it('should return "Final status" message by default', () => {
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(false);
      const result = service.getToastMessage();
      expect(result.warning.message).toBe(
        'Changes are not allowed as product is in Final status'
      );
      expect(result.warning.severity).toBe('info');
      expect(result.warning.duration).toBe(5000);
    });

    it('should return "inherited from previous version" message if isCurrentVersion is true', () => {
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(false);
      const result = service.getToastMessage(true);
      expect(result.warning.message).toBe(
        'Changes are not allowed as product was inherited from the previous version of the product'
      );
    });

    it('should return "Lock status" message if isReadonlyProduct is true and isCurrentVersion is false', () => {
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(true);
      const result = service.getToastMessage(false);
      expect(result.warning.message).toBe(
        'Changes are not allowed as product is in Lock status'
      );
    });
  });

  describe('setProductHeader', () => {
    it('should set productHeader and call setProductLock with lockStatus', () => {
      const mockHeader = { lockStatus: true } as any;
      const lockSpy = jest.spyOn(service, 'setProductLock');
      service.setProductHeader(mockHeader);
      expect(service.productHeader).toBe(mockHeader);
      expect(lockSpy).toHaveBeenCalledWith(true);
    });

    it('should call setProductLock with false if lockStatus is undefined', () => {
      const mockHeader = {} as any;
      const lockSpy = jest.spyOn(service, 'setProductLock');
      service.setProductHeader(mockHeader);
      expect(service.productHeader).toBe(mockHeader);
      expect(lockSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('isProductDisabled', () => {
    it('should return true if status is FINAL', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ status: Statuskeys.FINAL } as any);
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(false);
      expect(service.isProductDisabled()).toBe(true);
    });

    it('should return true if isReadonlyProduct returns true', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ status: 'SOMETHING' } as any);
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(true);
      expect(service.isProductDisabled()).toBe(true);
    });

    it('should return false if status is not FINAL and isReadonlyProduct returns false', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ status: 'SOMETHING' } as any);
      jest.spyOn(service, 'isReadonlyProduct').mockReturnValue(false);
      expect(service.isProductDisabled()).toBe(false);
    });
  });

  describe('_getProductAggregateMaxValue', () => {
    it('should return productAggregateMaxValue if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productAggregateMaxValue: 9999 })
      );
      expect(service._getProductAggregateMaxValue()).toBe(9999);
    });

    it('should return undefined if productAggregateMaxValue is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getProductAggregateMaxValue()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getProductAggregateMaxValue()).toThrow();
    });
  });

  describe('_getCoverageVariantData', () => {
    it('should return coverageVariantData if present in localStorage', () => {
      const mockData = { foo: 'bar' };
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ coverageVariantData: mockData })
      );
      expect(service._getCoverageVariantData()).toEqual(mockData);
    });

    it('should return undefined if coverageVariantData is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getCoverageVariantData()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getCoverageVariantData()).toThrow();
    });
  });

  describe('_isCurrVersionNew', () => {
    it('should return false if versMeta status is FINAL', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ productVersionId: 'v1' } as any);
      jest.spyOn(service, '_getProductVersions').mockReturnValue({
        versions: [{ versionId: 'v1', status: { value: Statuskeys.FINAL } }],
      } as any);
      expect(service._isCurrVersionNew()).toBe(false);
    });

    it('should return false if versMeta status is DELETE', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ productVersionId: 'v1' } as any);
      jest.spyOn(service, '_getProductVersions').mockReturnValue({
        versions: [{ versionId: 'v1', status: { value: Statuskeys.DELETE } }],
      } as any);
      expect(service._isCurrVersionNew()).toBe(false);
    });

    it('should return false if no version has status FINAL', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ productVersionId: 'v1' } as any);
      jest.spyOn(service, '_getProductVersions').mockReturnValue({
        versions: [
          { versionId: 'v1', status: { value: 'DRAFT' } },
          { versionId: 'v2', status: { value: 'DRAFT' } },
        ],
      } as any);
      expect(service._isCurrVersionNew()).toBe(false);
    });

    it('should return true if versMeta exists, status is not FINAL/DELETE, and some version is FINAL', () => {
      jest
        .spyOn(service, '_getProductContext')
        .mockReturnValue({ productVersionId: 'v1' } as any);
      jest.spyOn(service, '_getProductVersions').mockReturnValue({
        versions: [
          { versionId: 'v1', status: { value: 'DRAFT' } },
          { versionId: 'v2', status: { value: Statuskeys.FINAL } },
        ],
      } as any);
      expect(service._isCurrVersionNew()).toBe(true);
    });
  });

  describe('_getProductClass', () => {
    it('should return productClass if present in localStorage', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productClass: 'CLASS_X' })
      );
      expect(service._getProductClass()).toBe('CLASS_X');
    });

    it('should return undefined if productClass is not present', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      expect(service._getProductClass()).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getProductClass()).toThrow();
    });
  });

  describe('_setProductClass', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided productClass and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitType: 'type1',
          productAggregatePercentageType: 'ptype1',
          productAggregateLimitValue: 123,
          productAggregateMaxValue: 456,
          coverageVariantData: { foo: 'bar' },
          isPartnerProvidedPremium: true,
        })
      );

      service._setProductClass('NEW_CLASS');

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"productClass":"NEW_CLASS"')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'NEW_CLASS',
      });
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setProductClass('DEFAULT_CLASS');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: undefined,
        productAggregateLimitType: '',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: 'DEFAULT_CLASS',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setProductClass('NULL_CLASS');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productClass).toBe('NULL_CLASS');
    });
  });

  describe('_setPartnerProvidedData', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided isPartnerProvidedPremium and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitType: 'type1',
          productAggregatePercentageType: 'ptype1',
          productAggregateLimitValue: 123,
          productAggregateMaxValue: 456,
          coverageVariantData: { foo: 'bar' },
          productClass: 'CLASS_X',
        })
      );

      service._setPartnerProvidedData(true);

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"isPartnerProvidedPremium":true')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setPartnerProvidedData(false);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: undefined,
        productAggregateLimitType: '',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setPartnerProvidedData(true);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.isPartnerProvidedPremium).toBe(true);
    });
  });

  describe('_setCoverageVariantData', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided coverageVariantData and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitType: 'type1',
          productAggregatePercentageType: 'ptype1',
          productAggregateLimitValue: 123,
          productAggregateMaxValue: 456,
          isPartnerProvidedPremium: true,
          productClass: 'CLASS_X',
        })
      );

      const mockCoverageVariantData = { foo: 'bar' };
      service._setCoverageVariantData(mockCoverageVariantData as any);

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"coverageVariantData":{"foo":"bar"}')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setCoverageVariantData(null as any);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: undefined,
        productAggregateLimitType: '',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setCoverageVariantData({ foo: 'baz' } as any);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.coverageVariantData).toEqual({ foo: 'baz' });
    });
  });

  describe('_setProductAggregateMaxValue', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided productAggregateMaxValue and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitType: 'type1',
          productAggregatePercentageType: 'ptype1',
          productAggregateLimitValue: 123,
          coverageVariantData: { foo: 'bar' },
          isPartnerProvidedPremium: true,
          productClass: 'CLASS_X',
        })
      );

      service._setProductAggregateMaxValue(9999);

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"productAggregateMaxValue":9999')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 9999,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setProductAggregateMaxValue(555);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: undefined,
        productAggregateLimitType: '',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 555,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setProductAggregateMaxValue(1234);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregateMaxValue).toBe(1234);
    });
  });

  describe('_setproductAggregatePercentageType', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided productAggregatePercentageType and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitValue: 123,
          productAggregateLimitType: 'type1',
          productAggregateMaxValue: 456,
          coverageVariantData: { foo: 'bar' },
          isPartnerProvidedPremium: true,
          productClass: 'CLASS_X',
        })
      );

      service._setproductAggregatePercentageType('PERCENT_TYPE_X');

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining(
          '"productAggregatePercentageType":"PERCENT_TYPE_X"'
        )
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'PERCENT_TYPE_X',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should set productAggregatePercentageType to empty string if undefined is passed', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
        })
      );

      service._setproductAggregatePercentageType(undefined as any);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregatePercentageType).toBe('');
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setproductAggregatePercentageType('PERCENT_TYPE_Y');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: '',
        productAggregateLimitType: undefined,
        productAggregatePercentageType: 'PERCENT_TYPE_Y',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setproductAggregatePercentageType('PERCENT_TYPE_Z');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregatePercentageType).toBe('PERCENT_TYPE_Z');
    });
  });

  describe('_setProductAggregateLimitType', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided productAggregateLimitType and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitValue: 123,
          productAggregatePercentageType: 'ptype1',
          productAggregateMaxValue: 456,
          coverageVariantData: { foo: 'bar' },
          isPartnerProvidedPremium: true,
          productClass: 'CLASS_X',
        })
      );

      service._setProductAggregateLimitType('LIMIT_TYPE_X');

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"productAggregateLimitType":"LIMIT_TYPE_X"')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 123,
        productAggregateLimitType: 'LIMIT_TYPE_X',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should set productAggregateLimitType to empty string if undefined is passed', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
        })
      );

      service._setProductAggregateLimitType(undefined as any);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregateLimitType).toBe('');
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setProductAggregateLimitType('LIMIT_TYPE_Y');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: '',
        productAggregateLimitType: 'LIMIT_TYPE_Y',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setProductAggregateLimitType('LIMIT_TYPE_Z');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregateLimitType).toBe('LIMIT_TYPE_Z');
    });
  });

  describe('_setProductAggregateLimitValue', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided productAggregateLimitValue and preserve other fields', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
          availabilityId: 'aid',
          coverageVariantId: 'cid',
          productAggregateLimitType: 'type1',
          productAggregatePercentageType: 'ptype1',
          productAggregateMaxValue: 456,
          coverageVariantData: { foo: 'bar' },
          isPartnerProvidedPremium: true,
          productClass: 'CLASS_X',
        })
      );

      service._setProductAggregateLimitValue(789);

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"productAggregateLimitValue":789')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'aid',
        coverageVariantId: 'cid',
        productAggregateLimitValue: 789,
        productAggregateLimitType: 'type1',
        productAggregatePercentageType: 'ptype1',
        productAggregateMaxValue: 456,
        coverageVariantData: { foo: 'bar' },
        isPartnerProvidedPremium: true,
        productClass: 'CLASS_X',
      });
    });

    it('should use default values if fields are missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setProductAggregateLimitValue(123);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: '',
        availabilityId: '',
        coverageVariantId: '',
        productAggregateLimitValue: 123,
        productAggregateLimitType: '',
        productAggregatePercentageType: '',
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setProductAggregateLimitValue(456);

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productAggregateLimitValue).toBe(456);
    });
  });

  describe('_setAvailabilityId', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should update idContext with the provided availabilityId and preserve productId', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          productId: 'pid',
        })
      );

      service._setAvailabilityId('avail-123');

      expect(localStorage.removeItem).toHaveBeenCalledWith('idContext');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'idContext',
        expect.stringContaining('"availabilityId":"avail-123"')
      );

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed).toEqual({
        productId: 'pid',
        availabilityId: 'avail-123',
        coverageVariantId: '',
        productAggregatePercentageType: '',
        productAggregateLimitType: '',
        productAggregateLimitValue: 0,
        productAggregateMaxValue: 0,
        coverageVariantData: null,
        isPartnerProvidedPremium: false,
        productClass: '',
      });
    });

    it('should use default productId if missing in idContext', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));

      service._setAvailabilityId('avail-456');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productId).toBe('');
      expect(parsed.availabilityId).toBe('avail-456');
    });

    it('should handle null returned from localStorage.getItem', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      service._setAvailabilityId('avail-789');

      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);
      expect(parsed.productId).toBe('');
      expect(parsed.availabilityId).toBe('avail-789');
    });
  });

  describe('_getProductVersions', () => {
    it('should return productId and versions if present in localStorage', () => {
      const versions = [
        { versionId: 'v1', status: { value: 'ACTIVE' } },
        { versionId: 'v2', status: { value: 'FINAL' } },
      ];
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ productId: 'pid', versions })
      );
      const result = service._getProductVersions();
      expect(result.productId).toBe('pid');
      expect(result.versions).toEqual(versions);
    });

    it('should return empty productId and undefined versions if localStorage is empty', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      const result = service._getProductVersions();
      expect(result.productId).toBe('');
      expect(result.versions).toBeUndefined();
    });

    it('should return empty productId and undefined versions if fields are missing', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({}));
      const result = service._getProductVersions();
      expect(result.productId).toBe('');
      expect(result.versions).toBeUndefined();
    });

    it('should throw if localStorage returns invalid JSON', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('not-json');
      expect(() => service._getProductVersions()).toThrow();
    });
  });
  describe('_setProductVersions', () => {
    beforeEach(() => {
      (localStorage.getItem as jest.Mock).mockReset();
      (localStorage.setItem as jest.Mock).mockReset();
      (localStorage.removeItem as jest.Mock).mockReset();
    });

    it('should remove productVersions and set new versions, but productId will be a function reference', () => {
      service._getProductId = jest.fn(() => 'test-product-id');
      const versions = [
        { versionId: 'v1', status: { value: 'ACTIVE' } },
        { versionId: 'v2', status: { value: 'FINAL' } },
      ];

      service._setProductVersions(versions);

      expect(localStorage.removeItem).toHaveBeenCalledWith('productVersions');
      const [key, value] = (localStorage.setItem as jest.Mock).mock.calls[0];
      const parsed = JSON.parse(value);

      expect(key).toBe('productVersions');

      expect(parsed.productId).toBeUndefined();
      expect(parsed.versions).toEqual(versions);
    });
  });
});
