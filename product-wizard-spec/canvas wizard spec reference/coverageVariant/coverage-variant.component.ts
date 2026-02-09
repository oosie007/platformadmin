/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommandsModule, StudioCommands } from '@canvas/commands';
import {
  CommandsBarComponent,
  DrawerComponent,
  FieldConfig,
  LayoutComponent,
  LayoutService,
  SearchFilterComponent,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import { TableOptions } from '@canvas/components/types';
import { AppContextService, TableService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbModalModule,
  CbSearchInputModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';
import { isNullOrUndefined } from 'is-what';
import { cloneDeep } from 'lodash-es';
import { MessageService } from 'primeng/api';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  CoverageVariant,
  CreateCoverageVariant,
  UpdateSync,
  VariantsSummary,
} from '../../types/coverage';
import { MasterData } from '../../types/product';
import { coverageVariantData } from '../../types/product-context';
import { CoverageVariantColumns } from './coverage-variant-columns';
@Component({
  selector: 'canvas-coverage-variant',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    CommandsBarComponent,
    SearchFilterComponent,
    TableComponent,
    CommandsModule,
    ToastModule,
    CbButtonModule,
    CbSearchInputModule,
    AutoCompleteModule,
    CbIconModule,
    FieldConfig,
    DrawerComponent,
    SidebarFormComponent,
    CbTooltipModule,
    CbModalModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService],
  templateUrl: './coverage-variant.component.html',
  styleUrls: ['./coverage-variant.component.scss'],
})
export class CoverageVariantComponent implements OnInit {
  coverageVariants!: CoverageVariant[];
  coverageVariantsSummary!: VariantsSummary[];
  coverageAllocation: any[];
  filteredCoverageVariants: any[];
  searchedCoverageVariant: any;

  coverageVariantSelected!: CoverageVariant;

  productId!: string;
  productVersionId!: string;

  productClass!: MasterData[];
  coverageType!: MasterData[];

  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  iconTheme: CbColorTheme = CbColorTheme.DEFAULT;

  protected options!: TableOptions;
  modelClone: CreateCoverageVariant = {
    coverageVariantId: '',
    name: '',
    requestId: crypto.randomUUID(),
    isCurrentVersion: true,
  };
  modelUpdate: CreateCoverageVariant = {
    allocationPercent: 0,
    name: '',
    requestId: crypto.randomUUID(),
    isCurrentVersion: true,
  };
  showCloneCoverageVariant = false;
  showUpdateAllocation = false;
  coverageVariantSchema: UIKitNgxFormlyFormJsonSchema;
  cloneCoverageVariantSchema: UIKitNgxFormlyFormJsonSchema;
  updateCoverageVariantAllocationSchema: UIKitNgxFormlyFormJsonSchema;
  cloneCoverageVariantData: any;
  editCoverageVariant!: CoverageVariant;
  updateallocationData: any;
  total: number;
  isDisabled = false;
  // productData!: ProductRequest;
  isDisableButton = false;
  listOfIdsToClear: string[] = [
    'insuredId',
    'individualId',
    'attrId',
    'subCoverId',
    'coverageId',
    'insuredTypeId',
    'coverageVariantLevelId',
    'insuredLevelId',
    'limitId',
    'id',
    'durationId',
    'exclusionId',
  ];
  isStatus = false;
  updateSync: EventEmitter<UpdateSync> = new EventEmitter<UpdateSync>();
  UpdateSyncList: UpdateSync[] = [];
  count = 0;
  isDisableCreateButton = false;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  openDeleteModal: boolean;
  deleteSelectedItem: any;

