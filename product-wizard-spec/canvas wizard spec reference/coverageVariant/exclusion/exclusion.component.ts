import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommandsModule, StudioCommands } from '@canvas/commands';
import {
  CommandsBarComponent,
  FieldConfig,
  LayoutService,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import {
  CommandDefinition,
  TableColumnDefinition,
  TableOptions,
} from '@canvas/components/types';
import { MenuService, TableService } from '@canvas/services';
import { StudioCommandDefinition } from '@canvas/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbModalModule,
  CbSearchInputModule,
} from '@chubb/ui-components';
import { cloneDeep, isEmpty, isNull, isUndefined } from 'lodash-es';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ExclusionService } from '../../../services/exclusion.service';
import { ProductContextService } from '../../../services/product-context.service';
import { SharedService } from '../../../services/shared.service';
import {
  Exclusion,
  ExclusionModel,
  ExclusionRequest,
} from '../../../types/exclusion';
import { ExclusionColumns } from '../../../types/exclusions-columns';
import { ProductContext } from '../../../types/product-context';
import { exclusionSchema } from './exclusion.schema';

@Component({
  selector: 'canvas-exclusion',
  standalone: true,
  imports: [
    CommonModule,
    CommandsBarComponent,
    TableComponent,
    CommandsModule,
    CbButtonModule,
    CbSearchInputModule,
    AutoCompleteModule,
    FieldConfig,
    SidebarFormComponent,
    CbModalModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './exclusion.component.html',
  styleUrls: ['./exclusion.component.scss'],
})
export class ExclusionComponent implements OnInit {
  exclusionSchema = exclusionSchema;
  addTheme = CbColorTheme.DEFAULT;
  addButtonTheme = CbColorTheme.WHITE;
  checkboxcolortheme = CbColorTheme.DEFAULT;
  productId: string;
  coverageVariantId: string;
  productVersionId: string;
  protected options!: TableOptions;
  columnDefinitions!: TableColumnDefinition[];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  showCreateExclusion = false;
  showEditExclusion = false;
  getExclusionList: Exclusion[];
  modelCreate: ExclusionModel = {
    name: '',
    description: '',
  };

  modelEdit: ExclusionModel = {
    name: '',
    description: '',
  };
  exclusionRequest: ExclusionRequest;
  exclusionEditRequest: Exclusion;
  exclusionId: string;
  productContext: ProductContext;
  country: string;
  isDisabled = false;
  editExclusionData: any;
  coverageVariantName: string;
  /**
   * Command to create new product.
   */
  createExclusionCommand!: StudioCommandDefinition;
  disableEdit = false;
  openDeleteModal: boolean;
  deleteSelectedItem: any;
  constructor(
    private _commandsService: StudioCommands,
    private _layoutService: LayoutService,
    private _router: Router,
    private readonly _menuService: MenuService,
    private _sharedService: SharedService,
    private readonly _tableService: TableService,
    private readonly _exclusion: ExclusionService,
    private _productContextService: ProductContextService
  ) {
    if (
      localStorage.getItem('productId') != null ||
      localStorage.getItem('productId') != undefined
    ) {
      this.productId = localStorage.getItem('productId') || '';
    }
    if (
      localStorage.getItem('coverageVariantId') != null ||
      localStorage.getItem('coverageVariantId') != undefined
    ) {
      this.coverageVariantId = localStorage.getItem('coverageVariantId') || '';
    }
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      this.productVersionId = localStorage.getItem('productVersionId') || '';
    }
    if (
      localStorage.getItem('coverageVariantName') != null ||
      localStorage.getItem('coverageVariantName') != undefined
    ) {
      this.coverageVariantName =
        localStorage.getItem('coverageVariantName') || '';
    }

    this._updateLayout();
    this.disableEdit = _productContextService.isProductDisabled() ?? false;
    this._generateOptions();
    this._commandsService.add('editExclusion', {
      commandName: 'editExclusion',
      canExecute: () => true,
      execute: (value: any) => {
        this._editExclusion(value);
        return Promise.resolve(true);
      },
    });
    this._commandsService.add('deleteExclusion', {
      commandName: 'deleteExclusion',
      canExecute: () => true,
      execute: (value: any) => {
        this.deleteSelectedItem = value;
        this.openDeleteModal = true;
        return Promise.resolve(true);
      },
    });
    this.createExclusionCommand = <StudioCommandDefinition>{
      commandName: 'HttpCommand',
      parameter: {
        url: '/canvas/api/catalyst/products/{{productId}}/exclusions?versionId=${{productVersionId}}&requestId=1.0',
        method: 'POST',
      },
    };
    this._productContext();
  }

  private _generateOptions() {
    const columns = cloneDeep(ExclusionColumns);
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [5, 10, 15, 20, 25],
      columns: this.disableEdit
        ? columns.map((col) => {
            if (col.fieldName === '') {
              col.actions = col.actions?.map((act) => {
                act = {
                  ...act,
                  disabled: act.label === 'Delete',
                  label: act.label === 'Edit' ? 'View' : act.label,
                  icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon,
                };
                return act;
              });
            }
            return col;
          })
        : columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
  }

  private _productContext() {
    this.productContext = this._productContextService._getProductContext();
    this.productContext.requestId =
      isEmpty(this.productContext.requestId) ||
      isNull(this.productContext.requestId) ||
      isUndefined(this.productContext.requestId)
        ? crypto.randomUUID()
        : this.productContext.requestId;
    this.country =
      this.productContext.country.length < 0
        ? 'IE'
        : !isEmpty(this.productContext.country[0]) &&
          !isNull(this.productContext.country[0])
        ? this.productContext.country[0]
        : 'IE';
    this.productContext.language =
      isEmpty(this.productContext.language) ||
      isNull(this.productContext.language) ||
      isUndefined(this.productContext.language) ||
      this.productContext.language == 'en'
        ? 'en'
        : this.productContext.language;
  }

  actions: CommandDefinition[] = [];

  private delete(value: any) {
    const id = value?.item?.exclusionId;
    const record = this.getExclusionList.filter(
      (item: any) => item.exclusionId === id
    )[0];
    if (
      this._productContextService.isProductDisabled() ||
      !record.isCurrentVersion
    ) {
      const toastMessage = this._productContextService.getToastMessage(
        !record.isCurrentVersion
      );
      this._layoutService.showMessage(toastMessage['warning']);
    } else {
      this.exclusionId = id;
      const index = this.getExclusionList.findIndex(
        (element) => element['exclusionId'] == id
      );
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Exclusion  deleted successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'Failed to delete exclusion, error occured.',
          duration: 5000,
        },
      };
      this.getExclusionList.splice(index, 1);
      this._exclusion
        .deleteExclusion(
          record.exclusionId,
          this.productId,
          this.coverageVariantId,
          this.productVersionId
        )
        .subscribe({
          next: (res) => {
            this._layoutService.showMessage(toastMessageConfig[`success`]);
            this.getExclusions();
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig[`error`]);
          },
        });
    }
    this.openDeleteModal = false;
  }

  private _editExclusion(data: any) {
    this.editExclusionData = '';
    const id = data?.item?.exclusionId;
    this.exclusionId = id;
    const record = this.getExclusionList.filter(
      (item: any) => item.exclusionId === id
    )[0];
    this.editExclusionData = record;
    this.modelEdit.description = record.description;
    this.modelEdit.name = record.type;

    if (
      this._productContextService.isProductDisabled() ||
      !record.isCurrentVersion
    ) {
      const toastMessageConfig = this._productContextService.getToastMessage(
        !record.isCurrentVersion
      );
      this._layoutService.showMessage(toastMessageConfig['warning']);
    } else {
      this.toggleEditDrawer();
    }
  }

  private _updateLayout() {
    this._layoutService.updateBreadcrumbs([
      { label: 'Home', routerLink: 'home' },
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
      {
        label: 'Coverage variants',
        routerLink: `/products/${this.productId}/coveragevariant`,
      },
      {
        label: `${this.coverageVariantName}`,
        routerLink: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantName}`,
      },
      {
        label: 'Exclusions',
        routerLink: `/products/${this.productId}/coveragevariant/exclusions`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    this.getExclusions();
    if (this._productContextService.isProductDisabled()) {
      this.isDisabled = true;
    }
  }

  /**
   * This method is responsible to execute command
   * @param $event which holds command emitted form action
   */

  executeCommand($event: CommandDefinition): void {
    if ($event.id === 'edit-exclusions') {
      // this.editExclusion();
    } else if ($event.id === 'delete-exclusions') {
      // this.deleteExclusion(this.exclusionId);
    } else {
      this._commandsService
        .execute($event.commandName, {}, $event.parameter)
        .then();
    }
    this._menuService.closeMenu();
  }

  getExclusions() {
    this._exclusion
      .getexclusions(
        this.productId,
        this.coverageVariantId,
        this.productVersionId
      )
      .subscribe((response: Exclusion[]) => {
        this.getExclusionList = response;
      });
  }

  getExclusionsbyId(exclusionId: string) {
    this.exclusionId = exclusionId;
    this._exclusion
      .getExclusionbyId(
        exclusionId,
        this.productId,
        this.coverageVariantId,
        this.productVersionId
      )
      .subscribe((response: Exclusion) => {
        this.exclusionRequest = response;
      });
  }
  onSelectedRow(data: Exclusion) {
    this.getExclusionsbyId(data.exclusionId);
    localStorage.setItem('exclusionId', data.exclusionId);
    this.modelEdit.name = data.type;
    this.modelEdit.description = data.description;
    if (
      this._productContextService.isProductDisabled() ||
      !data.isCurrentVersion
    ) {
      const toastMessageConfig = this._productContextService.getToastMessage(
        !data.isCurrentVersion
      );
      this._layoutService.showMessage(toastMessageConfig['warning']);
    } else {
      this.toggleEditDrawer();
    }
  }

  submit(): void {
    this._sharedService.nextButtonClicked.next({ stepCount: 1 });
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  saveAndExit(): void {
    this._router.navigate(['products']);
  }

  toggleAddDrawer(): void {
    this.showCreateExclusion = !this.showCreateExclusion;
  }
  /**
   * This method is responsible to show the toast messages based on the repose from create product
   * @param response create product action response
   */
  onCreateProduct(response: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Exclusion created successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to create Exclusion.',
        duration: 5000,
      },
      emptyValidator: {
        severity: 'error',
        message: 'Enter Exclusion Name.',
        duration: 5000,
      },
    };

    this._layoutService.showMessage(
      toastMessageConfig[`${response ? 'success' : 'error'}`]
    );
  }

  /**
   * This method is responsible to show the toast messages based on the repose from create product
   * @param response create product action response
   */
  onUpdateProduct(response: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Exclusion updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to update Exclusion.',
        duration: 5000,
      },
      emptyValidator: {
        severity: 'error',
        message: 'Enter Exclusion Name.',
        duration: 5000,
      },
    };

    this._layoutService.showMessage(
      toastMessageConfig[`${response ? 'success' : 'error'}`]
    );
  }
  toggleEditDrawer(): void {
    this.showEditExclusion = !this.showEditExclusion;
  }
  onSubmitAdd(formValue: ExclusionModel) {
    const toastMessageConfig = {
      emptyValidator: {
        severity: 'error',
        message: 'Enter Exclusion Name.',
        duration: 5000,
      },
    };
    if (formValue.name == '' || formValue.name == null) {
      this._layoutService.showMessage(toastMessageConfig[`emptyValidator`]);
    } else {
      this.createExclusion(formValue);
      const parameters = {
        url: `/canvas/api/catalyst/products/${this.productId}/exclusions?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
      };
      this._exclusion
        .createExclusion(
          this.exclusionRequest,
          this.productId,
          this.coverageVariantId,
          this.productVersionId
        )
        .subscribe({
          next: (res) => {
            if (res != null || res != '') {
              this.onCreateProduct(true);
              this.getExclusions();
              this.clearAll();
              localStorage.setItem('exclusionId', res.data.exclusionId);
            } else {
              this.onCreateProduct(false);
            }
          },
        });
    }
  }

  createExclusion(formValue: ExclusionModel) {
    this.exclusionRequest = {
      type: formValue.name,
      description: formValue?.description,
      phrase: formValue.name,
      requestId: crypto.randomUUID(),
      isCurrentVersion: true,
    };
  }

  editExclusion(formValue: ExclusionModel) {
    this.exclusionEditRequest = {
      type: formValue.name,
      description: formValue.description,
      exclusionId: this.exclusionId,
      phrase: formValue.name,
      requestId: crypto.randomUUID(),
      isCurrentVersion: this.exclusionRequest.isCurrentVersion,
    };
  }
  onSubmitEdit(formValue: ExclusionModel) {
    const toastMessageConfig = {
      emptyValidator: {
        severity: 'error',
        message: 'Enter Exclusion Name.',
        duration: 5000,
      },
    };
    if (formValue.name == '' || formValue.name == null) {
      this._layoutService.showMessage(toastMessageConfig[`emptyValidator`]);
    } else {
      this.editExclusion(formValue);

      this._exclusion
        .updateExclusion(
          this.exclusionEditRequest,
          this.productId,
          this.coverageVariantId,
          this.productVersionId,
          this.exclusionId
        )
        .subscribe({
          next: (res) => {
            if (res != null || res != '') {
              this.onUpdateProduct(true);
              this.getExclusions();
              this.clearAll();
              this._router.navigate([
                `/products/${this.productId}/coveragevariant/exclusions`,
              ]);
            } else {
              this.onUpdateProduct(false);
            }
          },
        });
    }
  }

  clearAll() {
    this.modelCreate.description = '';
    this.modelCreate.name = '';
    this.modelEdit.description = '';
    this.modelEdit.name = '';
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  deleteConfirmation() {
    this.delete(this.deleteSelectedItem);
  }
}
