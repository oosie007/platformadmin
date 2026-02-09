import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { CommandsModule, StudioCommands } from '@canvas/commands';
import {
  LayoutComponent,
  LayoutService,
  SearchFilterComponent,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbModalModule,
  CbSearchInputModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SharedService } from '../products/services/shared.service';
import { AppContextService, TableService } from '@canvas/services';
import { ProductContextService } from '../products/services/product-context.service';
import { CoverageVariantsService } from '../products/services/coverage-variants.service';
import { Documents, DocumentsV2Labels } from './model/documents-v2';
import { ColumnOptions, TableOptions } from '@canvas/components/types';
import { cloneDeep } from 'lodash-es';
import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';
import { DocumentService } from '../products/services/document.service';
import * as FileSaver from 'file-saver';
import { Router } from '@angular/router';

@Component({
  selector: 'canvas-documents-v2',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    SearchFilterComponent,
    TableComponent,
    CommandsModule,
    CbButtonModule,
    CbSearchInputModule,
    AutoCompleteModule,
    CbIconModule,
    SidebarFormComponent,
    FormsModule,
    CbModalModule,
    CbTooltipModule,
    CbModalModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './documents-v2.component.html',
  styleUrl: './documents-v2.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DocumentsV2Component implements OnInit {
  productId!: string;
  productVersionId!: string;
  isFinalStatus = false;
  docColumns: ColumnOptions[];
  labels: DocumentsV2Labels;
  options: TableOptions;
  documents!: Documents[];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  showDrawer = false;
  addDocSchema: UIKitNgxFormlyFormJsonSchema;
  documentsCopy: Documents[];
  searchedDocuments: Documents[];
  openDeleteModal: boolean;
  deleteSelectedItem: Documents;
  showEditDrawer: boolean;
  editItem: Documents;
  editDocumentSchema: UIKitNgxFormlyFormJsonSchema;
  editDocumentModel: Documents;
  private lastAutoPopulatedName: string | null = null;

  constructor(
    private readonly _layoutService: LayoutService,
    private readonly _sharedService: SharedService,
    private readonly _tableService: TableService,
    private _router: Router,
    private readonly _productContextService: ProductContextService,
    private readonly _appContextService: AppContextService,
    protected readonly _coverageVariantService: CoverageVariantsService,
    private _documentService: DocumentService,
    private readonly _commands: StudioCommands
  ) {
    this.productId = localStorage.getItem('productId') || '';
    this.productVersionId = localStorage.getItem('productVersionId') || '';

    this.addDocSchema = <UIKitNgxFormlyFormJsonSchema>(
      this._appContextService.get('pages.product.documents-v2.schema')
    );

    this.docColumns = <ColumnOptions[]>(
      this._appContextService.get('pages.product.documents-v2.columns')
    );

    this.labels = <DocumentsV2Labels>(
      this._appContextService.get('pages.product.documents-v2.labels')
    );

    this.editDocumentSchema = <UIKitNgxFormlyFormJsonSchema>(
      this._appContextService.get('pages.product.documents-v2.form')
    );

    this._generateOptions();

    if (this._productContextService.isProductDisabled()) {
      this.isFinalStatus = true;
    }

    this._commands.add('EditDocument', {
      commandName: 'EditDocument',
      canExecute: () => true,
      execute: (data: { item: Documents }) => {
        this.showEditDrawer = true;
        this.editItem = data.item;
        this.editDocumentModel = data.item;
        return Promise.resolve(true);
      },
    });

    this._commands.add('DownloadDocument', {
      commandName: 'DownloadDocument',
      canExecute: () => true,
      execute: (data: { item: Documents }) => {
        this.downloadDocument(data.item);
        return Promise.resolve(true);
      },
    });

    this._commands.add('DeleteDocument', {
      commandName: 'DeleteDocument',
      canExecute: () => true,
      execute: (data: { item: Documents }) => {
        this.openDeleteModal = true;
        this.deleteSelectedItem = data.item;
        return Promise.resolve(true);
      },
    });
  }

  ngOnInit(): void {
    this._getDocuments();
  }

  private _generateOptions() {
    const columns = cloneDeep(this.docColumns);
    const disableEdit = this._productContextService.isProductDisabled();
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [15, 30, 50, 100],
      columns: disableEdit
        ? columns.map((combo) => {
            if (combo.fieldName === 'action') {
              combo.actions = combo.actions?.map((act) => {
                act = {
                  ...act,
                  disabled: act.label === 'Delete' || act.label === 'Download',
                  label: act.label === 'Edit' ? 'View' : act.label,
                  icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon,
                };
                return act;
              });
            }
            return combo;
          })
        : columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
  }

  _getDocuments() {
    this._documentService
      .getDocumentList(this.productId, this.productVersionId)
      .subscribe({
        next: (data) => {
          const documents: Documents[] = data.map((doc) => ({
            documentId: doc.documentId ?? '',
            name: doc.name ?? '',
            description: doc.description ?? '',
            url: doc.url ?? '',
            fileName: doc.fileName ?? '',
          }));
          this.documents = documents;
          this.documentsCopy = cloneDeep(this.documents);
        },
        error: (err) => {
          if (err?.error?.errors && err.error.errors.PMERR000086) {
            this.documents = [];
            return;
          }
          this._layoutService.showMessage({
            severity: 'error',
            message: this.labels.getDocsListError,
            duration: 3000,
          });
        },
      });
  }

  onAddDocument(): void {
    this.showDrawer = true;
  }

  searchDocuments(event: any) {
    const query = event.query?.toLowerCase() || '';
    if (query.length === 0) {
      this.documents = cloneDeep(this.documentsCopy);
      return;
    } else if (query.length < 3) {
      this.documents = cloneDeep(this.documentsCopy);
      return;
    } else {
      const filtered: Documents[] = [];
      for (let i = 0; i < this.documentsCopy.length; i++) {
        const name = this.documentsCopy[i].name?.toLowerCase() || '';
        const description =
          this.documentsCopy[i].description?.toLowerCase() || '';
        if (name.includes(query) || description.includes(query)) {
          filtered.push(this.documentsCopy[i]);
        }
      }
      this.documents = cloneDeep(filtered);
    }
  }

  onSearchClear(event: any) {
    this.documents = cloneDeep(this.documentsCopy);
  }

  previous() {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  saveAndExit() {
    this._router.navigate(['products']);
  }

  toggleDrawer(event: boolean): void {
    this.showDrawer = event;
  }

  onUploadDocument(event: any) {
    const formData = new FormData();
    if (event.fileUpload.length) {
      const file = event.fileUpload[0];
      formData.append('file', file);
      formData.append('fileName', event.name);
      formData.append('description', event.description);
      formData.append('overwriteExisting', 'true');
    }
    this._documentService
      .uploadDocument(this.productId, this.productVersionId, formData)
      .subscribe({
        next: (res) => {
          this._layoutService.showMessage({
            severity: 'success',
            message: this.labels.fileUploadSuccess,
            duration: 3000,
          });
          this._getDocuments();
        },
        error: () => {
          this._layoutService.showMessage({
            severity: 'error',
            message: this.labels.fileUploadFailed,
            duration: 3000,
          });
        },
      });
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  deleteConfirmation() {
    if (this.deleteSelectedItem.documentId) {
      this._documentService
        .removeDocument(
          this.productId,
          this.productVersionId,
          this.deleteSelectedItem.documentId
        )
        .subscribe({
          next: (res) => {
            this._layoutService.showMessage({
              severity: 'success',
              message: `${this.deleteSelectedItem.name} deleted successfully.`,
              duration: 3000,
            });
            this._getDocuments();
          },
          error: (err) => {
            this._layoutService.showMessage({
              severity: 'error',
              message: 'Document delete failed.',
              duration: 3000,
            });
          },
        });
    }
    this.openDeleteModal = false;
  }

  toggleEditDrawer(event: boolean): void {
    this.showEditDrawer = event;
  }

  downloadDocument(doc: Documents): void {
    const product_url = `/canvas/api/catalyst/products/download?productId=${this.productId}&versionId=${this.productVersionId}&documentId=${doc.documentId}`;
    FileSaver.saveAs(product_url);
  }

  /* Patching selected filename without extension to name field of Add document form */
  onSidebarFormChange(formGroup: FormGroup) {
    const model = formGroup.value;
    const nameControl = formGroup.get('name');
    const fileUpload = model.fileUpload;
    if (fileUpload && fileUpload.length > 0) {
      const file = model.fileUpload[0];
      const fileName = file.name;
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      if (
        (nameControl?.value === null ||
          nameControl?.value === undefined ||
          nameControl?.value === '') &&
        this.lastAutoPopulatedName !== nameWithoutExt
      ) {
        nameControl?.setValue(nameWithoutExt, { emitEvent: false });
        this.lastAutoPopulatedName = nameWithoutExt;
      }
    } else {
      // If fileUpload is cleared, reset the tracker
      this.lastAutoPopulatedName = null;
    }
  }

  onEditDocument(event: any) {
    //console.log("onEditDocument", event)
  }
}