  constructor(
    protected readonly _coverageVariantService: CoverageVariantsService,
    private _layoutService: LayoutService,
    private _router: Router,
    private _sharedService: SharedService,
    private readonly _tableService: TableService,
    private readonly _commands: StudioCommands,
    private readonly _appContext: AppContextService,
    private readonly _productContextService: ProductContextService,
    private readonly messageService: MessageService,
    private readonly _productService: ProductsService
  ) {
    if (
      localStorage.getItem('productId') != null ||
      localStorage.getItem('productId') != undefined
    ) {
      this.productId = localStorage.getItem('productId') || '';
    }
    if (
      localStorage.getItem('productVersionId') != null ||
      localStorage.getItem('productVersionId') != undefined
    ) {
      this.productVersionId = localStorage.getItem('productVersionId') || '';
    }
    this._updateLayout();

    if (this._productContextService.isProductDisabled()) {
      this.isStatus = true;
    }

    this.cloneCoverageVariantSchema = <UIKitNgxFormlyFormJsonSchema>(
      this._appContext.get('pages.product.coverage-variant.cloneSchema')
    );

    this.updateCoverageVariantAllocationSchema = <UIKitNgxFormlyFormJsonSchema>(
      this._appContext.get('pages.product.coverage-variant.allocationSchema')
    );

    this._generateOptions();

    this._commands.add('editCoverageVariant', {
      commandName: 'editCoverageVariant',
      canExecute: () => true,
      execute: (value: any) => {
        const coverageVariantId = value?.item?.coverageVariantId;
        const coverageVariantData = {
          country: '',
          coverageVariantId: '',
          coverageVariantName: '',
          standardCoverage: [],
          productClass: '',
          updatedOn: '',
        };
        this._productContextService._setCoverageVariantData(
          coverageVariantData
        );
        this._productContextService._setCoverageVariantData(
          coverageVariantData
        );
        localStorage.setItem('coverageVariantId', coverageVariantId);
        localStorage.setItem(
          'coverageVariantName',
          value?.item?.name || coverageVariantId
        );
        coverageVariantId
          ? this._router.navigate([
              `/products/${this.productId}/coveragevariant/edit`,
              coverageVariantId,
            ])
          : '';
        return Promise.resolve(true);
      },
    });

    this._commands.add('cloneCoverageVariant', {
      commandName: 'cloneCoverageVariant',
      canExecute: () => true,
      execute: (value: any) => {
        this._cloneCoverageVariant(value);
        return Promise.resolve(true);
      },
    });

    this._commands.add('deleteCoverageVariant', {
      commandName: 'deleteCoverageVariant',
      canExecute: () => true,
      execute: (value: any) => {
        this.deleteSelectedItem = value;
        this.openDeleteModal = true;
        return Promise.resolve(true);
      },
    });

    this._commands.add('updateCoverageVariant', {
      commandName: 'updateCoverageVariant',
      canExecute: () => true,
      execute: (value: any) => {
        this._updateAllocation(value);
        return Promise.resolve(true);
      },
    });

    this.updateSync.subscribe((value: UpdateSync) => {
      const val = this.UpdateSyncList.find(
        (x) => x.coverageVariantId === value?.coverageVariantId
      );
      if (val != undefined) {
        val.completed = true;
      }
      if (this.UpdateSyncList.every((x) => x.completed)) {
        this.getCoverageVariants(this.productId, this.productVersionId);
        this._productContextService._setCoverageVariantId('');
      }
    });
  }

