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
import { TableColumnDefinition, TableOptions } from '@canvas/components/types';
import { AppContextService, TableService } from '@canvas/services';
import { StudioCommandDefinition } from '@canvas/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbModalModule,
  CbSearchInputModule,
} from '@chubb/ui-components';
import { cloneDeep, isEmpty, isNull, isUndefined } from 'lodash-es';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { InclusionService } from '../../../services/inclusion.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import {
  Inclusion,
  InclusionModel,
  InclusionRequest,
  InclusionsLabels,
} from '../../../types/inclusion';
import { InclusionColumns } from '../../../types/inclusions-columns';
import { Statuskeys } from '../../../types/product';
import { ProductContext } from '../../../types/product-context';

@Component({
  selector: 'canvas-inclusion',
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
  templateUrl: './inclusion.component.html',
  styleUrls: ['./inclusion.component.scss'],
})
export class InclusionComponent implements OnInit {
  inclusionSchema: any;
  addTheme = CbColorTheme.DEFAULT;
  addButtonTheme = CbColorTheme.WHITE;
  checkboxcolortheme = CbColorTheme.DEFAULT;
  productId: string;
  coverageVariantId: string;
  productVersionId: string;
  options: TableOptions;
  columnDefinitions!: TableColumnDefinition[];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  showCreateInclusion = false;
  showEditInclusion = false;
  getInclusionList: Inclusion[];
  modelCreate: InclusionModel = {
    name: '',
    description: '',
  };

  modelEdit: InclusionModel = {
    name: '',
    description: '',
  };
  inclusionRequest: InclusionRequest;
  inclusionEditRequest: Inclusion;
  inclusionId: string;
  productContext: ProductContext;
  country: string;
  isDisabled = false;
  editInclusionData: any;
  coverageVariantName: string;
  /**
   * Command to create new product.
   */
  createInclusionCommand!: StudioCommandDefinition;
  disableEdit = false;
  openDeleteModal: boolean;
  deleteSelectedItem: any;

  labels: InclusionsLabels;
  searchedInclusions: string;
  existingInclusionList: Inclusion[];

