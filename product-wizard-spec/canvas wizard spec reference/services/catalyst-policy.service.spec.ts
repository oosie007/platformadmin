import { CatalystPolicyService } from './catalyst-policy.service';
import { StudioCommands, StudioCommand } from '@canvas/commands';
import { AppContextService } from '@canvas/services';

describe('CatalystPolicyService', () => {
  let service: CatalystPolicyService;
  let mockCommands: jest.Mocked<StudioCommands>;
  let mockAppContext: jest.Mocked<AppContextService>;

  const mockSearchPoliciesCommand: StudioCommand = {
    parameter: {
      url: '/api/catalyst/policies',
      method: 'GET',
      disableCache: true
    }
  } as any;

  const mockClearCacheCommand: StudioCommand = {
    parameter: {
      url: '/api/catalyst/cache/clear',
      method: 'POST',
      disableCache: true
    }
  } as any;

  beforeEach(() => {
    mockCommands = {
      execute: jest.fn()
    } as any;

    mockAppContext = {
      get: jest.fn()
    } as any;

    // Mock the app context responses
    mockAppContext.get.mockImplementation((path?: string) => {
      if (path === 'pages.productOverview.commands.searchPoliciesCommand') {
        return mockSearchPoliciesCommand;
      }
      if (path === 'pages.productOverview.commands.clearProductCacheHttpCommand') {
        return mockClearCacheCommand;
      }
      return null;
    });

    service = new CatalystPolicyService(mockCommands, mockAppContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize commands from app context', () => {
    expect(mockAppContext.get).toHaveBeenCalledWith(
      'pages.productOverview.commands.searchPoliciesCommand'
    );
    expect(mockAppContext.get).toHaveBeenCalledWith(
      'pages.productOverview.commands.clearProductCacheHttpCommand'
    );
    expect(service.searchPoliciesHttpCommand).toEqual(mockSearchPoliciesCommand);
    expect(service.clearProductCacheHttpCommand).toEqual(mockClearCacheCommand);
  });

  describe('getPolicyCountForProduct', () => {
    it('should execute command with correct parameters', () => {
      const productId = 'TEST_PRODUCT_123';
      const version = '1.0';
      const region = 'EUROPE';
      const mockResponse = { count: 5, policies: [] };

      mockCommands.execute.mockResolvedValue(mockResponse);

      const result = service.getPolicyCountForProduct(productId, version, region);

      expect(mockCommands.execute).toHaveBeenCalledWith(
        {
          commandName: 'HttpCommand',
          parameter: {
            url: '/api/catalyst/policies/TEST_PRODUCT_123',
            method: 'GET',
            disableCache: true,
            params: {
              version: '1.0'
            },
            headers: {
              region: 'EUROPE'
            }
          }
        },
        {}
      );

      expect(result).toBeDefined();
    });

    it('should handle different product IDs', () => {
      const productId = 'ANOTHER_PRODUCT';
      const version = '2.1';
      const region = 'AMERICAS';

      mockCommands.execute.mockResolvedValue({});

      service.getPolicyCountForProduct(productId, version, region);

      expect(mockCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({
            url: '/api/catalyst/policies/ANOTHER_PRODUCT',
            params: { version: '2.1' },
            headers: { region: 'AMERICAS' }
          })
        }),
        {}
      );
    });

    it('should handle empty or null parameters', () => {
      mockCommands.execute.mockResolvedValue(null);

      service.getPolicyCountForProduct('', '', '');

      expect(mockCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({
            url: '/api/catalyst/policies/',
            params: { version: '' },
            headers: { region: '' }
          })
        }),
        {}
      );
    });

    it('should preserve command configuration', () => {
      mockCommands.execute.mockResolvedValue({});

      service.getPolicyCountForProduct('test', '1.0', 'EU');

      const calledArgs = mockCommands.execute.mock.calls[0][0] as any;
      expect(calledArgs.commandName).toBe('HttpCommand');
      expect(calledArgs.parameter.method).toBe('GET');
      expect(calledArgs.parameter.disableCache).toBe(true);
    });
  });

  describe('clearProductCacheWithVersion', () => {
    it('should execute clear cache command with payload', () => {
      const payload = { productId: 'TEST_PRODUCT', version: '1.0' };
      const region = 'EUROPE';
      const mockResponse = { success: true };

      mockCommands.execute.mockResolvedValue(mockResponse);

      const result = service.clearProductCacheWithVersion(payload, region);

      expect(mockCommands.execute).toHaveBeenCalledWith(
        {
          commandName: 'HttpCommand',
          parameter: {
            url: '/api/catalyst/cache/clear',
            method: 'POST',
            disableCache: true,
            headers: {
              region: 'EUROPE'
            }
          }
        },
        payload,
        {}
      );

      expect(result).toBeDefined();
    });

    it('should handle different regions', () => {
      const payload = { data: 'test' };
      const region = 'AMERICAS';

      mockCommands.execute.mockResolvedValue({ cleared: true });

      service.clearProductCacheWithVersion(payload, region);

      expect(mockCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({
            headers: { region: 'AMERICAS' }
          })
        }),
        payload,
        {}
      );
    });

    it('should handle null payload', () => {
      mockCommands.execute.mockResolvedValue({});

      service.clearProductCacheWithVersion(null, 'EU');

      expect(mockCommands.execute).toHaveBeenCalledWith(
        expect.any(Object),
        null,
        {}
      );
    });

    it('should handle empty payload object', () => {
      const payload = {};
      mockCommands.execute.mockResolvedValue({});

      service.clearProductCacheWithVersion(payload, 'ASIA');

      expect(mockCommands.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter: expect.objectContaining({
            method: 'POST',
            disableCache: true,
            headers: { region: 'ASIA' }
          })
        }),
        payload,
        {}
      );
    });

    it('should preserve POST method and cache settings', () => {
      mockCommands.execute.mockResolvedValue({});

      service.clearProductCacheWithVersion({}, 'TEST');

      const calledArgs = mockCommands.execute.mock.calls[0][0] as any;
      expect(calledArgs.commandName).toBe('HttpCommand');
      expect(calledArgs.parameter.method).toBe('POST');
      expect(calledArgs.parameter.disableCache).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle command execution errors in getPolicyCountForProduct', async () => {
      const error = new Error('Network error');
      mockCommands.execute.mockRejectedValue(error);

      try {
        await service.getPolicyCountForProduct('test', '1.0', 'EU');
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it('should handle command execution errors in clearProductCacheWithVersion', async () => {
      const error = new Error('Cache clear failed');
      mockCommands.execute.mockRejectedValue(error);

      try {
        await service.clearProductCacheWithVersion({}, 'EU');
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('Command configuration edge cases', () => {
    it('should handle missing searchPoliciesCommand configuration', () => {
      mockAppContext.get.mockImplementation((path?: string) => {
        if (path === 'pages.productOverview.commands.searchPoliciesCommand') {
          return null;
        }
        if (path === 'pages.productOverview.commands.clearProductCacheHttpCommand') {
          return mockClearCacheCommand;
        }
        return null;
      });

      const newService = new CatalystPolicyService(mockCommands, mockAppContext);
      expect(newService.searchPoliciesHttpCommand).toBeNull();
    });

    it('should handle missing clearProductCacheHttpCommand configuration', () => {
      mockAppContext.get.mockImplementation((path?: string) => {
        if (path === 'pages.productOverview.commands.searchPoliciesCommand') {
          return mockSearchPoliciesCommand;
        }
        if (path === 'pages.productOverview.commands.clearProductCacheHttpCommand') {
          return null;
        }
        return null;
      });

      const newService = new CatalystPolicyService(mockCommands, mockAppContext);
      expect(newService.clearProductCacheHttpCommand).toBeNull();
    });

    it('should handle malformed command configuration', () => {
      const malformedCommand = { parameter: null } as any;
      
      mockAppContext.get.mockImplementation((path?: string) => {
        if (path === 'pages.productOverview.commands.searchPoliciesCommand') {
          return malformedCommand;
        }
        return mockClearCacheCommand;
      });

      expect(() => {
        new CatalystPolicyService(mockCommands, mockAppContext);
      }).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple sequential calls', () => {
      mockCommands.execute.mockResolvedValue({ success: true });

      service.getPolicyCountForProduct('product1', '1.0', 'EU');
      service.clearProductCacheWithVersion({ productId: 'product1' }, 'EU');
      service.getPolicyCountForProduct('product2', '2.0', 'US');

      expect(mockCommands.execute).toHaveBeenCalledTimes(3);
    });

    it('should maintain command state between calls', () => {
      mockCommands.execute.mockResolvedValue({});

      const originalSearchCommand = service.searchPoliciesHttpCommand;
      const originalClearCommand = service.clearProductCacheHttpCommand;

      service.getPolicyCountForProduct('test', '1.0', 'EU');
      service.clearProductCacheWithVersion({}, 'EU');

      expect(service.searchPoliciesHttpCommand).toBe(originalSearchCommand);
      expect(service.clearProductCacheHttpCommand).toBe(originalClearCommand);
    });
  });
});
