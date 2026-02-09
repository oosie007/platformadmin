import { StudioCommands } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import { Router } from '@angular/router';
import { MenuService, TableService } from '@canvas/services';
import { SharedService } from '../../../services/shared.service';
import { ExclusionService } from '../../../services/exclusion.service';
import { ProductContextService } from '../../../services/product-context.service';
import { of } from 'rxjs';
import { ExclusionComponent } from './exclusion.component';
import { cloneDeep } from 'lodash-es';

if (!global.crypto) {
  (global as any).crypto = {};
}
(global.crypto as any).randomUUID = jest.fn(() => 'mock-uuid');

const mockExclusionColumns = [
  {
    fieldName: '',
    actions: [
      { label: 'Edit', icon: 'edit-icon' },
      { label: 'Delete', icon: 'delete-icon' }
    ]
  },
  {
    fieldName: 'other',
    actions: [
      { label: 'Edit', icon: 'edit-icon' }
    ]
  }
];

jest.mock('../../../types/exclusions-columns', () => ({
  ExclusionColumns: [
    {
      fieldName: '',
      actions: [
        { label: 'Edit', icon: 'edit-icon' },
        { label: 'Delete', icon: 'delete-icon' }
      ]
    },
    {
      fieldName: 'other',
      actions: [
        { label: 'Edit', icon: 'edit-icon' }
      ]
    }
  ]
}));
describe('ExclusionComponent', () => {
  let component: ExclusionComponent;
  let mockCommandsService: any;
  let mockLayoutService: any;
  let mockRouter: any;
  let mockMenuService: any;
  let mockSharedService: any;
  let mockTableService: any;
  let mockExclusionService: any;
  let mockProductContextService: any;

  beforeEach(() => {
    mockCommandsService = { add: jest.fn(),  execute: jest.fn().mockResolvedValue(true)};
    mockLayoutService = {
      updateBreadcrumbs: jest.fn(),
      showMessage: jest.fn(),
      caption$: { next: jest.fn() },
    };
    mockRouter = { navigate: jest.fn() };
    mockMenuService = { closeMenu: jest.fn() };
    mockSharedService = {
      nextButtonClicked: { next: jest.fn() },
      previousButtonClicked: { next: jest.fn() },
    };
    mockTableService = { nativeSortWithFavoritesPriority: jest.fn() };
    mockExclusionService = {
      getexclusions: jest.fn().mockReturnValue(of([])),
      getExclusionbyId: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
      deleteExclusion: jest.fn(),
      createExclusion: jest.fn(),
      updateExclusion: jest.fn(),
    };
    mockProductContextService = {
      _getProductContext: jest
        .fn()
        .mockReturnValue({ country: ['IE'], language: 'en', requestId: null }),
      isProductDisabled: jest.fn().mockReturnValue(false),
      getToastMessage: jest.fn().mockReturnValue({ warning: 'Warning!' }),
    };

    // Set up localStorage mocks
    jest
      .spyOn(window.localStorage['__proto__'], 'getItem')
      .mockImplementation((key) => {
        if (key === 'productId') return '123';
        if (key === 'coverageVariantId') return '456';
        if (key === 'productVersionId') return '789';
        if (key === 'coverageVariantName') return 'TestCoverage';
        return null;
      });
    jest
      .spyOn(window.localStorage['__proto__'], 'setItem')
      .mockImplementation(() => {});

    component = new ExclusionComponent(
      mockCommandsService,
      mockLayoutService,
      mockRouter,
      mockMenuService,
      mockSharedService,
      mockTableService,
      mockExclusionService,
      mockProductContextService
    );

    component.getExclusionList = [
      {
        exclusionId: 'id1',
        description: 'desc1',
        type: 'type1',
        isCurrentVersion: true,
      },
      {
        exclusionId: 'id2',
        description: 'desc2',
        type: 'type2',
        isCurrentVersion: false,
      },
    ] as any;

    component.productId = 'prod123';
    component.coverageVariantId = 'cov456';
    component.productVersionId = 'ver789';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize product context and ids from localStorage', () => {
    expect(component.productId).toBe('prod123');
    expect(component.coverageVariantId).toBe('cov456');
    expect(component.productVersionId).toBe('ver789');
    expect(component.coverageVariantName).toBe('TestCoverage');
  });

  it('should call updateBreadcrumbs on _updateLayout', () => {
    component['_updateLayout']();
    expect(mockLayoutService.updateBreadcrumbs).toHaveBeenCalled();
    expect(mockLayoutService.caption$.next).toHaveBeenCalledWith('');
  });

  it('should toggle showCreateExclusion on toggleAddDrawer', () => {
    component.showCreateExclusion = false;
    component.toggleAddDrawer();
    expect(component.showCreateExclusion).toBe(true);
    component.toggleAddDrawer();
    expect(component.showCreateExclusion).toBe(false);
  });

  it('should call showMessage with error if exclusion name is empty on onSubmitAdd', () => {
    component.onSubmitAdd({ name: '', description: '' });
    expect(mockLayoutService.showMessage).toHaveBeenCalled();
  });

  it('should call createExclusion and service methods on valid onSubmitAdd', () => {
    mockExclusionService.createExclusion.mockReturnValue(
      of({ data: { exclusionId: 'abc' } })
    );
    component.exclusionRequest = {
      type: 'test',
      description: 'desc',
      phrase: 'test',
      requestId: 'id',
      isCurrentVersion: true,
    };
    component.onSubmitAdd({ name: 'Test', description: 'Desc' });
    expect(mockExclusionService.createExclusion).toHaveBeenCalled();
  });

  it('should clear all fields on clearAll', () => {
    component.modelCreate = { name: 'test', description: 'desc' };
    component.modelEdit = { name: 'edit', description: 'editdesc' };
    component.clearAll();
    expect(component.modelCreate.name).toBe('');
    expect(component.modelCreate.description).toBe('');
    expect(component.modelEdit.name).toBe('');
    expect(component.modelEdit.description).toBe('');
  });

  it('should call router.navigate on saveAndExit', () => {
    component.saveAndExit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
  });

  it('should call showMessage with error if exclusion name is empty on onSubmitEdit', () => {
    component.onSubmitEdit({ name: '', description: '' });
    expect(mockLayoutService.showMessage).toHaveBeenCalled();
  });

  it('should call updateExclusion and service methods on valid onSubmitEdit', () => {
    mockExclusionService.updateExclusion.mockReturnValue(of({}));
    component.exclusionEditRequest = {
      type: 'test',
      description: 'desc',
      exclusionId: 'id',
      phrase: 'test',
      requestId: 'id',
      isCurrentVersion: true,
    };
    component.exclusionRequest = { isCurrentVersion: true } as any;
    component.productId = '123';
    component.coverageVariantId = '456';
    component.productVersionId = '789';
    component.exclusionId = 'id';
    component.onSubmitEdit({ name: 'Test', description: 'Desc' });
    expect(mockExclusionService.updateExclusion).toHaveBeenCalled();
  });

  it('should call delete and update exclusion list on deleteConfirmation', () => {
    component.deleteSelectedItem = { item: { exclusionId: 'id' } };
    component.getExclusionList = [
      {
        exclusionId: 'id',
        isCurrentVersion: true,
        type: '',
        description: '',
        phrase: '',
        requestId: '',
      },
    ];
    mockExclusionService.deleteExclusion.mockReturnValue(of({}));
    component.deleteConfirmation();
    expect(mockExclusionService.deleteExclusion).toHaveBeenCalled();
    expect(component.openDeleteModal).toBe(false);
  });

  it('should call getExclusions on ngOnInit', () => {
    mockExclusionService.getexclusions.mockReturnValue(of([]));
    component.ngOnInit();
    expect(mockExclusionService.getexclusions).toHaveBeenCalled();
  });

  it('should set editExclusionData and modelEdit fields for valid exclusion', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(false);
    component.getExclusionList = [
      {
        exclusionId: 'id1',
        description: 'desc1',
        type: 'type1',
        isCurrentVersion: true,
      },
    ] as any;
    const data = { item: { exclusionId: 'id1' } };
    component['_editExclusion'](data);
    const toggleSpy = jest.spyOn(component, 'toggleEditDrawer');
    expect(component.editExclusionData).toEqual({
      exclusionId: 'id1',
      description: 'desc1',
      type: 'type1',
      isCurrentVersion: true,
    });
    expect(component.modelEdit.description).toBe('desc1');
    expect(component.modelEdit.name).toBe('type1');
    expect(mockLayoutService.showMessage).not.toHaveBeenCalled();
  });

  it('should show warning if product is disabled', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    const data = { item: { exclusionId: 'id1' } };
    component['_editExclusion'](data);
    component.toggleEditDrawer = jest.fn();
    expect(component.editExclusionData).toEqual({
      exclusionId: 'id1',
      description: 'desc1',
      type: 'type1',
      isCurrentVersion: true,
    });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith('Warning!');
    expect(component.toggleEditDrawer).not.toHaveBeenCalled();
  });

  it('should show warning if exclusion is not current version', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(false);
    const data = { item: { exclusionId: 'id2' } };
    component['_editExclusion'](data);
    component.toggleEditDrawer = jest.fn();
    expect(component.editExclusionData).toEqual({
      exclusionId: 'id2',
      description: 'desc2',
      type: 'type2',
      isCurrentVersion: false,
    });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith('Warning!');
    expect(component.toggleEditDrawer).not.toHaveBeenCalled();
  });
  it('should call getExclusionbyId with correct parameters and set exclusionRequest', () => {
    const exclusionResponse = {
      exclusionId: 'excl1',
      type: 'TypeA',
      description: 'DescA',
    };
    mockExclusionService.getExclusionbyId.mockReturnValue(
      of(exclusionResponse)
    );

    component.getExclusionsbyId('excl1');

    expect(component.exclusionId).toBe('excl1');
    expect(mockExclusionService.getExclusionbyId).toHaveBeenCalledWith(
      'excl1',
      'prod123',
      'cov456',
      'ver789'
    );
  });

  it('should set exclusionRequest when observable emits', (done) => {
    const exclusionResponse = {
      exclusionId: 'excl2',
      type: 'TypeB',
      description: 'DescB',
    };
    mockExclusionService.getExclusionbyId.mockReturnValue(
      of(exclusionResponse)
    );

    component.getExclusionsbyId('excl2');

    // Wait for observable to emit
    setTimeout(() => {
      expect(component.exclusionRequest).toEqual(exclusionResponse);
      done();
    }, 0);
  });

  it('should call getExclusionsbyId and update modelEdit fields', () => {
    const data = {
      exclusionId: 'excl1',
      type: 'TypeA',
      description: 'DescA',
      isCurrentVersion: true,
    };
    const setItemSpy = jest.spyOn(window.localStorage['__proto__'], 'setItem');
    component.getExclusionsbyId = jest.fn();
    component.onSelectedRow(data as any);

    expect(component.getExclusionsbyId).toHaveBeenCalledWith('excl1');
    expect(setItemSpy).toHaveBeenCalledWith('exclusionId', 'excl1');
    expect(component.modelEdit.name).toBe('TypeA');
    expect(component.modelEdit.description).toBe('DescA');
  });

  it('should show warning if product is disabled', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    const data = {
      exclusionId: 'excl2',
      type: 'TypeB',
      description: 'DescB',
      isCurrentVersion: true,
    };
    component.toggleEditDrawer = jest.fn();
    component.onSelectedRow(data as any);

    expect(mockLayoutService.showMessage).toHaveBeenCalledWith('Warning!');
    expect(component.toggleEditDrawer).not.toHaveBeenCalled();
  });

  it('should show warning if exclusion is not current version', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(false);
    const data = {
      exclusionId: 'excl3',
      type: 'TypeC',
      description: 'DescC',
      isCurrentVersion: false,
    };
    component.toggleEditDrawer = jest.fn();
    component.onSelectedRow(data as any);

    expect(mockLayoutService.showMessage).toHaveBeenCalledWith('Warning!');
    expect(component.toggleEditDrawer).not.toHaveBeenCalled();
  });

  it('should toggle edit drawer if product is enabled and exclusion is current version', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(false);
    const data = {
      exclusionId: 'excl4',
      type: 'TypeD',
      description: 'DescD',
      isCurrentVersion: true,
    };
    component.toggleEditDrawer = jest.fn();
    component.onSelectedRow(data as any);

    expect(component.toggleEditDrawer).toHaveBeenCalled();
    expect(mockLayoutService.showMessage).not.toHaveBeenCalled();
  });

  it('should call nextButtonClicked.next with { stepCount: 1 }', () => {
    component.submit();
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({
      stepCount: 1,
    });
  });

  it('should call previousButtonClicked.next with { stepCount: 1 }', () => {
    component.previous();
    expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({
      stepCount: 1,
    });
  });

  it('should toggle showEditExclusion from false to true', () => {
    component.showEditExclusion = false;
    component.toggleEditDrawer();
    expect(component.showEditExclusion).toBe(true);
  });

  it('should toggle showEditExclusion from true to false', () => {
    component.showEditExclusion = true;
    component.toggleEditDrawer();
    expect(component.showEditExclusion).toBe(false);
  });

  it('should set openDeleteModal to false', () => {
    component.openDeleteModal = true;
    component.handleDeleteModal();
    expect(component.openDeleteModal).toBe(false);

    component.openDeleteModal = false;
    component.handleDeleteModal();
    expect(component.openDeleteModal).toBe(false);
  });

  it('should generate options with columns unchanged when disableEdit is false', () => {
    component.disableEdit = false;
    component['_generateOptions']();

    expect((component as any).options.showPaginator).toBe(true);
    expect((component as any).options.rowsPerPageOptions).toEqual([5, 10, 15, 20, 25]);
    expect((component as any).options.columns).toEqual(cloneDeep(mockExclusionColumns));
    expect(typeof (component as any).options.customSort).toBe('function');
  });

  it('should generate options with columns modified when disableEdit is true', () => {
    component.disableEdit = true;
    component['_generateOptions']();

    // Only the column with fieldName === '' should be modified
    const modifiedColumns = cloneDeep(mockExclusionColumns).map(col => {
      if (col.fieldName === '') {
        col.actions = col.actions.map(act => ({
          ...act,
          disabled: act.label === 'Delete',
          label: act.label === 'Edit' ? 'View' : act.label,
          icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon
        }));
      }
      return col;
    });

    expect((component as any).options.columns).toEqual(modifiedColumns);
  });

  it('should call nativeSortWithFavoritesPriority when customSort is invoked', () => {
    component.disableEdit = false;
    component['_generateOptions']();

    const event = { sortField: 'test' };
    (component as any).options.customSort(event);
    expect(mockTableService.nativeSortWithFavoritesPriority).toHaveBeenCalledWith(event);
  });

  it('should do nothing but close menu for edit-exclusions', () => {
    const event = { id: 'edit-exclusions', commandName: 'Edit', parameter: {} } as any;
    component.executeCommand(event);
    expect(mockCommandsService.execute).not.toHaveBeenCalled();
    expect(mockMenuService.closeMenu).toHaveBeenCalled();
  });

  it('should do nothing but close menu for delete-exclusions', () => {
    const event = { id: 'delete-exclusions', commandName: 'Delete', parameter: {} } as any;
    component.executeCommand(event);
    expect(mockCommandsService.execute).not.toHaveBeenCalled();
    expect(mockMenuService.closeMenu).toHaveBeenCalled();
  });

  it('should call commandsService.execute and close menu for other ids', () => {
    const event = { id: 'other', commandName: 'OtherCmd', parameter: { foo: 'bar' } } as any;
    component.executeCommand(event);
    expect(mockCommandsService.execute).toHaveBeenCalledWith('OtherCmd', {}, { foo: 'bar' });
    expect(mockMenuService.closeMenu).toHaveBeenCalled();
  });
});
