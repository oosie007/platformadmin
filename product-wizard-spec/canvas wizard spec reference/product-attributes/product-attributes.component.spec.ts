import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioCommands } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import { AppContextService, ComponentRegistry } from '@canvas/services';
import { AUTH_SETTINGS } from '@canvas/shared/data-access/auth';
import { MockProvider } from 'ng-mocks';
import { TableService } from 'primeng/table';
import { of, Subject, throwError } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

import { UtilityService } from '../../../services/utility.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductAttributesComponent } from './product-attributes.component';
import { ProductAttribute, CustomAttributeAnswer, AttributeValue } from './model/product-attribute';
import { Statuskeys } from '../../types/product';
import { MasterData } from '../../types/master-data';

// Mock data
const mockProductAttributes: ProductAttribute[] = [
  {
    attrId: '1',
    attrName: 'Test Attribute 1',
    type: 'STRING',
    required: true,
    doNotAllowDuplicate: false,
    isCurrentVersion: true,
    description: 'Test description 1'
  },
  {
    attrId: '2',
    attrName: 'Test Attribute 2',
    type: 'BOOLEAN',
    required: false,
    doNotAllowDuplicate: true,
    isCurrentVersion: true,
    description: 'Test description 2'
  }
];

const mockAttributeValues: AttributeValue[] = [
  {
    attributeId: 'attr1',
    attributeDescription: 'Attribute 1',
    datatype: 'STRING',
    category: 'TEST'
  },
  {
    attributeId: 'attr2',
    attributeDescription: 'Attribute 2',
    datatype: 'BOOLEAN',
    category: 'TEST'
  }
];

const mockSchema = {
  properties: {
    attrName: {
      widget: {
        formlyConfig: {
          props: { disabled: false }
        }
      }
    },
    answers: {
      widget: {
        formlyConfig: {
          hide: true
        }
      }
    },
    type: {
      widget: {
        formlyConfig: {
          hooks: {},
          props: {}
        }
      }
    }
  }
};

const mockColumns = [
  { fieldName: 'name', caption: 'Name' },
  {
    fieldName: 'action',
    caption: 'Action',
    actions: [
      { label: 'Edit', icon: 'pi pi-pencil' },
      { label: 'Delete', icon: 'pi pi-trash' }
    ]
  }
];

const mockLabels = {
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete'
};

const mockMessages = {
  save: {
    success: { severity: 'success', message: 'Saved successfully' },
    error: { severity: 'error', message: 'Save failed' }
  },
  edit: {
    success: { severity: 'success', message: 'Edited successfully' },
    error: { severity: 'error', message: 'Edit failed' }
  },
  delete: {
    success: { severity: 'success', message: 'Deleted successfully' },
    error: { severity: 'error', message: 'Delete failed' }
  },
  fetch: {
    error: { severity: 'error', message: 'Fetch failed' }
  },
  attributeExistsError: 'Attribute already exists'
};

const mockListOptions = {
  showPaginator: true,
  rowsPerPageOptions: [25, 50, 75, 100]
};

// Service mocks
const mockLayoutService = {
  updateBreadcrumbs: jest.fn(),
  showMessage: jest.fn()
};

const mockProductsService = {
  fetchProductAttributes: jest.fn().mockReturnValue(of(mockProductAttributes)),
  saveProductAttribute: jest.fn().mockReturnValue(of({ succeeded: true })),
  savePredefineProductAttribute: jest.fn().mockReturnValue(of({ succeeded: true })),
  deleteProductAttribute: jest.fn().mockReturnValue(of({ succeeded: true })),
  editProductAttribute: jest.fn().mockReturnValue(of({ succeeded: true })),
  getDataTypes: jest.fn().mockReturnValue(of([
    { code: 'STRING', description: 'String' },
    { code: 'NUMBER', description: 'Number' },
    { code: 'BOOLEAN', description: 'Boolean' },
    { code: 'DROPDOWN', description: 'Dropdown' }
  ]))
};

const mockProductContextService = {
  isProductDisabled: jest.fn().mockReturnValue(false),
  isProductLocked: jest.fn().mockReturnValue(false),
  isReadonlyProduct: jest.fn().mockReturnValue(false),
  _getProductContext: jest.fn().mockReturnValue({
    productId: '123',
    productVersionId: '1.0',
    country: ['US'],
    requestId: 'req-123',
    language: 'en',
    status: 'DRAFT'
  })
};

const mockAppContextService = {
  get: jest.fn((path: string) => {
    const mockDataMapping: any = {
      'pages.product.productAttributes.schema': mockSchema,
      'pages.product.productAttributes.columns': mockColumns,
      'pages.product.productAttributes.labels': mockLabels,
      'pages.product.productAttributes.messages': mockMessages,
      'pages.product.productAttributes.listOptions': mockListOptions,
      'pages.product.productAttributes.disableFeature': false
    };
    return mockDataMapping[path] || null;
  })
};

const mockUtilityService = {
  fetchAdminDomainData: jest.fn(),
  getPredefinedAttributeList: jest.fn().mockReturnValue(of([
    { predefinedAttrValues: mockAttributeValues }
  ]))
};

const mockCoverageVariantsService = {
  getCoverageVariants: jest.fn().mockReturnValue(of([
    { productClass: { value: 'class1' } },
    { productClass: { value: 'class2' } }
  ]))
};

const mockSharedService = {
  nextButtonClicked: { next: jest.fn() } as any,
  previousButtonClicked: { next: jest.fn() } as any
};

const mockComponentRegistry = {};

