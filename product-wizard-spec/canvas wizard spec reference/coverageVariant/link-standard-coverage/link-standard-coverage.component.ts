/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import {
  CommandsBarComponent,
  FieldConfig,
  LayoutComponent,
  LayoutService,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import { SortOrder, TableOptions } from '@canvas/components/types';
import { TableService } from '@canvas/services';
import { StudioCommandDefinition } from '@canvas/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbModalModule,
  CbPaginationNavModule,
  CbSearchInputModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';
import { cloneDeep } from 'lodash-es';
import { MessageService } from 'primeng/api';
import { ChipsModule } from 'primeng/chips';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { SharedService } from '../../../services/shared.service';
import {
  CategoryData,
  CoverageCodeModel,
  coveragespremiumregistration,
  CoverageVariant,
  CreateCoverageVariant,
  StandardCoverage,
} from '../../../types/coverage';
import { coverageCodeColumns } from '../../../types/coverage-code-columns';
import { ProductLabels, ProductRequest } from '../../../types/product';

@Component({
  selector: 'canvas-link-standard-coverage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    CbInputModule,
    CbSelectChoiceModule,
    CbButtonModule,
    RouterModule,
    ToastModule,
    MultiSelectModule,
    ChipsModule,
    CbIconModule,
    CbTooltipModule,
    CbSelectMultipleModule,
    CbPaginationNavModule,
    CommandsBarComponent,
    FieldConfig,
    SidebarFormComponent,
    TableComponent,
    CbSearchInputModule,
    CbModalModule,
  ],
  providers: [MessageService],
  templateUrl: './link-standard-coverage.component.html',
  styleUrls: ['./link-standard-coverage.component.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkStandardCoverageComponent implements OnInit {
  productClass: CategoryData[] | undefined;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  coverageVariantId: string;
  productId!: string;
  productVersionId!: string;
  updateDataModel: CreateCoverageVariant;
  updateCoverageVariant: CoverageVariant;
  standardCoverages!: StandardCoverage[];
  standardCoverage!: StandardCoverage;
  selectedStandardCoverages: StandardCoverage[] = [];
  standardCoverageValues: string[] = [];
  isDisabled = true;
  disabledval = true;
  total = 0;
  rows = 10;
  first = 1;
  options!: TableOptions;
  coverageCodeList: coveragespremiumregistration[] = [];
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  coverageCode: coveragespremiumregistration = {
    coverageId: '',
    coverageBookingSystem: '',
    stdCoverageCode: '',
    stdCoverageDescription: '',
    stdCoverageDefinedBy: '',
    meridianStatLineCode: '',
    geniusSection: { key: '', value: '', desc: '' },
    geniusCoverage: { key: '', value: '', desc: '' },
    geniusTimeHazard: { key: '', value: '', desc: '' },
    coverageLevels: [],
    requestId: '',
    allocationPercent: 0,
    coverageCodeDescription: '',
  };
  enableAllocation = true;
  productResponse!: ProductRequest;
  editCoverageCodeData: any;
  open = true;
  _showModal: boolean;
  private subscription: Subscription;
  isStatus = false;
  coverageVariantName: string;
  /**
   *
   * Emitted when the form is submitted with succcess response
   */
  @Output() closed: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Model for the form fields.
   */
  model: CoverageCodeModel = {
    coverageCode: '',
    allocation: 0,
  };

  coverageCodeSchema: UIKitNgxFormlyFormJsonSchema = {
    title: '',
    type: 'object',
    properties: {
      coverageCode: {
        title: 'Standard coverage code',
        type: 'string',
        description: '',
        widget: {
          formlyConfig: {
            props: {
              type: 'text',
              required: true,
              readonly: true,
            },
          },
        },
      },
      allocation: {
        title: 'Allocation(%)',
        type: 'number',
        description: '1-100',
        widget: {
          formlyConfig: {
            props: {
              type: 'text',
              required: true,
            },
            validation: {
              messages: {
                pattern: 'Invalid Allocation(%). Only numbers are allowed.',
              },
            },
          },
        },
      },
    },
  };

  /**
   * This property controls drawer behavior
   */
  showCoverageAllocationForm = false;

  filteredCoverageCodes: any[];

  searchedCoverageCodes: any;
  /**
   * Command to create new product.
   */
  createLinkCommand!: StudioCommandDefinition;
  /**
   * This properly holds all labels of product page
   */
  productLabels: ProductLabels = {
    pageTitle: 'Standard coverage code allocation',
    submitButtonLabel: 'Save',
    cancelButtonLabel: 'Cancel',
    createProduct: 'ALLOCATION(%)',
    editProduct: '',
  };
  isDisable = false;
  coveragespremiumregistration: coveragespremiumregistration;
  constructor(
    private _coverageVariantService: CoverageVariantService,
    private _sharedService: SharedService,
    private _layoutService: LayoutService,
    private readonly _tableService: TableService,
    private _router: Router,
    private messageService: MessageService,
    private readonly _commandsService: StudioCommands,
    private readonly _productContextService: ProductContextService
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
    if (
      localStorage.getItem('coverageVariantId') != null ||
      localStorage.getItem('coverageVariantId') != undefined
    ) {
      this.coverageVariantId = localStorage.getItem('coverageVariantId') || '';
    }
    if (
      localStorage.getItem('coverageVariantName') != null ||
      localStorage.getItem('coverageVariantName') != undefined
    ) {
      this.coverageVariantName =
        localStorage.getItem('coverageVariantName') || '';
    }
    if (this._productContextService.isProductDisabled()) {
      this.isStatus = true;
    }
    this._updateLayout();
    const columns = cloneDeep(coverageCodeColumns);
    this.options = <TableOptions>{
      showPaginator: true,
      defaultSortField: 'coverageVariantCode',
      defaultSortOrder: SortOrder.DESC,
      rowsPerPageOptions: [15, 30, 50, 100],
      columns: _productContextService.isProductDisabled()
        ? columns.filter((col) => {
            if (col.fieldName === '') {
              return false;
            }
            return true;
          })
        : columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
    this._commandsService.add('EditCoverageCode', {
      commandName: 'EditCoverageCode',
      canExecute: () => true,
      execute: (value: any) => {
        this._editCoverageCodeAllocation(value);
        return Promise.resolve(true);
      },
    });

    this._commandsService.add('deleteCoverageCode', {
      commandName: 'deleteCoverageCode',
      canExecute: () => true,
      execute: (value: any) => {
        this._deleteCoverageCode(value);
        return Promise.resolve(true);
      },
    });

    this.createLinkCommand = <StudioCommandDefinition>{
      commandName: 'HttpCommand',
      parameter: {
        url: '/canvas/api/catalyst/products/${productId}/coveragevariants/${coverageVariantId}?versionId=${productVersionId}',
        method: 'PATCH',
      },
    };
  }

  private _editCoverageCodeAllocation(data: any) {
    this.editCoverageCodeData = '';
    const id = data?.item?.coverageId;
    const record = this.coverageCodeList.filter(
      (item: any) => item.coverageId === id
    )[0];
    this.editCoverageCodeData = record;
    this.model.coverageCode = record.stdCoverageDescription;
    this.model.allocation = record.allocationPercent;
    localStorage.setItem(
      'allocationPercentage',
      record.allocationPercent.toString()
    );

    this.toggleDrawer();
  }

  private _deleteCoverageCode(data: any) {
    const toastMessage = {
      warning: {
        severity: 'info',
        message: 'Changes are not allowed as product is in Final status',
        duration: 5000,
      },
    };
    if (this._productContextService.isProductDisabled()) {
      this._layoutService.showMessage(toastMessage['warning']);
    } else {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Coverage code allocation  deleted successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'Failed to delete coverage code allocation, error occured.',
          duration: 5000,
        },
      };
      const id = data?.item?.coverageId;
      const index = this.coverageCodeList.findIndex(
        (element) => element['coverageId'] == id
      );
      this.coverageCodeList.splice(index, 1);
      this.updateCoverageVariant.coveragespremiumregistration =
        this.coverageCodeList;
      this._fillDataModel();
      this._coverageVariantService
        .updateCoverageVariant(
          this.updateDataModel,
          this.coverageVariantId,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
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
      {
        label: `${this.coverageVariantName}`,
        routerLink: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
      },
      {
        label: 'Coverage code Allocation',
        routerLink: `/products/${this.productId}/coveragevariant/coverage-code`,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  ngOnInit(): void {
    if (this._productContextService.isProductDisabled()) {
      this.isDisable = true;
    }
    setTimeout(() => {
      this.getCoverageVariantById();
    }, 10);
    this.subscription =
      this._coverageVariantService._showModalUpdated.subscribe((value) => {
        console.log(value);
        this._showModal = value;
        this.open = true;
      });
  }
  closeModal() {
    this.open = false;
  }

  Delete() {
    this.open = false;
    this._coverageVariantService.deleteAllocationCode(true);
    this.deleteAllocation();
  }
  onSelectedRow(data: coveragespremiumregistration) {
    if (data != undefined) {
      this.model.coverageCode = data.stdCoverageDescription;
      this.model.allocation = data.allocationPercent;
      localStorage.setItem(
        'allocationPercentage',
        data.allocationPercent.toString()
      );
      localStorage.setItem('data', JSON.stringify(data));
      this.toggleDrawer();
      this.disabledval = false;
    }
  }

  /**
   * This method is responsible to show the toast messages based on the repose from create product
   * @param response create product action response
   */
  onCreateProduct(response: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Allocation added successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to add Allocation.',
        duration: 5000,
      },
    };

    this._layoutService.showMessage(
      toastMessageConfig[`${response ? 'success' : 'error'}`]
    );
  }
  onSubmit(formValue: object) {
    this.UpdateCoverageVariant(formValue);
  }

  deleteAllocation(): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Coverage code allocation  Deleted Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to delete Coverage code allocation, error occured.',
        duration: 5000,
      },
    };
    const data = JSON.parse(localStorage.getItem('data') || '');
    this.coverageCodeList = this.coverageCodeList.filter(
      (coverageCode) =>
        coverageCode.stdCoverageDescription !== data.stdCoverageDescription
    );
    this.updateCoverageVariant.coveragespremiumregistration =
      this.coverageCodeList;
    this._fillDataModel();
    this._coverageVariantService
      .updateCoverageVariant(
        this.updateDataModel,
        this.coverageVariantId,
        this.productId,
        this.productVersionId
      )
      .subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
          this.getCoverageVariantById();
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
  }
  /**
   * This method handles behavior of drawer
   */
  toggleDrawer(): void {
    this.showCoverageAllocationForm = !this.showCoverageAllocationForm;
  }

  getCoverageVariantById() {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: `Failed to load coverage code allocations for  the associated coverage cariant ${this.coverageVariantId} and product ${this.productId}`,
        duration: 5000,
      },
      warning: {
        severity: 'warning',
        message: `There is no coverage codes available  for the associated coverage cariant ${this.coverageVariantId} and  product ${this.productId}`,
        duration: 5000,
      },
    };
    this._coverageVariantService
      .getCoverageVariant(
        this.coverageVariantId,
        this.productId,
        this.productVersionId
      )
      .subscribe({
        next: (data) => {
          this.updateCoverageVariant = data;

          if (data.coveragespremiumregistration != undefined) {
            this.bindCoverageCode(data.coveragespremiumregistration);
          }

          this.updateCoverageVariant.productClass = data.productClass;
          this.updateCoverageVariant.coveragespremiumregistration =
            this.coverageCodeList;
          this.total = this.coverageCodeList.reduce(
            (prev, next) => prev + next.allocationPercent,
            0
          );
          if (this.total === 100) {
            this.isDisabled = false;
          } else {
            this.isDisabled = true;
          }
        },
        error: (err) => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
  }
  bindCoverageCode(data: coveragespremiumregistration[]) {
    this.coverageCodeList = [];
    const isReadOnly = this._productContextService.isProductDisabled();
    this.coverageCodeList = data.map((std) => {
      return {
        coverageId: std.coverageId,
        stdCoverageCode: std.stdCoverageCode,
        stdCoverageDescription: std.stdCoverageDescription?.includes('-')
          ? std.stdCoverageDescription
              ?.slice(0, std.stdCoverageDescription.lastIndexOf('-'))
              .trim()
          : std.stdCoverageDescription,
        meridianStatLineCode: std.meridianStatLineCode,
        geniusCoverage: std.geniusCoverage,
        geniusTimeHazard: std.geniusTimeHazard,
        coverageBookingSystem: 'genius',
        stdCoverageDefinedBy: '',
        geniusSection: std.geniusSection,
        coverageLevels: [],
        requestId: crypto.randomUUID(),
        allocationPercent: std.allocationPercent,
        coverageCodeDescription:
          std.stdCoverageCode + ' - ' + std.stdCoverageDescription,
        isReadOnly,
      };
    });
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  UpdateCoverageVariant(formvalue: any): void {
    if (this.ValidatePercentage(this.coverageCodeList, formvalue)) {
      if (this.total === 100) {
        this.isDisabled = false;
      } else {
        this.isDisabled = true;
      }
      this.coverageCode.allocationPercent = formvalue.allocation;
      this.coverageCode.stdCoverageDescription = formvalue.coverageCode;
      this.updateCoverageVariant.coveragespremiumregistration =
        this.coverageCodeList;
      //Filling the data needed to persist coverage variant data

      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Coverage code allocation  Updated Successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'Failed to update Coverage code allocation, error occured.',
          duration: 5000,
        },
      };
      this._fillDataModel();

      this._coverageVariantService
        .updateCoverageVariant(
          this.updateDataModel,
          this.coverageVariantId,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    } else {
      this.getCoverageVariantById();
    }
  }
  ValidatePercentage(
    data: coveragespremiumregistration[],
    formvalue: any
  ): boolean {
    data
      .filter((x) => x.stdCoverageDescription == formvalue.coverageCode)
      .map((x: any) => {
        x.allocationPercent = formvalue.allocation;
      });

    this.total = data.reduce((prev, next) => prev + next.allocationPercent, 0);
    if (this.total > 100) {
      this.messageService.add({
        key: 'tr',
        severity: 'error',
        summary: 'Error',
        detail: 'Allocation Percentage Should be 100 %',
        life: 5000,
        sticky: true,
        closable: true,
      });
      this.model.allocation = Number(
        localStorage.getItem('allocationPercentage')
      );
      return false;
    } else {
      return true;
    }
  }

  ValidateAllocationPercentage(data: coveragespremiumregistration[]): boolean {
    this.total = data.reduce(
      (prev, next) => Number(prev) + Number(next.allocationPercent),
      0
    );
    if (this.total > 100 || this.total < 100) {
      this.messageService.add({
        key: 'tr',
        severity: 'error',
        summary: 'Error',
        detail: 'Allocation Percentage Should be 100 %',
        life: 5000,
        sticky: true,
        closable: true,
      });
      this.model.allocation = Number(
        localStorage.getItem('allocationPercentage')
      );
      return false;
    } else {
      return true;
    }
  }
  _fillDataModel() {
    this.updateDataModel = {
      coverageVariantId: this.updateCoverageVariant.coverageVariantId,
      name: this.updateCoverageVariant.name,
      description: this.updateCoverageVariant.description,
      productClass: this.updateCoverageVariant.productClass,
      type: this.updateCoverageVariant.type,
      isPeril: this.updateCoverageVariant.isPeril,
      isRateBearing: this.updateCoverageVariant.isRateBearing,
      is3rdParty: this.updateCoverageVariant.is3rdParty,
      relatedCoverageVariantIds:
        this.updateCoverageVariant.relatedCoverageVariantIds,
      allocationPercent: this.updateCoverageVariant.allocationPercent,
      coveragespremiumregistration:
        this.updateCoverageVariant.coveragespremiumregistration,
      insured: this.updateCoverageVariant.insured,
      insuredObjects: this.updateCoverageVariant.insuredObjects,
      coverageVariantLevels: this.updateCoverageVariant.coverageVariantLevels,
      subCoverages: this.updateCoverageVariant.subCoverages,
      exclusions: this.updateCoverageVariant.exclusions,
      requestId: crypto.randomUUID(),
      isCurrentVersion: this.updateCoverageVariant.isCurrentVersion,
    };
  }
  navigateCoverageVariant() {
    this._router.navigate([`products/${this.productId}/coveragevariant`]);
  }

  // onPaginationEvent(event: PaginatorState | Event) {}

  updateStandardCoverageCode(moveToNext?: boolean): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Standard coverage code allocation (%) updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message:
          'Failed to update standard coverage code allocation (%), error occured.',
        duration: 5000,
      },
    };
    if (this._productContextService.isProductDisabled()) {
      if (moveToNext) {
        this._sharedService.nextButtonClicked.next({ stepCount: 1 });
      } else {
        this._router.navigate(['products']);
      }
    } else {
      this.updateCoverageVariant.coveragespremiumregistration =
        this.coverageCodeList;
      this._fillDataModel();
      if (this.ValidateAllocationPercentage(this.coverageCodeList)) {
        this._coverageVariantService
          .updateCoverageVariant(
            this.updateDataModel,
            this.coverageVariantId,
            this.productId,
            this.productVersionId
          )
          .subscribe({
            next: () => {
              this._layoutService.showMessage(toastMessageConfig['success']);
              if (moveToNext) {
                this._sharedService.nextButtonClicked.next({ stepCount: 1 });
              } else {
                this._router.navigate(['products']);
              }
            },
            error: () => {
              this._layoutService.showMessage(toastMessageConfig['error']);
            },
          });
      }
    }
  }

  async submitEdit(data: coveragespremiumregistration[], moveToNext?: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Standard coverage code allocation (%) Updated Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message:
          'Failed to update Standard coverage code allocation (%), error occured.',
        duration: 5000,
      },
    };

    for (let i = 0; i < data.length; i++) {
      this._fillDataModel();
      const coverageId = data[i].coverageId || '';
      data[i].requestId = crypto.randomUUID();
      await this._coverageVariantService
        .updateCoverageCode(
          data[i],
          this.coverageVariantId,
          coverageId,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage(toastMessageConfig['success']);
            if (moveToNext) {
              this._sharedService.nextButtonClicked.next({ stepCount: 1 });
            } else {
              this._router.navigate(['products']);
            }
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
  }

  previous(): void {
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/edit`,
      this.coverageVariantId,
    ]);
  }

  saveAndExit(): void {
    this.updateStandardCoverageCode(false);
  }
  saveAndNext(): void {
    if (!this._productContextService.isProductDisabled()) {
      this.updateStandardCoverageCode(true);
    } else {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    }
  }
}
