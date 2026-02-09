import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DocumentsV2Component } from './documents-v2.component';
import { LayoutService } from '@canvas/components';
import { SharedService } from '../products/services/shared.service';
import { ComponentRegistry, TableService } from '@canvas/services';
import { Router } from '@angular/router';
import { ProductContextService } from '../products/services/product-context.service';
import { AppContextService } from '@canvas/services';
import { CoverageVariantsService } from '../products/services/coverage-variants.service';
import { DocumentService } from '../products/services/document.service';
import { of, throwError, Subject } from 'rxjs';
import { STUDIO_COMPONENTS } from '@canvas/types';
import { StudioCommands } from '@canvas/commands';
import { FormControl, FormGroup } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { Documents } from './model/documents-v2';

describe('DocumentsV2Component', () => {
  let component: DocumentsV2Component;
  let fixture: ComponentFixture<DocumentsV2Component>;
  let mockLayoutService: any;
  let mockSharedService: any;
  let mockTableService: any;
  let mockRouter: any;
  let mockProductContextService: any;
  let mockAppContextService: any;
  let mockCoverageVariantService: any;
  let mockDocumentService: any;
  let MockComponentRegistry: any;
  let mockCommands: any;
  let formGroup: FormGroup;

  beforeEach(() => {
    mockLayoutService = { showMessage: jest.fn() };
    mockSharedService = { previousButtonClicked: new Subject() };
    mockTableService = { nativeSortWithFavoritesPriority: jest.fn() };
    mockRouter = { navigate: jest.fn() };
    mockProductContextService = {
      isProductDisabled: jest.fn().mockReturnValue(false),
    };
    mockAppContextService = {
      get: jest.fn().mockImplementation((key) => {
        if (key.endsWith('schema')) return {};
        if (key.endsWith('columns')) return [];
        if (key.endsWith('labels'))
          return {
            getDocsListError: 'Error',
            fileUploadSuccess: 'Success',
            fileUploadFailed: 'Failed',
          };
        return null;
      }),
    };
    mockCoverageVariantService = {};
    mockDocumentService = {
      getDocumentList: jest.fn().mockReturnValue(of([])),
      uploadDocument: jest.fn(),
      removeDocument: jest.fn(),
    };

    mockCommands = {
      add: jest.fn(),
    };

    // Mock localStorage
    jest
      .spyOn(window.localStorage['__proto__'], 'getItem')
      .mockImplementation((key) => {
        if (key === 'productId') return 'pid';
        if (key === 'productVersionId') return 'vid';
        return null;
      });

    jest.spyOn(FileSaver, 'saveAs').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [DocumentsV2Component],
      providers: [
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: TableService, useValue: mockTableService },
        { provide: Router, useValue: mockRouter },
        { provide: ProductContextService, useValue: mockProductContextService },
        { provide: AppContextService, useValue: mockAppContextService },
        {
          provide: CoverageVariantsService,
          useValue: mockCoverageVariantService,
        },
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ComponentRegistry, useClass: MockComponentRegistry },
        { provide: STUDIO_COMPONENTS, useValue: [] },
        { provide: StudioCommands, useValue: mockCommands },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsV2Component);
    component = fixture.componentInstance;

    formGroup = new FormGroup({
      name: new FormControl(''),
      fileUpload: new FormControl([]),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize productId and productVersionId from localStorage', () => {
    expect(component.productId).toBe('pid');
    expect(component.productVersionId).toBe('vid');
  });

  it('should set isFinalStatus if product is disabled', () => {
    mockProductContextService.isProductDisabled.mockReturnValue(true);
    const comp = new DocumentsV2Component(
      mockLayoutService,
      mockSharedService,
      mockTableService,
      mockRouter,
      mockProductContextService,
      mockAppContextService,
      mockCoverageVariantService,
      mockDocumentService,
      mockCommands
    );
    expect(comp.isFinalStatus).toBe(true);
  });

  it('should call _getDocuments on ngOnInit', () => {
    jest.spyOn(component, '_getDocuments');
    component.ngOnInit();
    expect(component._getDocuments).toHaveBeenCalled();
  });

  it('should set documents and documentsCopy on successful _getDocuments', () => {
    const docs = [
      {
        documentId: '1',
        name: 'Doc1',
        description: 'Desc1',
        fileName: '',
        url: '',
      },
    ];
    mockDocumentService.getDocumentList.mockReturnValue(of(docs));
    component._getDocuments();
    expect(component.documents).toEqual([
      {
        documentId: '1',
        name: 'Doc1',
        description: 'Desc1',
        fileName: '',
        url: '',
      },
    ]);
    expect(component.documentsCopy).toEqual([
      {
        documentId: '1',
        name: 'Doc1',
        description: 'Desc1',
        fileName: '',
        url: '',
      },
    ]);
  });

  it('should show error message on _getDocuments error', () => {
    mockDocumentService.getDocumentList.mockReturnValue(
      throwError(() => new Error('fail'))
    );
    component._getDocuments();
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'error',
      message: 'Error',
      duration: 3000,
    });
  });

  it('should set showDrawer to true on onAddDocument', () => {
    component.showDrawer = false;
    component.onAddDocument();
    expect(component.showDrawer).toBe(true);
  });

  it('should filter documents in searchDocuments', () => {
    component.documentsCopy = [
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
      {
        name: 'Doc2',
        description: 'Desc2',
        documentId: '2',
        url: '',
        fileName: '',
      },
    ];
    component.documents = [];
    component.searchDocuments({ query: 'doc1' });
    expect(component.documents).toEqual([
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
    ]);
  });

  it('should reset documents on searchDocuments with empty query', () => {
    component.documentsCopy = [
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
    ];
    component.documents = [];
    component.searchDocuments({ query: '' });
    expect(component.documents).toEqual([
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
    ]);
  });

  it('should reset documents on onSearchClear', () => {
    component.documentsCopy = [
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
    ];
    component.documents = [];
    component.onSearchClear({});
    expect(component.documents).toEqual([
      {
        name: 'Doc1',
        description: 'Desc1',
        documentId: '1',
        url: '',
        fileName: '',
      },
    ]);
  });

  it('should emit previousButtonClicked on previous', () => {
    const spy = jest.spyOn(mockSharedService.previousButtonClicked, 'next');
    component.previous();
    expect(spy).toHaveBeenCalledWith({ stepCount: 1 });
  });

  it('should navigate to products on saveAndExit', () => {
    component.saveAndExit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['products']);
  });

  it('should set showDrawer on toggleDrawer', () => {
    component.showDrawer = false;
    component.toggleDrawer(true);
    expect(component.showDrawer).toBe(true);
  });

  it('should upload document and show success message', () => {
    mockDocumentService.uploadDocument.mockReturnValue(of({}));
    jest.spyOn(component, '_getDocuments');
    component.labels = {
      fileUploadSuccess: 'Success',
      fileUploadFailed: 'Failed',
    } as any;
    component.onUploadDocument({
      fileUpload: [new Blob(['file'])],
      name: 'test',
      description: 'desc',
    });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'success',
      message: 'Success',
      duration: 3000,
    });
    expect(component._getDocuments).toHaveBeenCalled();
  });

  it('should show error message on uploadDocument error', () => {
    mockDocumentService.uploadDocument.mockReturnValue(
      throwError(() => new Error('fail'))
    );
    component.labels = {
      fileUploadSuccess: 'Success',
      fileUploadFailed: 'Failed',
    } as any;
    component.onUploadDocument({
      fileUpload: [new Blob(['file'])],
      name: 'test',
      description: 'desc',
    });
    expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
      severity: 'error',
      message: 'Failed',
      duration: 3000,
    });
  });

  it('should set openDeleteModal to false in handleDeleteModal', () => {
    component.openDeleteModal = true;
    component.handleDeleteModal();
    expect(component.openDeleteModal).toBe(false);
  });

  it('should call removeDocument and show success message in deleteConfirmation', (done) => {
    component.deleteSelectedItem = {
      documentId: 'docid',
      name: 'docname',
    } as any;
    mockDocumentService.removeDocument.mockReturnValue(of({}));
    jest.spyOn(component, '_getDocuments').mockImplementation(() => {});

    component.deleteConfirmation();

    setTimeout(() => {
      expect(mockDocumentService.removeDocument).toHaveBeenCalledWith(
        'pid',
        'vid',
        'docid'
      );
      expect(mockLayoutService.showMessage).toHaveBeenCalledWith({
        severity: 'success',
        message: 'docname deleted successfully.',
        duration: 3000,
      });
      expect(component._getDocuments).toHaveBeenCalled();
      expect(component.openDeleteModal).toBe(false);
      done();
    }, 0);
  });

  it('should set showEditDrawer to true when event is true', () => {
    component.toggleEditDrawer(true);
    expect(component.showEditDrawer).toBe(true);
  });

  it('should set showEditDrawer to false when event is false', () => {
    component.toggleEditDrawer(false);
    expect(component.showEditDrawer).toBe(false);
  });

  it('should overwrite previous value of showEditDrawer', () => {
    component.showEditDrawer = true;
    component.toggleEditDrawer(false);
    expect(component.showEditDrawer).toBe(false);

    component.toggleEditDrawer(true);
    expect(component.showEditDrawer).toBe(true);
  });

  it('should set name control value to file name without extension if name is empty', () => {
    const mockFile = { name: 'testfile.pdf' };
    formGroup.setValue({ name: '', fileUpload: [mockFile] });

    component.onSidebarFormChange(formGroup);

    expect(formGroup.get('name')?.value).toBe('testfile');
    expect((component as any).lastAutoPopulatedName).toBe('testfile');
  });

  it('should not overwrite name control if it already has a value', () => {
    const mockFile = { name: 'anotherfile.docx' };
    formGroup.setValue({ name: 'existingName', fileUpload: [mockFile] });

    component.onSidebarFormChange(formGroup);

    expect(formGroup.get('name')?.value).toBe('existingName');
    expect((component as any).lastAutoPopulatedName).toBeNull();
  });

  it('should reset lastAutoPopulatedName if fileUpload is empty', () => {
    formGroup.setValue({ name: '', fileUpload: [] });

    (component as any).lastAutoPopulatedName = 'something';
    component.onSidebarFormChange(formGroup);

    expect((component as any).lastAutoPopulatedName).toBeNull();
  });

  it('should not set name if lastAutoPopulatedName matches nameWithoutExt', () => {
    const mockFile = { name: 'sample.txt' };
    formGroup.setValue({ name: '', fileUpload: [mockFile] });

    (component as any).lastAutoPopulatedName = 'sample';
    component.onSidebarFormChange(formGroup);

    expect(formGroup.get('name')?.value).toBe('');
    expect((component as any).lastAutoPopulatedName).toBe('sample');
  });

  it('should call FileSaver.saveAs with correct URL', () => {
    component.productId = 'prod123';
    component.productVersionId = 'ver456';
    const doc: Documents = {
      documentId: 'doc789',
      name: 'Test Document',
      description: 'Test Description',
      url: '/some/url',
      fileName: 'test.pdf',
    };

    component.downloadDocument(doc);

    const expectedUrl =
      '/canvas/api/catalyst/products/download?productId=prod123&versionId=ver456&documentId=doc789';
    expect(FileSaver.saveAs).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle different product and version IDs', () => {
    component.productId = 'prodABC';
    component.productVersionId = 'verXYZ';
    const doc: Documents = {
      documentId: 'doc789',
      name: 'Test Document',
      description: 'Test Description',
      url: '/some/url',
      fileName: 'test.pdf',
    };

    component.downloadDocument(doc);

    const expectedUrl =
      '/canvas/api/catalyst/products/download?productId=prodABC&versionId=verXYZ&documentId=doc789';
    expect(FileSaver.saveAs).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle empty documentId', () => {
    component.productId = 'prod123';
    component.productVersionId = 'ver456';
    const doc: Documents = {
      documentId: 'doc789',
      name: 'Test Document',
      description: 'Test Description',
      url: '/some/url',
      fileName: 'test.pdf',
    };

    component.downloadDocument(doc);

    const expectedUrl =
      '/canvas/api/catalyst/products/download?productId=prod123&versionId=ver456&documentId=doc789';
    expect(FileSaver.saveAs).toHaveBeenCalledWith(expectedUrl);
  });
});