  private _generateOptions() {
    const columns = cloneDeep(CoverageVariantColumns);
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [25, 50, 75, 100, 125],
      columns: this._productContextService.isProductDisabled()
        ? columns.map((col) => {
            if (col.fieldName === 'updatedBy.name') {
              col.actions = col.actions?.map((act) => {
                act = {
                  ...act,
                  disabled: act.label === 'Clone' || act.label === 'Delete',
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

  private _cloneCoverageVariant(data: any) {
    this.cloneCoverageVariantData = '';
    const id = data?.item?.coverageVariantId;
    const record = this.coverageVariants.filter(
      (item: any) => item.coverageVariantId === id
    )[0];
    this.cloneCoverageVariantData = record;
    this.toggleEditDrawer();
  }

  private _updateAllocation(data: any) {
    this.updateallocationData = '';
    const id = data?.item?.coverageVariantId;
    const record = this.coverageVariants.filter(
      (item: any) => item.coverageVariantId === id
    )[0];
    this.updateallocationData = record;
    this.modelUpdate.name = record.name;
    this.modelUpdate.allocationPercent = record.allocationPercent;
    localStorage.setItem(
      'allocation',
      record.allocationPercent ? record.allocationPercent.toString() : ''
    );
    this.editCoverageVariant = record;
    this.toggleUpdateDrawer();
  }

  /* function to update the layout */
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
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    this.getCoverageVariants(this.productId, this.productVersionId);
    this._productContextService._setCoverageVariantId('');

    this.disableForm();
  }

  private disableForm(): void {
    if (this._productContextService.isProductDisabled()) {
      this.isDisableButton = true;
      this.isDisableCreateButton = true;
    }
  }

  searchCoverageVariant(event: AutoCompleteCompleteEvent) {
    const filtered: any[] = [];
    const query = event.query;
    for (let i = 0; i < (this.coverageVariants as any[]).length; i++) {
      const coverageVariant = (this.coverageVariants as any[])[i];
      if (
        coverageVariant.name.toLowerCase().indexOf(query.toLowerCase()) == 0
      ) {
        filtered.push(coverageVariant);
      }
    }
    this.filteredCoverageVariants = filtered;
  }

  getCoverageVariants(_productId?: string, _productVersionId?: string): void {
    this._coverageVariantService
      .getCoverageVariants(_productId, _productVersionId)
      .subscribe({
        next: (data) => {
          this.coverageVariants = data;
          this.bindCoverageSummary(this.coverageVariants);
        },
        error: (e) => {
          console.log('error: ' + e);
        },
      });
  }

  bindCoverageSummary(coverageVariants: CoverageVariant[]) {
    if (coverageVariants) {
      this.coverageVariantsSummary = [];
      coverageVariants?.forEach((data: CoverageVariant) => {
        const codeList: string[] = [];
        data.coveragespremiumregistration?.forEach((code) => {
          codeList.push(
            isNullOrUndefined(code.geniusCoverage)
              ? code.stdCoverageCode + ' - ' + code.stdCoverageDescription
              : code.stdCoverageCode +
                  ' - ' +
                  code.stdCoverageDescription +
                  ' - ' +
                  code.geniusCoverage.value
          );
        });
        if (data != undefined && data.allocationPercent != undefined) {
          const variant: VariantsSummary = {
            name: data.name,
            coverageVariantId: data.coverageVariantId,
            relatedCoverageVariantIds: data.relatedCoverageVariantIds.map(
              (cov) => {
                return (
                  coverageVariants.find(
                    (covVariant) => covVariant.coverageVariantId == cov
                  )?.name ?? ''
                );
              }
            ),
            coverageCode: codeList.join(','),
            isStatus: this.isStatus,
            isCurrentVersion: data.isCurrentVersion,
          };
          this.coverageVariantsSummary.push(variant);
        }
      });
      if (this.total >= 100) {
        this.isDisableCreateButton = true;
      } else {
        this.isDisableCreateButton = false;
      }
      this.disableForm();
    }
  }

  createCoverageVariant() {
    const coverageVariantData: coverageVariantData = {
      country: '',
      coverageVariantId: '',
      coverageVariantName: '',
      standardCoverage: [],
      productClass: '',
      updatedOn: '',
    };
    this._productContextService._setCoverageVariantData(coverageVariantData);
    this._productContextService._setCoverageVariantId('');
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/createcoveragevariant`,
    ]);
  }

  onSelectedRow(event: any) {
    this.coverageVariantSelected = event;
    this._productContextService._setCoverageVariantId(
      this.coverageVariantSelected.coverageVariantId || ''
    );
    const coverageVariantData: coverageVariantData = {
      country: '',
      coverageVariantId: '',
      coverageVariantName: '',
      standardCoverage: [],
      productClass: '',
      updatedOn: '',
    };
    this._productContextService._setCoverageVariantData(coverageVariantData);
    if (this.coverageVariantSelected.coverageVariantId != undefined) {
      localStorage.setItem(
        'coverageVariantId',
        this.coverageVariantSelected.coverageVariantId
      );
      localStorage.setItem(
        'coverageVariantName',
        this.coverageVariantSelected.name ||
          this.coverageVariantSelected.coverageVariantId
      );
    }
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/edit`,
      this.coverageVariantSelected.coverageVariantId,
    ]);
  }

  submitEdit(
    data: VariantsSummary[],
    coverageVariantsData: CoverageVariant[],
    movetoNext: boolean
  ) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Coverage variant allocation (%) updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to update coverage variant allocation (%).',
        duration: 5000,
      },
    };
    this.UpdateSyncList = [];
    this.coverageAllocation = [];
    this.count == 0;

    this.coverageAllocation = coverageVariantsData.map((test) => {
      return {
        coverageVariantId: test.coverageVariantId,
        allocationPercent: test.allocationPercent,
        isCurrentVersion: test.isCurrentVersion ?? true,
      };
    });
    const coverageVariants = {
      requestId: crypto.randomUUID(),
      coverageVariants: this.coverageAllocation,
    };
    this._coverageVariantService
      .updateCoverageVariantAllocation(coverageVariants)
      .subscribe({
        next: () => {
          if (movetoNext) {
            this._sharedService.nextButtonClicked.next({ stepCount: 7 });
          } else {
            this._router.navigate(['products']);
          }
        },
        error: (err) => {
          const { errors } = err.error ?? [];
          const errorCodes = Object.keys(errors);
          if (errors && !isNullOrUndefined(errorCodes)) {
            const errorMessage = errors[errorCodes[0]][0];
            this._layoutService.showMessage({
              severity: 'error',
              message: errorMessage,
              duration: 5000,
            });
          } else {
            this._layoutService.showMessage(toastMessageConfig['error']);
          }
        },
      });
    this.getCoverageVariants(this.productId, this.productVersionId);
  }

  saveAndExit() {
    this.submitEdit(this.coverageVariantsSummary, this.coverageVariants, false);
  }
  next(): void {
    const toastMessageConfig = {
      info: {
        severity: 'info',
        message: 'At least one coverage variant is mandatory for a product.',
        duration: 4000,
      },
    };
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next({ stepCount: 7 });
    } else {
      if (this.coverageVariants.length <= 0) {
        this._layoutService.showMessage(toastMessageConfig['info']);
      } else {
        this.submitEdit(
          this.coverageVariantsSummary,
          this.coverageVariants,
          true
        );
      }
    }
  }
  previous(): void {
    this._sharedService.previousButtonClicked.next({
      stepCount: this._productService.getStepCount(),
    });
  }

