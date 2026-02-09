import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import { AppContextService, ComponentRegistry, TableService } from '@canvas/services';
import { AUTH_SETTINGS } from '@canvas/shared/data-access/auth';
import {
  COV001CoverageVariant,
  mockCoverageVariants,
} from 'apps/products/mock/mock-coverage-variant';
import { MessageService } from 'primeng/api';
import { of, Observable } from 'rxjs';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { CoverageVariantComponent } from './coverage-variant.component';

describe('CoverageVariantComponent', () => {
  let component: CoverageVariantComponent;
  let fixture: ComponentFixture<CoverageVariantComponent>;
  let mockComponentRegistry: Partial<ComponentRegistry>;
  let mockCoverageVariantService: jest.Mocked<CoverageVariantsService>;
  let mockRouter: jest.Mocked<Router>;
  let mockLayoutService: jest.Mocked<LayoutService>;
  let mockSharedService: jest.Mocked<SharedService>;
  let mockTableService: jest.Mocked<TableService>;
  let mockCommands: jest.Mocked<StudioCommands>;
  let mockProductContextService: jest.Mocked<ProductContextService>;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockProductsService: jest.Mocked<ProductsService>;

  beforeEach(() => {
    window.crypto.randomUUID = jest.fn();
    mockComponentRegistry = {
      add: jest.fn(),
    };

    mockCoverageVariantService = {
      getCoverageVariants: jest.fn().mockReturnValue(of(mockCoverageVariants)),
      updateCoverageVariantAllocation: jest.fn().mockReturnValue(of({})),
      createCoverageVariant: jest.fn().mockReturnValue(of({})),
      deleteCoverageVariant: jest.fn().mockReturnValue(of({})),
      updateCoverageVariant: jest
        .fn()
        .mockResolvedValue(of({})) as unknown as any,
    } as unknown as jest.Mocked<CoverageVariantsService>;

    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    const mockAppContextService = { get: jest.fn() };

    mockLayoutService = {
      caption$: { next: jest.fn() },
      updateBreadcrumbs: jest.fn(),
      showMessage: jest.fn(),
    } as unknown as jest.Mocked<LayoutService>;

    mockSharedService = {
      nextButtonClicked: { next: jest.fn() },
      previousButtonClicked: { next: jest.fn() },
    } as unknown as jest.Mocked<SharedService>;

    mockTableService = {
      nativeSortWithFavoritesPriority: jest.fn(),
    } as unknown as jest.Mocked<TableService>;

    mockCommands = {
      add: jest.fn(),
    } as unknown as jest.Mocked<StudioCommands>;

    mockProductContextService = {
      isProductDisabled: jest.fn().mockReturnValue(false),
      _setCoverageVariantId: jest.fn(),
    } as unknown as jest.Mocked<ProductContextService>;

    mockMessageService = {
      add: jest.fn(),
    } as unknown as jest.Mocked<MessageService>;

    mockProductsService = {
      getStepCount: jest.fn().mockReturnValue(5),
    } as unknown as jest.Mocked<ProductsService>;

    TestBed.configureTestingModule({
      imports: [CoverageVariantComponent],
      providers: [
        {
          provide: CoverageVariantsService,
          useValue: mockCoverageVariantService,
        },
        { provide: Router, useValue: mockRouter },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: TableService, useValue: mockTableService },
        { provide: StudioCommands, useValue: mockCommands },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: ComponentRegistry, useValue: mockComponentRegistry },
        { provide: AppContextService, useValue: mockAppContextService },
        {
          provide: AUTH_SETTINGS,
          useValue: {
            /* mock settings for testing */
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverageVariantComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with coverage variants', () => {
    component.ngOnInit();

    expect(component.coverageVariants).toEqual(mockCoverageVariants);
    expect(mockCoverageVariantService.getCoverageVariants).toHaveBeenCalledWith(
      component.productId,
      component.productVersionId
    );
  });

  it('should navigate to create coverage variant page', () => {
    component.createCoverageVariant();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      `/products/${component.productId}/coveragevariant/createcoveragevariant`,
    ]);
  });

  it('should handle search coverage variants', () => {
    component.coverageVariants = mockCoverageVariants;
    const event = { query: 'COV001' } as any;

    component.searchCoverageVariant(event);

    expect(component.filteredCoverageVariants).toEqual([COV001CoverageVariant]);
  });

  it('should toggle edit drawer', () => {
    component.showCloneCoverageVariant = false;
    // prime schema so the assignment path is exercised when opening
    (component as any).cloneCoverageVariantSchema = { schema: 'clone' } as any;
    component.toggleEditDrawer();
    expect(component.showCloneCoverageVariant).toBe(true);
    expect((component as any).coverageVariantSchema).toEqual({ schema: 'clone' });
  });

  it('should toggle update drawer', () => {
    component.showUpdateAllocation = false;
    (component as any).updateCoverageVariantAllocationSchema = {
      schema: 'alloc',
    } as any;
    component.toggleUpdateDrawer();
    expect(component.showUpdateAllocation).toBe(true);
    expect((component as any).coverageVariantSchema).toEqual({ schema: 'alloc' });
  });

  it('should handle getCoverageVariants error path', () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
    (mockCoverageVariantService.getCoverageVariants as jest.Mock).mockReturnValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) => subscriber.error('boom'))
    );
    component.getCoverageVariants('P1', 'V1');
    expect(console.log).toHaveBeenCalled();
    (console.log as jest.Mock).mockRestore();
  });

  it('should select row, set context id, persist, and navigate', () => {
    component.productId = 'P1';
    const row = { coverageVariantId: 'C1', name: 'Name1' } as any;
    component.onSelectedRow(row);
    expect(mockProductContextService._setCoverageVariantId).toHaveBeenCalledWith(
      'C1'
    );
    expect(localStorage.getItem('coverageVariantId')).toBe('C1');
    expect(localStorage.getItem('coverageVariantName')).toBe('Name1');
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      `/products/P1/coveragevariant/edit`,
      'C1',
    ]);
  });

  it('submitEdit: success navigates when movetoNext=false and refreshes list', () => {
    const spyRefresh = jest.spyOn(component, 'getCoverageVariants').mockImplementation();
    (mockCoverageVariantService.updateCoverageVariantAllocation as jest.Mock).mockReturnValueOnce(
      of({})
    );
    const data = [
      { coverageVariantId: 'C1', allocationPercent: 10, isCurrentVersion: true },
    ] as any;
    component.submitEdit([], data, false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
    expect(spyRefresh).toHaveBeenCalled();
  });

  it('submitEdit: success triggers next when movetoNext=true', () => {
    (mockCoverageVariantService.updateCoverageVariantAllocation as jest.Mock).mockReturnValueOnce(
      of({})
    );
    const data = [
      { coverageVariantId: 'C1', allocationPercent: 10, isCurrentVersion: true },
    ] as any;
    component.submitEdit([], data, true);
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 6 });
  });

  it('submitEdit: error shows specific backend error message when present', () => {
    (mockCoverageVariantService.updateCoverageVariantAllocation as jest.Mock).mockReturnValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) =>
        subscriber.error({ error: { errors: { E1: ['Specific error'] } } })
      )
    );
    const data = [
      { coverageVariantId: 'C1', allocationPercent: 10, isCurrentVersion: true },
    ] as any;
    component.submitEdit([], data, true);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', message: 'Specific error' })
    );
  });

  it('submitEdit: error shows generic message when backend error absent', () => {
    (mockCoverageVariantService.updateCoverageVariantAllocation as jest.Mock).mockReturnValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) => subscriber.error({}))
    );
    const data = [
      { coverageVariantId: 'C1', allocationPercent: 10, isCurrentVersion: true },
    ] as any;
    component.submitEdit([], data, true);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        message: 'Failed to update coverage variant allocation (%).',
      })
    );
  });

  it('saveAndExit calls submitEdit with movetoNext=false', () => {
    jest.spyOn(component, 'submitEdit').mockImplementation();
    // seed required state
    (component as any).coverageVariantsSummary = [];
    (component as any).coverageVariants = [] as any;
    component.saveAndExit();
    expect(component.submitEdit).toHaveBeenCalledWith(
      (component as any).coverageVariantsSummary,
      (component as any).coverageVariants,
      false
    );
  });

  it('next: when product disabled goes to next step directly', () => {
    mockProductContextService.isProductDisabled.mockReturnValueOnce(true);
    component.coverageVariants = mockCoverageVariants;
    component.next();
    expect(mockSharedService.nextButtonClicked.next).toHaveBeenCalledWith({ stepCount: 6 });
  });

  it('next: when no variants shows info message', () => {
    mockProductContextService.isProductDisabled.mockReturnValueOnce(false);
    component.coverageVariants = [] as any;
    component.next();
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info' })
    );
  });

  it('next: with variants submits edit', () => {
    mockProductContextService.isProductDisabled.mockReturnValueOnce(false);
    component.coverageVariants = mockCoverageVariants as any;
    component.bindCoverageSummary(mockCoverageVariants as any);
    const spy = jest.spyOn(component, 'submitEdit').mockImplementation();
    component.next();
    expect(spy).toHaveBeenCalledWith(
      (component as any).coverageVariantsSummary,
      (component as any).coverageVariants,
      true
    );
  });

  it('previous: emits previous with step count from product service', () => {
    component.previous();
    expect(mockSharedService.previousButtonClicked.next).toHaveBeenCalledWith({ stepCount: 5 });
  });

  it('onSubmitClone: duplicate id shows error message', () => {
    component.coverageVariants = [{ coverageVariantId: 'DUP' }] as any;
    const form = { name: 'n', coverageVariantId: 'DUP' };
    component.onSubmitClone(form);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });

  it('onSubmitClone: success path creates and refreshes', () => {
    component.coverageVariants = [{ coverageVariantId: 'X' }] as any;
    (component as any).cloneCoverageVariantData = { name: 'old', coverageVariantId: 'old' };
    const spyRefresh = jest.spyOn(component, 'getCoverageVariants').mockImplementation();
    const form = { name: 'newName', coverageVariantId: 'NEW' };
    component.onSubmitClone(form);
    expect(mockCoverageVariantService.createCoverageVariant).toHaveBeenCalled();
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    );
    expect(spyRefresh).toHaveBeenCalled();
  });

  it('onSubmitClone: error shows backend description when available', () => {
    (mockCoverageVariantService.createCoverageVariant as jest.Mock).mockReturnValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) =>
        subscriber.error({ error: [{ description: 'clone failed' }] })
      )
    );
    component.coverageVariants = [] as any;
    (component as any).cloneCoverageVariantData = {};
    const form = { name: 'n', coverageVariantId: 'ID' };
    component.onSubmitClone(form);
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'clone failed' })
    );
  });

  it('cloneCoverageVarient returns a deep copy', () => {
    const source = { a: 1, b: { c: 2 } };
    const copy = component.cloneCoverageVarient(source);
    expect(copy).toEqual(source);
    expect(copy).not.toBe(source);
  });

  it('onSubmitallocation: success updates and refreshes', async () => {
    component.editCoverageVariant = { coverageVariantId: 'C1' } as any;
    const spyRefresh = jest.spyOn(component, 'getCoverageVariants').mockImplementation();
    await component.onSubmitallocation({ allocationPercent: 22 });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    );
    expect(spyRefresh).toHaveBeenCalled();
  });

  it('onSubmitallocation: error shows error toast', async () => {
    (mockCoverageVariantService.updateCoverageVariant as unknown as jest.Mock).mockResolvedValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) => subscriber.error('x'))
    );
    component.editCoverageVariant = { coverageVariantId: 'C1' } as any;
    await component.onSubmitallocation({ allocationPercent: 22 });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });

  it('_deleteCoverageVariant: success shows toast and refreshes', () => {
    const spyRefresh = jest.spyOn(component, 'getCoverageVariants').mockImplementation();
    component.openDeleteModal = true;
    component._deleteCoverageVariant({ item: { coverageVariantId: 'C1' } });
    expect(mockCoverageVariantService.deleteCoverageVariant).toHaveBeenCalledWith(
      'C1',
      component.productId,
      component.productVersionId
    );
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    );
    expect(spyRefresh).toHaveBeenCalled();
    expect(component.openDeleteModal).toBe(false);
  });

  it('_deleteCoverageVariant: error shows error toast', () => {
    (mockCoverageVariantService.deleteCoverageVariant as jest.Mock).mockReturnValueOnce(
      // eslint-disable-next-line rxjs/no-ignored-error
      new Observable((subscriber: any) => subscriber.error('x'))
    );
    component.openDeleteModal = true;
    component._deleteCoverageVariant({ item: { coverageVariantId: 'C1' } });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
    expect(component.openDeleteModal).toBe(false);
  });

  it('handleDeleteModal closes modal', () => {
    component.openDeleteModal = true;
    component.handleDeleteModal();
    expect(component.openDeleteModal).toBe(false);
  });

  it('deleteConfirmation delegates to _deleteCoverageVariant', () => {
    const spy = jest.spyOn(component as any, '_deleteCoverageVariant');
    (component as any).deleteSelectedItem = { item: { coverageVariantId: 'C1' } };
    component.deleteConfirmation();
    expect(spy).toHaveBeenCalledWith((component as any).deleteSelectedItem);
  });

  it('customSort delegates to TableService', () => {
    const opts = (component as any).options;
    const event = { field: 'name' } as any;
    opts.customSort(event);
    expect(mockTableService.nativeSortWithFavoritesPriority).toHaveBeenCalledWith(event);
  });

  it('generates disabled actions when product is disabled', () => {
    // create a fresh component instance with product disabled
    mockProductContextService.isProductDisabled.mockReturnValueOnce(true);
    const freshFixture = TestBed.createComponent(CoverageVariantComponent);
    const freshComp = freshFixture.componentInstance as any;
    const columns = freshComp.options.columns;
    const actionsCol = columns.find((c: any) => c.fieldName === 'updatedBy.name');
    const actions = actionsCol.actions;
    const edit = actions.find((a: any) => a.label === 'View');
    const clone = actions.find((a: any) => a.label === 'Clone');
    const del = actions.find((a: any) => a.label === 'Delete');
    expect(edit.icon).toBe('pi pi-eye');
    expect(clone.disabled).toBe(true);
    expect(del.disabled).toBe(true);
  });

  it('updateSync marks completed and refreshes when all finished', () => {
    const spyRefresh = jest.spyOn(component, 'getCoverageVariants').mockImplementation();
    (component as any).UpdateSyncList = [
      { coverageVariantId: 'X', completed: false },
    ];
    component.updateSync.emit({ coverageVariantId: 'X' } as any);
    expect(spyRefresh).toHaveBeenCalled();
    expect(mockProductContextService._setCoverageVariantId).toHaveBeenCalledWith('');
  });
});