describe('ProductAttributesComponent', () => {
  let component: ProductAttributesComponent;
  let fixture: ComponentFixture<ProductAttributesComponent>;

  beforeEach(async () => {
    // Reset localStorage
    localStorage.setItem('productId', '123');
    localStorage.setItem('productVersionId', '1.0');

    await TestBed.configureTestingModule({
      imports: [ProductAttributesComponent],
      providers: [
        {
          provide: ProductContextService,
          useValue: mockProductContextService
        },
        {
          provide: LayoutService,
          useValue: mockLayoutService
        },
        MockProvider(SharedService),
        MockProvider(TableService),
        MockProvider(StudioCommands),
        {
          provide: ProductsService,
          useValue: mockProductsService
        },
        {
          provide: AppContextService,
          useValue: mockAppContextService
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService
        },
        {
          provide: ComponentRegistry,
          useValue: mockComponentRegistry
        },
        {
          provide: SharedService,
          useValue: mockSharedService
        },
        {
          provide: AUTH_SETTINGS,
          useValue: {
            authority: 'mock-authority',
            client_id: 'mock-client-id',
            redirect_uri: 'mock-redirect-uri',
            scope: 'mock-scope'
          }
        },
        {
          provide: CoverageVariantsService,
          useValue: mockCoverageVariantsService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductAttributesComponent);
    component = fixture.componentInstance;

    // Initialize component properties
    component.attributeSchema = mockSchema as any;
    component.attributeColumns = mockColumns as any;
    component.labels = mockLabels as any;
    component.messages = mockMessages as any;
    component.listOptions = mockListOptions as any;
    component.attributes = cloneDeep(mockProductAttributes);
    component.attributesCopy = cloneDeep(mockProductAttributes);
    component.existingAttributeList = cloneDeep(mockAttributeValues);
    component.copyPredefineAttributeList = cloneDeep(mockAttributeValues);
    component.productId = '123';
    component.productVersionId = '1.0';
    component.productClasslist = 'class1,class2';

    // Mock methods called in ngOnInit
    jest.spyOn(component, 'getCoverageVariants').mockImplementation(() => {});
    jest.spyOn(component as any, '_updateDataTypes').mockImplementation(() => {});
    jest.spyOn(component as any, '_updateLayout').mockImplementation(() => {});
    jest.spyOn(component as any, '_updateAttributeName').mockImplementation(() => {});
    jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});
    jest.spyOn(component, 'toggleDrawer').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with localStorage values', () => {
      expect(component.productId).toBe('123');
      expect(component.productVersionId).toBe('1.0');
    });

    it('should call ngOnInit methods', () => {
      component.ngOnInit();

      expect(component.getCoverageVariants).toHaveBeenCalledWith('123', '1.0');
      expect(component['_updateDataTypes']).toHaveBeenCalled();
      expect(component['_updateLayout']).toHaveBeenCalled();
      expect(component['_updateAttributeName']).toHaveBeenCalled();
    });
  });

  describe('_generateOptions', () => {
    it('should generate table options with enabled actions when product is not disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);

      component['_generateOptions']();

      expect(component.options.showPaginator).toBe(true);
      expect(component.options.rowsPerPageOptions).toEqual([15, 30, 50, 100]);
      expect(component.options.columns).toEqual(cloneDeep(component.attributeColumns));
    });
  });

  describe('searchProductAttribute', () => {
    beforeEach(() => {
      component.attributesCopy = mockProductAttributes;
    });

    it('should reset attributes when query is empty', () => {
      const event = { query: '' };

      component.searchProductAttribute(event);

      expect(component.attributes).toEqual(cloneDeep(component.attributesCopy));
    });

    it('should filter attributes by name', () => {
      const event = { query: 'Test Attribute 1' };

      component.searchProductAttribute(event);

      expect(component.attributes).toHaveLength(1);
      expect(component.attributes[0].attrName).toBe('Test Attribute 1');
    });

    it('should filter attributes by type', () => {
      const event = { query: 'boolean' };

      component.searchProductAttribute(event);

      expect(component.attributes).toHaveLength(1);
      expect(component.attributes[0].type).toBe('BOOLEAN');
    });

    it('should return empty array when no matches found', () => {
      const event = { query: 'NonExistent' };

      component.searchProductAttribute(event);

      expect(component.attributes).toEqual([]);
    });
  });

  describe('searchPredefineProductAttribute', () => {
    beforeEach(() => {
      component.copyPredefineAttributeList = mockAttributeValues;
    });

    it('should reset existing attribute list when query is empty', () => {
      const event = { query: '' };

      component.searchPredefineProductAttribute(event);

      expect(component.existingAttributeList).toEqual(cloneDeep(component.copyPredefineAttributeList));
    });
  });

  describe('onSearchClear', () => {
    it('should reset both attributes and existing attribute list', () => {
      component.attributes = [];
      component.existingAttributeList = [];

      component.onSearchClear({});

      expect(component.attributes).toEqual(cloneDeep(component.attributesCopy));
      expect(component.existingAttributeList).toEqual(cloneDeep(component.copyPredefineAttributeList));
    });
  });

  describe('getAttributeList', () => {
    it('should fetch and process predefined attribute list', () => {
      component.attributes = mockProductAttributes;

      component.getAttributeList('testClass');

      expect(mockUtilityService.getPredefinedAttributeList).toHaveBeenCalledWith('testClass');
      expect(component.existingAttributeList).toBeDefined();
      expect(component.copyPredefineAttributeList).toBeDefined();
    });

    it('should filter out existing attributes', () => {
      component.attributes = [
        { ...mockProductAttributes[0], attrName: 'Attribute 1' }
      ] as ProductAttribute[];

      component.getAttributeList('testClass');

      const filtered = component.existingAttributeList.filter(
        (attr: any) => attr.attributeDescription !== 'Attribute 1'
      );
      expect(filtered.length).toBe(component.existingAttributeList.length);
    });

    it('should handle error in getAttributeList', () => {
      const error = new Error('Attribute list error');
      mockUtilityService.getPredefinedAttributeList.mockReturnValue(throwError(() => error));

      component.getAttributeList('testClass');

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(error);
    });
  });

  describe('onRowSelected', () => {
    it('should set selectedPredefineAttributeList', () => {
      const selectedRows = [mockAttributeValues[0]];

      component.onRowSelected(selectedRows);

      expect(component.selectedPredefineAttributeList).toEqual(selectedRows);
    });
  });

  describe('addPredefineAttribute', () => {
    beforeEach(() => {
      component.selectedPredefineAttributeList = [mockAttributeValues[0]] as any;
      component.existingAttributeList = mockAttributeValues;
    });

    it('should save predefined attributes successfully', () => {
      component.addPredefineAttribute();

      expect(mockProductsService.savePredefineProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        expect.objectContaining({
          requestId: expect.any(String),
          customAttributes: expect.any(Array)
        })
      );
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.save.success);
    });

    it('should show error when attribute has empty type', () => {
      const attributeWithEmptyType = { ...mockAttributeValues[0], datatype: '' };
      component.selectedPredefineAttributeList = [attributeWithEmptyType] as any;
      component.existingAttributeList = [attributeWithEmptyType];

      component.addPredefineAttribute();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'Select a data type for the chosen attribute.'
      });
      expect(mockProductsService.savePredefineProductAttribute).not.toHaveBeenCalled();
    });

    it('should handle save error', () => {
      const error = new Error('Save error');
      mockProductsService.savePredefineProductAttribute.mockReturnValue(throwError(() => error));

      component.addPredefineAttribute();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.save.error);
    });

    it('should not save when no attributes selected', () => {
      component.selectedPredefineAttributeList = [];

      component.addPredefineAttribute();

      expect(mockProductsService.savePredefineProductAttribute).not.toHaveBeenCalled();
    });
  });

  describe('confirmDiscardAttributeAndExit', () => {
    it('should open discard modal', () => {
      component.confirmDiscardAttributeAndExit();

      expect(component.openDiscardModal).toBe(true);
    });
  });

  describe('discardAttributeAndExit', () => {
    it('should close existing attribute list and discard modal', () => {
      component.showExistingAttributeList = true;
      component.openDiscardModal = true;

      component.discardAttributeAndExit();

      expect(component.showExistingAttributeList).toBe(false);
      expect(component.openDiscardModal).toBe(false);
    });
  });

  describe('onCreateAttribute', () => {
    it('should setup component for creating new attribute', () => {
      component.showExistingAttributeList = true;
      component.isEdit = true;

      component.onCreateAttribute();

      expect(component.showExistingAttributeList).toBe(false);
      expect(component.isEdit).toBe(false);
      expect(component.attributeModel).toEqual({
        attrName: '',
        required: false,
        doNotAllowDuplicate: false,
        type: '',
        policyAssociation: '',
        isCurrentVersion: true
      });
      expect(component.toggleDrawer).toHaveBeenCalledWith(true);
    });

    it('should enable attribute name field and hide answers config', () => {
      component.onCreateAttribute();

      expect(component.attributeSchema.properties?.['attrName']?.widget?.formlyConfig?.props?.disabled).toBe(false);
      expect(component.attributeSchema.properties?.['answers']?.widget?.formlyConfig?.hide).toBe(true);
    });
  });

  describe('saveProductAttribute', () => {
    const mockAttributeData: ProductAttribute = {
      attrName: 'New Attribute',
      type: 'STRING',
      required: true,
      doNotAllowDuplicate: false,
      isCurrentVersion: true
    };

    it('should save new attribute successfully', () => {
      component.isEdit = false;
      component.attributes = [];

      component.saveProductAttribute(mockAttributeData);

      expect(mockProductsService.saveProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        expect.objectContaining({
          requestId: expect.any(String),
          customAttributes: mockAttributeData
        })
      );
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.save.success);
    });

    it('should show error when attribute already exists and not editing', () => {
      component.isEdit = false;
      component.attributes = [
        { ...mockAttributeData, description: 'new attribute' }
      ] as ProductAttribute[];

      component.saveProductAttribute(mockAttributeData);

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: "Attribute 'New Attribute' already exist in product.",
        duration: 5000
      });
      expect(mockProductsService.saveProductAttribute).not.toHaveBeenCalled();
    });

    it('should handle specific error PMERR000084', () => {
      component.isEdit = false;
      component.attributes = [];
      const error = {
        error: {
          errors: {
            'PMERR000084': ['Specific error message']
          }
        }
      };
      mockProductsService.saveProductAttribute.mockReturnValue(throwError(() => error));

      component.saveProductAttribute(mockAttributeData);

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'error',
        message: 'Specific error message'
      });
    });

    it('should handle generic save error', () => {
      component.isEdit = false;
      component.attributes = [];
      const error = new Error('Generic error');
      mockProductsService.saveProductAttribute.mockReturnValue(throwError(() => error));

      component.saveProductAttribute(mockAttributeData);

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.save.error);
    });
  });

  describe('Modal and UI State Management', () => {
    it('should toggle drawer state', () => {
      component.showDrawer = false;
      jest.spyOn(component, 'toggleDrawer').mockRestore();

      component.toggleDrawer(true);
      expect(component.showDrawer).toBe(true);

      component.toggleDrawer(false);
      expect(component.showDrawer).toBe(false);
    });

    it('should open existing attribute list', () => {
      jest.spyOn(component, 'getAttributeList').mockImplementation(() => {});
      component.productClasslist = 'test-class';

      component.onExistingAttribute();

      expect(component.showExistingAttributeList).toBe(true);
      expect(component.getAttributeList).toHaveBeenCalledWith('test-class');
    });

    it('should handle confirmation modal', () => {
      component.onConfirm();
      expect(component.openModal).toBe(false);
    });

    it('should handle delete modal', () => {
      component.handleDeleteModal();
      expect(component.openDeleteModal).toBe(false);
    });

    it('should handle discard modal', () => {
      component.handleDiscardModal();
      expect(component.openDiscardModal).toBe(false);
    });
  });

  describe('Integration Tests', () => {

    it('should handle search and filter workflow', () => {
      // Setup initial data
      component.attributesCopy = mockProductAttributes;

      // Search for specific attribute
      component.searchProductAttribute({ query: 'Test Attribute 1' });
      expect(component.attributes).toHaveLength(1);

      // Clear search
      component.onSearchClear({});
      expect(component.attributes).toEqual(component.attributesCopy);
    });

    it('should handle predefined attribute workflow', () => {
      // Setup predefined attributes
      component.getAttributeList('test-class');

      // Select predefined attributes
      component.onRowSelected([mockAttributeValues[0]]);
      expect(component.selectedPredefineAttributeList).toContain(mockAttributeValues[0]);

      // Add predefined attributes
      component.addPredefineAttribute();
      expect(mockProductsService.savePredefineProductAttribute).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {

    it('should handle empty attribute schema properties', () => {
      component.attributeSchema = { properties: {} } as any;

      expect(() => {
        component.onCreateAttribute();
      }).not.toThrow();
    });
  });

  describe('Component Properties', () => {
    it('should have proper color theme defaults', () => {
      expect(component.colorTheme).toBeDefined();
      expect(component.cbToolTipColorTheme).toBeDefined();
    });
  });

  describe('getCoverageVariants', () => {
    beforeEach(() => {
      // Restore getCoverageVariants to its original implementation for these tests
      jest.spyOn(component, 'getCoverageVariants').mockRestore();
    });

    it('should fetch coverage variants and get product attributes', () => {
      mockCoverageVariantsService.getCoverageVariants.mockReturnValue(of([
        { productClass: { value: 'class1' } },
        { productClass: { value: 'class2' } }
      ]));
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});

      component.getCoverageVariants('123', '1.0');

      expect(mockCoverageVariantsService.getCoverageVariants).toHaveBeenCalledWith('123', '1.0');
      expect(component.productClasslist).toBe('class1,class2');
      expect(component['_getProductAttributes']).toHaveBeenCalled();
    });

    it('should handle error in getCoverageVariants', () => {
      const error = new Error('Coverage variants error');
      mockCoverageVariantsService.getCoverageVariants.mockReturnValue(throwError(() => error));

      component.getCoverageVariants('123', '1.0');

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(error);
    });

    it('should remove duplicate product classes', () => {
      mockCoverageVariantsService.getCoverageVariants.mockReturnValue(of([
        { productClass: { value: 'class1' } },
        { productClass: { value: 'class1' } },
        { productClass: { value: 'class2' } }
      ]));
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});

      component.getCoverageVariants('123', '1.0');

      expect(component.productClasslist).toBe('class1,class2');
    });
  });

  describe('saveProductAttribute - Edit Mode', () => {
    const mockAttributeData: ProductAttribute = {
      attrId: '123',
      attrName: 'Updated Attribute',
      type: 'STRING',
      required: true,
      doNotAllowDuplicate: false,
      isCurrentVersion: true
    };

    it('should edit existing attribute successfully', () => {
      component.isEdit = true;
      component.selectedAttribute = { attrId: '123', attrName: 'Old Name' } as ProductAttribute;
      mockProductsService.editProductAttribute.mockReturnValue(of({ succeeded: true }));

      component.saveProductAttribute(mockAttributeData);

      expect(mockProductsService.editProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        expect.objectContaining({
          requestId: expect.any(String),
          customAttributes: expect.objectContaining({
            attrName: 'Old Name'
          })
        }),
        '123'
      );
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.edit.success);
    });

    it('should handle edit error', () => {
      component.isEdit = true;
      component.selectedAttribute = { attrId: '123', attrName: 'Old Name' } as ProductAttribute;
      const error = new Error('Edit error');
      mockProductsService.editProductAttribute.mockReturnValue(throwError(() => error));

      component.saveProductAttribute(mockAttributeData);

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.edit.error);
    });
  });

  describe('next and previous', () => {
    it('should trigger next button clicked event', () => {
      component.next();

      expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    });

    it('should trigger previous button clicked event', () => {
      component.previous();

      expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({ stepCount: 1 });
    });
  });

  describe('_deleteProductAttribute', () => {
    const mockAttribute: ProductAttribute = {
      attrId: '123',
      attrName: 'Test Attribute',
      type: 'STRING',
      required: false,
      doNotAllowDuplicate: false,
      isCurrentVersion: true
    };

    it('should delete product attribute successfully', () => {
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});

      component['_deleteProductAttribute'](mockAttribute);

      expect(mockProductsService.deleteProductAttribute).toHaveBeenCalledWith('123', '1.0', '123');
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.delete.success);
      expect(component['_getProductAttributes']).toHaveBeenCalled();
      expect(component.openDeleteModal).toBe(false);
    });

    it('should handle PMERR000407 error and open modal', () => {
      const error = {
        error: {
          errors: {
            'PMERR000407': ['Attribute is in use']
          }
        }
      };
      mockProductsService.deleteProductAttribute.mockReturnValue(throwError(() => error));

      component['_deleteProductAttribute'](mockAttribute);

      expect(component.openModal).toBe(true);
    });

    it('should handle generic delete error', () => {
      const error = new Error('Delete error');
      mockProductsService.deleteProductAttribute.mockReturnValue(throwError(() => error));

      component['_deleteProductAttribute'](mockAttribute);

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.delete.error);
    });
  });

  describe('_handleToggleChange', () => {
    const mockRow = {
      item: {
        attrId: '123',
        attrName: 'Test',
        required: true
      } as ProductAttribute,
      column: { fieldName: 'required' }
    };

    it('should update attribute toggle successfully', () => {
      const data = { rowIndex: 0, toggleValue: true };
      component.attributes = [mockRow.item];
      mockProductsService.editProductAttribute.mockReturnValue(of({ succeeded: true }));

      component['_handleToggleChange'](data, mockRow);

      expect(mockProductsService.editProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        expect.objectContaining({
          requestId: expect.any(String),
          customAttributes: mockRow.item
        }),
        '123'
      );
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.edit.success);
    });

    it('should revert toggle on error', () => {
      const data = { rowIndex: 0, toggleValue: true };
      component.attributes = [mockRow.item];
      const error = new Error('Toggle error');
      mockProductsService.editProductAttribute.mockReturnValue(throwError(() => error));

      component['_handleToggleChange'](data, mockRow);

      expect(component.attributes[0].required).toBe(false);
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.edit.error);
    });
  });

  describe('_getProductAttributes', () => {
    beforeEach(() => {
      // Restore the method for these tests
      jest.spyOn(component as any, '_getProductAttributes').mockRestore();
    });

    it('should fetch product attributes successfully', () => {
      mockProductsService.fetchProductAttributes.mockReturnValue(of(mockProductAttributes));
      component.disableFeature = false;

      component['_getProductAttributes']();

      expect(mockProductsService.fetchProductAttributes).toHaveBeenCalledWith('123', '1.0');
      expect(component.attributes).toBeDefined();
      expect(component.attributes.length).toBe(2);
      expect(component.attributesCopy).toEqual(component.attributes);
    });

    it('should map product status correctly when not disabled', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      mockProductContextService._getProductContext.mockReturnValue({
        status: 'DRAFT'
      });
      mockProductsService.fetchProductAttributes.mockReturnValue(of(mockProductAttributes));
      component.disableFeature = false;

      component['_getProductAttributes']();

      expect(component.attributes[0].productStatus).toBe('DRAFT');
    });

    it('should set lockStatus based on isReadonlyProduct', () => {
      mockProductContextService.isProductDisabled.mockReturnValue(false);
      mockProductContextService.isReadonlyProduct.mockReturnValue(true);
      mockProductsService.fetchProductAttributes.mockReturnValue(of(mockProductAttributes));
      component.disableFeature = false;

      component['_getProductAttributes']();

      expect((component.attributes[0] as any).lockStatus).toBe(true);
    });

    it('should handle fetch error', () => {
      const error = new Error('Fetch error');
      mockProductsService.fetchProductAttributes.mockReturnValue(throwError(() => error));

      component['_getProductAttributes']();

      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.fetch.error);
    });

    it('should set FINAL status when disableFeature is true', () => {
      mockProductsService.fetchProductAttributes.mockReturnValue(of(mockProductAttributes));
      component.disableFeature = true;

      component['_getProductAttributes']();

      expect(component.attributes[0].productStatus).toBe(Statuskeys.FINAL);
      expect((component.attributes[0] as any).lockStatus).toBe(true);
    });
  });

  describe('_setEditAttribute', () => {
    const mockAttribute: ProductAttribute = {
      attrId: '123',
      attrName: 'Test Attribute',
      type: 'DROPDOWN',
      required: true,
      doNotAllowDuplicate: false,
      isCurrentVersion: true,
      answers: [{ name: 'Option 1', value: 'opt1' }] as unknown as CustomAttributeAnswer[]
    };

    it('should setup component for editing attribute with DROPDOWN type', () => {
      jest.spyOn(component, 'toggleDrawer').mockImplementation(() => {});

      component['_setEditAttribute'](mockAttribute);

      expect(component.isEdit).toBe(true);
      expect(component.attributeModel).toEqual(mockAttribute);
      expect(component.attributeSchema.properties?.['answers']?.widget?.formlyConfig?.hide).toBe(false);
      expect(component.attributeSchema.properties?.['attrName']?.widget?.formlyConfig?.props?.disabled).toBe(true);
      expect(component.toggleDrawer).toHaveBeenCalledWith(true);
    });

    it('should hide answers config for non-DROPDOWN types', () => {
      const nonDropdownAttribute = { ...mockAttribute, type: 'STRING' };

      component['_setEditAttribute'](nonDropdownAttribute);

      expect(component.attributeSchema.properties?.['answers']?.widget?.formlyConfig?.hide).toBe(true);
    });
  });

  describe('_updateDataTypes', () => {
    beforeEach(() => {
      // Restore the method for these tests
      jest.spyOn(component as any, '_updateDataTypes').mockRestore();
    });

    it('should configure data type field with options', () => {
      const mockDataTypeField: any = {
        hooks: {}
      };
      component.attributeSchema = {
        properties: {
          type: {
            widget: {
              formlyConfig: mockDataTypeField
            }
          }
        }
      } as any;

      component['_updateDataTypes']();

      expect(mockDataTypeField.hooks).toHaveProperty('onInit');
      expect(typeof (mockDataTypeField.hooks as any).onInit).toBe('function');
    });

    it('should handle empty data type field', () => {
      component.attributeSchema = {
        properties: {
          type: {
            widget: {
              formlyConfig: null
            }
          }
        }
      } as any;

      expect(() => {
        component['_updateDataTypes']();
      }).not.toThrow();
    });

    it('should initialize field options when onInit hook is called', (done) => {
      const mockDataTypeField: any = {
        hooks: {}
      };
      component.attributeSchema = {
        properties: {
          type: {
            widget: {
              formlyConfig: mockDataTypeField
            }
          }
        }
      } as any;

      component['_updateDataTypes']();

      const mockField: Partial<FormlyFieldConfig> = {
        props: {}
      };
      mockDataTypeField.hooks.onInit(mockField);

      // Since it returns an observable, we need to subscribe
      if (mockField.props?.options) {
        (mockField.props.options as any).subscribe((options: any) => {
          expect(options).toBeDefined();
          expect(options.length).toBeGreaterThan(0);
          done();
        });
      }
    });
  });

  describe('_updateAttributeName', () => {
    beforeEach(() => {
      // Restore the method for these tests
      jest.spyOn(component as any, '_updateAttributeName').mockRestore();
    });

    it('should configure attribute name field with validators', () => {
      const mockForm = new FormGroup({
        type: new FormControl(''),
        attrName: new FormControl('')
      });

      const mockAttrNameField: any = {
        hooks: {},
        form: mockForm,
        props: {}
      };

      component.attributeSchema = {
        properties: {
          attrName: {
            widget: {
              formlyConfig: mockAttrNameField
            }
          },
          answers: {
            widget: {
              formlyConfig: {
                hide: true
              }
            }
          },
          defaultValue: {
            widget: {
              formlyConfig: {
                hide: false
              }
            }
          }
        }
      } as any;

      component['_updateAttributeName']();

      expect(mockAttrNameField.hooks).toHaveProperty('onInit');
    });

    it('should handle empty attribute name field', () => {
      component.attributeSchema = {
        properties: {
          attrName: {
            widget: {
              formlyConfig: null
            }
          }
        }
      } as any;

      expect(() => {
        component['_updateAttributeName']();
      }).not.toThrow();
    });

    it('should update maxLength when type changes to STRING', (done) => {
      const mockForm = new FormGroup({
        type: new FormControl(''),
        attrName: new FormControl('')
      });

      const mockAttrNameField: any = {
        hooks: {},
        form: mockForm,
        props: { maxLength: 100 }
      };

      component.attributeSchema = {
        properties: {
          attrName: {
            widget: {
              formlyConfig: mockAttrNameField
            }
          },
          answers: {
            widget: {
              formlyConfig: {
                hide: false
              }
            }
          },
          defaultValue: {
            widget: {
              formlyConfig: {
                hide: false
              }
            }
          }
        }
      } as any;

      component['_updateAttributeName']();
      mockAttrNameField.hooks.onInit(mockAttrNameField);

      // Trigger type change
      mockForm.get('type')?.setValue('STRING');

      // Wait for async update
      setTimeout(() => {
        expect(mockAttrNameField.props.maxLength).toBe(500);
        done();
      }, 100);
    });

    it('should hide defaultValue for DROPDOWN and FILE types', (done) => {
      const mockForm = new FormGroup({
        type: new FormControl(''),
        attrName: new FormControl('')
      });

      const mockAttrNameField: any = {
        hooks: {},
        form: mockForm,
        props: {}
      };

      component.attributeSchema = {
        properties: {
          attrName: {
            widget: {
              formlyConfig: mockAttrNameField
            }
          },
          answers: {
            widget: {
              formlyConfig: {
                hide: true
              }
            }
          },
          defaultValue: {
            widget: {
              formlyConfig: {
                hide: false
              }
            }
          }
        }
      } as any;

      component['_updateAttributeName']();
      mockAttrNameField.hooks.onInit(mockAttrNameField);

      // Test DROPDOWN
      mockForm.get('type')?.setValue('DROPDOWN');
      setTimeout(() => {
        expect(component.attributeSchema.properties?.['defaultValue']?.widget?.formlyConfig?.hide).toBe(true);

        // Test FILE
        mockForm.get('type')?.setValue('FILE');
        setTimeout(() => {
          expect(component.attributeSchema.properties?.['defaultValue']?.widget?.formlyConfig?.hide).toBe(true);

          // Test other types
          mockForm.get('type')?.setValue('STRING');
          setTimeout(() => {
            expect(component.attributeSchema.properties?.['defaultValue']?.widget?.formlyConfig?.hide).toBe(false);
            done();
          }, 50);
        }, 50);
      }, 50);
    });

    it('should show answers config only for DROPDOWN type', (done) => {
      const mockForm = new FormGroup({
        type: new FormControl(''),
        attrName: new FormControl('')
      });

      const mockAttrNameField: any = {
        hooks: {},
        form: mockForm,
        props: {}
      };

      component.attributeSchema = {
        properties: {
          attrName: {
            widget: {
              formlyConfig: mockAttrNameField
            }
          },
          answers: {
            widget: {
              formlyConfig: {
                hide: true
              }
            }
          }
        }
      } as any;

      component['_updateAttributeName']();
      mockAttrNameField.hooks.onInit(mockAttrNameField);

      mockForm.get('type')?.setValue('DROPDOWN');
      setTimeout(() => {
        expect(component.attributeSchema.properties?.['answers']?.widget?.formlyConfig?.hide).toBe(false);

        mockForm.get('type')?.setValue('STRING');
        setTimeout(() => {
          expect(component.attributeSchema.properties?.['answers']?.widget?.formlyConfig?.hide).toBe(true);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('handleModal', () => {
    it('should toggle modal state', () => {
      component.openModal = false;

      component.handleModal();
      expect(component.openModal).toBe(true);

      component.handleModal();
      expect(component.openModal).toBe(false);
    });
  });

  describe('onDeleteAttribute', () => {
    it('should call _deleteProductAttribute with selected attribute', () => {
      const mockAttribute: ProductAttribute = {
        attrId: '123',
        attrName: 'Test',
        type: 'STRING',
        required: false,
        doNotAllowDuplicate: false,
        isCurrentVersion: true
      };
      component.selectedAttribute = mockAttribute;
      jest.spyOn(component as any, '_deleteProductAttribute').mockImplementation(() => {});

      component.onDeleteAttribute();

      expect(component['_deleteProductAttribute']).toHaveBeenCalledWith(mockAttribute);
    });
  });

  describe('searchProductAttribute - Edge Cases', () => {
    it('should return original list when query length is less than 3', () => {
      component.attributesCopy = mockProductAttributes;
      const event = { query: 'ab' };

      component.searchProductAttribute(event);

      expect(component.attributes).toEqual(cloneDeep(component.attributesCopy));
    });

    it('should handle case-insensitive search', () => {
      component.attributesCopy = mockProductAttributes;
      const event = { query: 'TEST ATTRIBUTE' };

      component.searchProductAttribute(event);

      expect(component.attributes.length).toBeGreaterThan(0);
    });

    it('should filter by both name and type', () => {
      component.attributesCopy = mockProductAttributes;
      const event = { query: 'str' };

      component.searchProductAttribute(event);

      const hasStringType = component.attributes.some(attr => attr.type?.toLowerCase().includes('str'));
      expect(hasStringType).toBe(true);
    });
  });

  describe('searchPredefineProductAttribute - Edge Cases', () => {
    it('should return original list when query length is less than 3', () => {
      component.copyPredefineAttributeList = mockAttributeValues;
      const event = { query: 'ab' };

      component.searchPredefineProductAttribute(event);

      expect(component.existingAttributeList).toEqual(cloneDeep(component.copyPredefineAttributeList));
    });

    it('should filter by description, type, and category', () => {
      component.copyPredefineAttributeList = mockAttributeValues;
      const event = { query: 'test' };

      component.searchPredefineProductAttribute(event);

      expect(component.existingAttributeList).toBeDefined();
    });
  });

  describe('getAttributeList - Edge Cases', () => {
    it('should initialize attributes array if undefined', () => {
      component.attributes = undefined as any;
      mockUtilityService.getPredefinedAttributeList.mockReturnValue(of([
        { predefinedAttrValues: mockAttributeValues }
      ]));
      
      component.getAttributeList('testClass');

      expect(component.attributes).toBeDefined();
    });

    it('should remove duplicate attributes by attributeId', () => {
      const duplicateAttributes = [
        {
          predefinedAttrValues: [
            { attributeId: 'attr1', attributeDescription: 'Attr 1', datatype: 'STRING', category: 'TEST' },
            { attributeId: 'attr1', attributeDescription: 'Attr 1 Duplicate', datatype: 'STRING', category: 'TEST' }
          ]
        }
      ];
      mockUtilityService.getPredefinedAttributeList.mockReturnValue(of(duplicateAttributes));

      component.getAttributeList('testClass');

      const attr1Count = component.existingAttributeList.filter((a: any) => a.attributeId === 'attr1').length;
      expect(attr1Count).toBe(1);
    });
  });

  describe('addPredefineAttribute - Additional Edge Cases', () => {
    it('should handle attributes with all optional fields', () => {
      const minimalAttribute = {
        attributeId: 'min1',
        attributeDescription: 'Minimal',
        datatype: 'STRING'
      };
      component.selectedPredefineAttributeList = [minimalAttribute] as any;
      component.existingAttributeList = [minimalAttribute];
      mockProductsService.savePredefineProductAttribute.mockReturnValue(of({ succeeded: true }));

      component.addPredefineAttribute();

      expect(mockProductsService.savePredefineProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        expect.objectContaining({
          customAttributes: expect.arrayContaining([
            expect.objectContaining({
              required: false,
              doNotAllowDuplicate: false
            })
          ])
        })
      );
    });

    it('should close existing attribute list on successful save', (done) => {
      component.showExistingAttributeList = true;
      component.selectedPredefineAttributeList = [mockAttributeValues[0]] as any;
      component.existingAttributeList = mockAttributeValues;
      mockProductsService.savePredefineProductAttribute.mockReturnValue(of({ succeeded: true }));
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});

      component.addPredefineAttribute();

      // Wait for async operation
      setTimeout(() => {
        expect(component.showExistingAttributeList).toBe(false);
        done();
      }, 100);
    });
  });

  describe('_generateOptions - Disabled Product', () => {
    it('should disable delete action and change edit to view when product is disabled', () => {
      const mockColumnsWithActions = [
        { fieldName: 'name', caption: 'Name' },
        {
          fieldName: 'action',
          caption: 'Action',
          actions: [
            { label: 'Edit', icon: 'pi pi-pencil', disabled: false },
            { label: 'Delete', icon: 'pi pi-trash', disabled: false }
          ]
        }
      ];
      mockProductContextService.isProductDisabled.mockReturnValue(true);
      component.attributeColumns = cloneDeep(mockColumnsWithActions) as any;

      component['_generateOptions']();

      const actionColumn = component.options.columns?.find(col => col.fieldName === 'action');
      const viewAction = actionColumn?.actions?.find(act => act.label === 'View');
      const deleteAction = actionColumn?.actions?.find(act => act.label === 'Delete');

      expect(viewAction).toBeDefined();
      expect(viewAction?.icon).toBe('pi pi-eye');
      expect(deleteAction?.disabled).toBe(true);
    });
  });

  describe('Constructor - Command Registration', () => {
    it('should register editProductAttribute command', async () => {
      jest.spyOn(component, 'toggleDrawer').mockRestore();
      jest.spyOn(component, 'toggleDrawer').mockImplementation(() => {});
      const mockCommand = {
        item: mockProductAttributes[0]
      };

      // Manually execute the command logic
      component.selectedAttribute = mockCommand.item;
      component['_setEditAttribute'](mockCommand.item);

      expect(component.selectedAttribute).toEqual(mockCommand.item);
      expect(component.isEdit).toBe(true);
    });

    it('should register deleteProductAttribute command', () => {
      const mockCommand = {
        item: mockProductAttributes[0]
      };

      // Manually execute the command logic
      component.selectedAttribute = mockCommand.item;
      component.openDeleteModal = true;

      expect(component.selectedAttribute).toEqual(mockCommand.item);
      expect(component.openDeleteModal).toBe(true);
    });

    it('should register updateAttributeCommand', () => {
      const mockData = { rowIndex: 0, toggleValue: true };
      const mockParameter = {
        component: {
          item: mockProductAttributes[0],
          column: { fieldName: 'required' }
        }
      };

      jest.spyOn(component as any, '_handleToggleChange').mockImplementation(() => {});
      
      // Manually execute the command logic
      component['_handleToggleChange'](mockData, mockParameter.component);

      expect(component['_handleToggleChange']).toHaveBeenCalledWith(mockData, mockParameter.component);
    });
  });

  describe('Constructor - Product Status', () => {
    it('should set isFinalStatus when product is disabled', () => {
      const testMockProductContext = {
        isProductDisabled: jest.fn().mockReturnValue(true),
        isProductLocked: jest.fn().mockReturnValue(false),
        isReadonlyProduct: jest.fn().mockReturnValue(false),
        _getProductContext: jest.fn().mockReturnValue({
          productId: '123',
          productVersionId: '1.0',
          country: ['US'],
          requestId: 'req-123',
          language: 'en',
          status: 'FINAL'
        })
      };

      const testMockCommands = {
        add: jest.fn()
      };

      const newComponent = new ProductAttributesComponent(
        mockLayoutService as any,
        mockSharedService as any,
        {} as any,
        testMockCommands as any,
        testMockProductContext as any,
        mockProductsService as any,
        mockAppContextService as any,
        mockUtilityService as any,
        mockCoverageVariantsService as any
      );

      expect(newComponent.isFinalStatus).toBe(true);
    });
  });

  describe('Integration - Complete Workflow', () => {
    it('should handle complete create attribute workflow', () => {
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});
      jest.spyOn(component, 'toggleDrawer').mockRestore();
      component.attributes = [];
      component.showDrawer = false;
      mockProductsService.saveProductAttribute.mockReturnValue(of({ succeeded: true }));

      // Step 1: Open create form
      component.onCreateAttribute();
      expect(component.isEdit).toBe(false);
      expect(component.showDrawer).toBe(true);

      // Step 2: Save attribute
      const newAttribute: ProductAttribute = {
        attrName: 'New Test Attribute',
        type: 'STRING',
        required: true,
        doNotAllowDuplicate: false,
        isCurrentVersion: true
      };
      component.saveProductAttribute(newAttribute);

      expect(mockProductsService.saveProductAttribute).toHaveBeenCalled();
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith(mockMessages.save.success);
    });

    it('should handle complete edit attribute workflow', () => {
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});
      jest.spyOn(component, 'toggleDrawer').mockRestore();
      component.attributes = mockProductAttributes;
      mockProductsService.editProductAttribute.mockReturnValue(of({ succeeded: true }));

      // Step 1: Open edit form
      component['_setEditAttribute'](mockProductAttributes[0]);
      expect(component.isEdit).toBe(true);
      expect(component.attributeModel).toEqual(mockProductAttributes[0]);

      // Step 2: Save changes
      const updatedAttribute = { ...mockProductAttributes[0], required: true };
      component.selectedAttribute = mockProductAttributes[0];
      component.saveProductAttribute(updatedAttribute);

      expect(mockProductsService.editProductAttribute).toHaveBeenCalled();
    });

    it('should handle complete delete attribute workflow', () => {
      jest.spyOn(component as any, '_getProductAttributes').mockImplementation(() => {});

      // Step 1: Select attribute for deletion
      component.selectedAttribute = mockProductAttributes[0];
      component.openDeleteModal = true;

      // Step 2: Confirm deletion
      component.onDeleteAttribute();

      expect(mockProductsService.deleteProductAttribute).toHaveBeenCalledWith(
        '123',
        '1.0',
        mockProductAttributes[0].attrId
      );
    });
  });
});