  onSubmitClone(formValue: any) {
    const defaultError = 'Coverage variant clone - failed.';
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Coverage variant cloned successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: defaultError,
        duration: 5000,
      },
      duplicate: {
        severity: 'error',
        message: `Coverage variant ID: ${formValue.coverageVariantId} already exists.`,
        duration: 5000,
      },
    };
    this.modelClone.name = formValue.name;
    this.modelClone.coverageVariantId = formValue.coverageVariantId;
    //Validate Coverage Variant ID Duplicate or not
    const coverageVariantIdExists = this.coverageVariants.some(
      (x) => x.coverageVariantId == formValue.coverageVariantId
    );

    if (coverageVariantIdExists) {
      this._layoutService.showMessage(toastMessageConfig['duplicate']);
    } else {
      const reqBody = this.cloneCoverageVarient(this.cloneCoverageVariantData);
      reqBody.name = formValue.name;
      reqBody.coverageVariantId = formValue.coverageVariantId;
      const stdCoverageDescription = reqBody.coveragespremiumregistration;
      const newCoverageDescriptions = stdCoverageDescription.map((cov: any) => {
        const description = cov.stdCoverageDescription.split('-');
        return {
          ...cov,
          stdCoverageDescription: description.slice(0, -1).join('-').trim(),
        };
      });
      reqBody.coveragespremiumregistration = newCoverageDescriptions;

      this._coverageVariantService
        .createCoverageVariant(reqBody, this.productId, this.productVersionId)
        .subscribe({
          next: () => {
            this._layoutService.showMessage(toastMessageConfig['success']);
            this.getCoverageVariants(this.productId, this.productVersionId);
          },
          error: (err) => {
            if (err?.error?.errors) {
              const errors = err.error.errors;
              for (const key in errors) {
                this._layoutService.showMessage({
                  severity: 'error',
                  message: errors[key] || defaultError,
                });
              }
            }
          },
        });
    }
  }

  toggleEditDrawer(): void {
    this.showCloneCoverageVariant = !this.showCloneCoverageVariant;

    // First time input fields not rendering, Need to check. below line currently working.
    if (this.showCloneCoverageVariant) {
      this.coverageVariantSchema = this.cloneCoverageVariantSchema;
    }
  }

  cloneCoverageVarient(row: any) {
    const item = JSON.stringify(row);
    const newItem = JSON.parse(item);
    return newItem;
  }

  async onSubmitallocation(formValue: any) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Allocation (%)  Update Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to update Allocation (%), error occured.',
        duration: 5000,
      },
    };

    this.editCoverageVariant.allocationPercent = formValue.allocationPercent;
    const coverageId = this.editCoverageVariant.coverageVariantId || '';
    (
      await this._coverageVariantService.updateCoverageVariant(
        this.editCoverageVariant,
        coverageId,
        this.productId,
        this.productVersionId
      )
    ).subscribe({
      next: () => {
        this._layoutService.showMessage(toastMessageConfig['success']);
        this.getCoverageVariants(this.productId, this.productVersionId);
      },
      error: () => {
        this._layoutService.showMessage(toastMessageConfig['error']);
      },
    });
  }
  toggleUpdateDrawer(): void {
    this.showUpdateAllocation = !this.showUpdateAllocation;

    // First time input fields not rendering, Need to check. below line currently working.
    if (this.showUpdateAllocation) {
      this.coverageVariantSchema = this.updateCoverageVariantAllocationSchema;
    }
  }
  _deleteCoverageVariant(value: any) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Coverage Variant  Deleted Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to delete Coverage Variant , error occured.',
        duration: 5000,
      },
    };
    const id = value?.item?.coverageVariantId;
    this._coverageVariantService
      .deleteCoverageVariant(id, this.productId, this.productVersionId)
      .subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
          this.getCoverageVariants(this.productId, this.productVersionId);
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
    this.openDeleteModal = false;
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  deleteConfirmation() {
    this._deleteCoverageVariant(this.deleteSelectedItem);
  }
}