  constructor(
    private readonly _appContext: AppContextService,
    private _commandsService: StudioCommands,
    private _layoutService: LayoutService,
    private _router: Router,
    private _productService: ProductsService,
    private _sharedService: SharedService,
    private readonly _tableService: TableService,
    private _productContextService: ProductContextService,
    private readonly _inclusion: InclusionService
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

    this.labels = <InclusionsLabels>(
      this._appContext.get('pages.inclusions.labels')
    );

    this.inclusionSchema = this._appContext.get('pages.inclusions.schema');

    this._updateLayout();
    this._generateOptions();
    this.disableEdit = _productContextService._isCurrVersionNew() ?? false;
    this._commandsService.add('editInclusion', {
      commandName: 'editInclusion',
      canExecute: () => true,
      execute: (value: any) => {
        this._editInclusion(value);
        return Promise.resolve(true);
      },
    });
    this._commandsService.add('deleteInclusion', {
      commandName: 'deleteInclusion',
      canExecute: () => true,
      execute: (value: any) => {
        this.deleteSelectedItem = value;
        this.openDeleteModal = true;
        return Promise.resolve(true);
      },
    });
    this.createInclusionCommand = <StudioCommandDefinition>{
      commandName: 'HttpCommand',
      parameter: {
        url: '/canvas/api/catalyst/products/{{productId}}/inclusions?versionId=${{productVersionId}}&requestId=1.0',
        method: 'POST',
      },
    };
    this._productContext();
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

  private delete(value: any) {
    const toastMessage = {
      warning: {
        severity: 'info',
        message: 'Changes are not allowed as product is in Final status',
        duration: 5000,
      },
    };
    if (
      this._productContextService._getProductContext().status ===
      Statuskeys.FINAL
    ) {
      this._layoutService.showMessage(toastMessage['warning']);
    } else {
      const id = value?.item?.inclusionId;
      this.inclusionId = id;
      const record = this.getInclusionList.filter(
        (item: any) => item.inclusionId === id
      )[0];
      const index = this.getInclusionList.findIndex(
        (element) => element['inclusionId'] == id
      );
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Inclusion  deleted successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'Failed to delete inclusion, error occured.',
          duration: 5000,
        },
      };
      this.getInclusionList.splice(index, 1);
      this._inclusion
        .deleteInclusion(
          record.inclusionId,
          this.productId,
          this.coverageVariantId,
          this.productVersionId
        )
        .subscribe({
          next: (res) => {
            this._layoutService.showMessage(toastMessageConfig[`success`]);
            this.getInclusions();
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig[`error`]);
          },
        });
    }
    this.openDeleteModal = false;
  }

  private _editInclusion(data: any) {
    const toastMessageConfig = {
      warning: {
        severity: 'info',
        message: 'Changes are not allowed as product is in Final status',
        duration: 5000,
      },
    };
    this.editInclusionData = '';
    const id = data?.item?.inclusionId;
    this.inclusionId = id;
    this.getInclusionsbyId(this.inclusionId);
    const record = this.getInclusionList.filter(
      (item: any) => item.inclusionId === id
    )[0];
    this.editInclusionData = record;
    this.modelEdit.description = record.description;
    this.modelEdit.name = record.type;

    if (
      this._productContextService._getProductContext().status ===
      Statuskeys.FINAL
    ) {
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
        label: 'Inclusions',
        routerLink: `/products/${this.productId}/coveragevariant/inclusions`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    this.getInclusions();
    if (
      this._productContextService._getProductContext().status ===
      Statuskeys.FINAL
    ) {
      this.isDisabled = true;
    }
  }

  getInclusions() {
    this._inclusion
      .getInclusions(
        this.productId,
        this.coverageVariantId,
        this.productVersionId
      )
      .subscribe((response: Inclusion[]) => {
        this.getInclusionList = response;
        this.existingInclusionList = this.getInclusionList;
      });
  }

  getInclusionsbyId(inclusionId: string) {
    this.inclusionId = inclusionId;
    this._inclusion
      .getInclusionbyId(
        inclusionId,
        this.productId,
        this.coverageVariantId,
        this.productVersionId
      )
      .subscribe((response: Inclusion) => {
        this.inclusionRequest = response;
      });
  }

  private _generateOptions() {
    const columns = cloneDeep(InclusionColumns);
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

  onSelectedRow(data: Inclusion) {
    const toastMessageConfig = {
      warning: {
        severity: 'info',
        message: 'Changes are not allowed as product is in Final status',
        duration: 5000,
      },
    };
    this.getInclusionsbyId(data.inclusionId);
    localStorage.setItem('inclusionId', data.inclusionId);
    this.modelEdit.name = data.type;
    this.modelEdit.description = data.description;
    if (
      this._productContextService._getProductContext().status !=
      Statuskeys.FINAL
    ) {
      this.toggleEditDrawer();
    } else {
      this._layoutService.showMessage(toastMessageConfig['warning']);
    }
  }

  submit(): void {
    this._productService.setInsuredIndividual(true);
    this._sharedService.previousButtonClicked.next({ stepCount: 6 });
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  saveAndExit(): void {
    this._router.navigate(['products']);
  }

  toggleAddDrawer(): void {
    this.showCreateInclusion = !this.showCreateInclusion;
  }
  /**
   * This method is responsible to show the toast messages based on the repose from create product
   * @param response create product action response
   */
  onCreateProduct(response: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Inclusion created successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to create Inclusion.',
        duration: 5000,
      },
      emptyValidator: {
        severity: 'error',
        message: 'Enter Inclusion Name.',
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
        message: 'Inclusion updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to update Inclusion.',
        duration: 5000,
      },
      emptyValidator: {
        severity: 'error',
        message: 'Enter Inclusion Name.',
        duration: 5000,
      },
    };

    this._layoutService.showMessage(
      toastMessageConfig[`${response ? 'success' : 'error'}`]
    );
  }

  toggleEditDrawer(): void {
    this.showEditInclusion = !this.showEditInclusion;
  }

  onSubmitAdd(formValue: InclusionModel) {
    const toastMessageConfig = {
      emptyValidator: {
        severity: 'error',
        message: 'Enter inclusion name.',
        duration: 5000,
      },
    };
    if (formValue.name == '' || formValue.name == null) {
      this._layoutService.showMessage(toastMessageConfig[`emptyValidator`]);
    } else {
      this.createInclusion(formValue);
      this._inclusion
        .createInclusion(
          this.inclusionRequest,
          this.productId,
          this.coverageVariantId,
          this.productVersionId
        )
        .subscribe({
          next: (res) => {
            if (res != null || res != '') {
              this.onCreateProduct(true);
              this.getInclusions();
              this.clearAll();
              localStorage.setItem('inclusionId', res.data.inclusionId);
            } else {
              this.onCreateProduct(false);
            }
          },
        });
    }
  }

  createInclusion(formValue: InclusionModel) {
    this.inclusionRequest = {
      type: formValue.name,
      description: formValue?.description,
      phrase: formValue.name,
      requestId: crypto.randomUUID(),
      isCurrentVersion: true,
    };
  }

  editInclusion(formValue: InclusionModel) {
    this.inclusionEditRequest = {
      type: formValue.name,
      description: formValue.description,
      inclusionId: this.inclusionId,
      phrase: formValue.name,
      requestId: crypto.randomUUID(),
      isCurrentVersion: this.inclusionRequest.isCurrentVersion,
    };
  }

  onSubmitEdit(formValue: InclusionModel) {
    const toastMessageConfig = {
      emptyValidator: {
        severity: 'error',
        message: 'Enter Inclusion Name.',
        duration: 5000,
      },
    };
    if (formValue.name == '' || formValue.name == null) {
      this._layoutService.showMessage(toastMessageConfig[`emptyValidator`]);
    } else {
      this.editInclusion(formValue);

      this._inclusion
        .updateInclusion(
          this.inclusionEditRequest,
          this.productId,
          this.coverageVariantId,
          this.productVersionId,
          this.inclusionId
        )
        .subscribe({
          next: (res) => {
            if (res != null || res != '') {
              this.onUpdateProduct(true);
              this.getInclusions();
              this.clearAll();
              this._router.navigate([
                `/products/${this.productId}/coveragevariant/inclusions`,
              ]);
            } else {
              this.onUpdateProduct(false);
            }
          },
        });
    }
  }

  searchInclusions(event: any) {
    if (event.query.length === 0) {
      this.existingInclusionList = cloneDeep(this.getInclusionList);
      return;
    } else {
      const filtered: Inclusion[] = [];
      for (let i = 0; i < this.existingInclusionList.length; i++) {
        if (
          this.existingInclusionList[i].type
            ?.toLowerCase()
            .includes(event.query?.toLowerCase())
        ) {
          filtered.push(this.existingInclusionList[i]);
        }
      }
      this.existingInclusionList = cloneDeep(filtered);
    }
  }

  onSearchClear(event: any) {
    this.existingInclusionList = cloneDeep(this.getInclusionList);
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
