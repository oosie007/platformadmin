import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService, TableComponent } from '@canvas/components';
import { ColumnOptions, TableOptions } from '@canvas/components/types';
import {
  AppContextService,
  LoadingIndicatorService,
  TableService,
} from '@canvas/services';
import { MasterData } from '@canvas/types';
import { CbButtonModule, CbColorTheme } from '@chubb/ui-components';
import { cloneDeep, isEmpty } from 'lodash-es';
import { TableModule } from 'primeng/table';
import { combineLatest } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  AvailabilityRequest,
  getAvailabilityResponse,
  RootAvailability,
} from '../../types/availability';
import { ProductRequest } from '../../types/product';
import {
  StateConfiguration,
  StateConfigurationLabels,
} from './models/state-configuration';

export enum ButtonAction {
  BACK = 'back',
  NEXT = 'next',
  EXIT = 'exit',
}

@Component({
  selector: 'canvas-state-configuration',
  standalone: true,
  imports: [
    TableComponent,
    CbButtonModule,
    CommonModule,
    TableModule,
    FormsModule,
  ],
  providers: [DatePipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './state-configuration.component.html',
  styleUrl: './state-configuration.component.scss',
})
export class StateConfigurationComponent implements OnInit {
  labels!: StateConfigurationLabels;

  buttonActions = ButtonAction;

  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;

  fetchTableData = false;

  productId!: string;

  productVersionId!: string;

  options: TableOptions;

  clonedOptions: TableOptions;

  attributeColumns: ColumnOptions[];

  attributes!: StateConfiguration[];

  availability: RootAvailability;

  stateList: MasterData[] = [];

  dateFormat = 'yyyy-MM-dd';

  productResponse!: ProductRequest;
  termEndVal: string = 'PERPETUAL';
  clonedOptions1: TableOptions;
  labels1: StateConfigurationLabels;

  editedData: any[] = [];
  editUnifiedData: any[] = [];
  editRowsData: any[];
  isValid: boolean;

  @ViewChild(TableComponent)
  table!: TableComponent<any>;

  constructor(
    private readonly _tableService: TableService,
    private readonly _appContext: AppContextService,
    private readonly _layoutService: LayoutService,
    private readonly _availabilityService: AvailabilityService,
    private readonly _productService: ProductsService,
    private readonly _productContextService: ProductContextService,
    private readonly _sharedService: SharedService,
    private readonly _loaderService: LoadingIndicatorService,
    private datePipe: DatePipe,
    private readonly _router: Router
  ) {
    const { productId, productVersionId } =
      this._productContextService._getProductContext();

    this.productId = productId;
    this.productVersionId = productVersionId;

    this.clonedOptions = <TableOptions>(
      this._appContext.get('pages.product.state-configuration.listOptions')
    );

    this.labels = <StateConfigurationLabels>(
      this._appContext.get('pages.product.state-configuration.labels')
    );

    this.clonedOptions1 = <TableOptions>(
      this._appContext.get(
        'pages.product.stateConfigurationPerptual.listOptions'
      )
    );
    this.labels1 = <StateConfigurationLabels>(
      this._appContext.get('pages.product.stateConfigurationPerptual.labels')
    );

    this._updateLayout();
  }

  ngOnInit(): void {
    this._loaderService.show();
    this.getAvailabilities();
    this.options = cloneDeep(this.clonedOptions);
    if (this._productContextService.isProductDisabled()) {
      delete this.options.editMode;
    }
    this.updateTableBasedOnTermendVal();
  }

  updateMinDateConfig() {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    this.clonedOptions?.columns?.forEach((field) => {
      if (
        ['nonRenewalNotificationDate', 'renewalNotificationDate'].includes(
          field.fieldName
        ) &&
        field.reactiveFieldConfig
      ) {
        field.reactiveFieldConfig.minDate = currentDate;
      }
    });
  }

  getAvailabilities(): void {
    combineLatest([
      this._productService.getState('US'),
      this._availabilityService.getAvailability(
        this.productId,
        this.productVersionId
      ),
    ]).subscribe({
      next: (response) => {
        this.stateList = response[0];
        this.availability = response[1];
        this.availability.standards = this.availability.standards?.map(
          (item) => ({
            ...item,
            state: null,
          })
        );
        this.generateAttributes();
      },
      error: () => {
        this._loaderService.hide();
        this._layoutService.showMessage({
          severity: 'error',
          message: this.labels?.fetchError,
        });
      },
    });
  }

  generateAttributes(): void {
    this.availability?.standards?.[0]?.states.forEach((state) => {
      const { preRenewalPeriodDays, renewalNoticePeriodDays } = state;
      if (preRenewalPeriodDays === null || renewalNoticePeriodDays === null) {
        this.isValid = false;
      } else {
        this.isValid = true;
      }
    });
    this.attributes = this.availability?.standards?.[0]?.states?.map((item) => {
      const state =
        this.stateList
          .filter(
            (x) => x.code?.toLowerCase() === item.state?.value?.toLowerCase()
          )
          .map((x) => x.description)[0] || '';
      return {
        id: uuidv4(),
        state,
        issuingCompany: item.issuingCompany,
        issuingCompanyCode: item.issuingCompanyCode,
        preRenewalPeriodDays: item.preRenewalPeriodDays ?? null,
        renewalNoticePeriodDays: item.renewalNoticePeriodDays ?? null,
        minEarnedPremium: item.minEarnedPremium ?? null,
        isRefundable: item.isRefundable ?? false,
        isEnabledToggleReadOnly: true,
      };
    });
    this._loaderService.hide();
  }

  updateTableBasedOnTermendVal(): void {
    this._loaderService.show();
    this._productService
      .getProduct(this.productId, this.productVersionId)
      .subscribe({
        next: (value) => {
          this.productResponse = value;
          this.termEndVal =
            this.productResponse.lifeCycle?.newPolicy?.periodOfInsurance
              ?.endTerm ?? '';
          if (!isEmpty(this.termEndVal)) {
            if (this.termEndVal === 'RENEW') {
              this.options = cloneDeep(this.clonedOptions);
              this.termEndVal = '';
            } else {
              this.options = cloneDeep(this.clonedOptions1);
              this.termEndVal = '';
              this.isValid = true;
            }
          } else {
            this.options = cloneDeep(this.clonedOptions1);
            this.termEndVal = '';
            this.isValid = true;
          }
          this.options.customSort = (event) => {
            this._tableService.nativeSortWithFavoritesPriority(event);
            this.table.initializeForm();
          };
        },
        error: (err) => {
          this._loaderService.hide();
          this._layoutService.showMessage({
            severity: 'error',
            message: this.labels?.errorTermVal,
          });
          this.termEndVal = '';
        },
        complete: () => {
          this._loaderService.hide();
          this.termEndVal = '';
        },
      });
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
        label: 'State configuration',
        routerLink: `/products/${this.productId}/stateconfiguration`,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  next(): void {
    this._sharedService.nextButtonClicked.next({
      stepCount: 1,
      isRoute: true,
      routeOrFunction: `/products/${this.productId}/coveragevariant`,
    });
    let states = this.availability?.standards[0]?.states;
    /* Invoke API on click of next button */
    if (!isEmpty(this.editedData)) {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: this.labels.sucessMessage,
        },
        error: {
          severity: 'error',
          message: this.labels.errorMessage,
        },
        validationError: {
          severity: 'error',
          message: this.labels.validationErrorMessage,
        },
      };
      this.editRowsData = this.editedData.map((item) => item.data) || [];
      this.editRowsData.forEach((editedRow) => {
        let originalrow = states.find(
          (re) => re.state.value === editedRow.state.value
        );

        if (originalrow) {
          Object.assign(originalrow, editedRow);
        }
      });
      const availabilityRequest: AvailabilityRequest = {
        ...this.availability,
        requestId: uuidv4(),
      };
      this._availabilityService
        .updatestandard(
          availabilityRequest,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: (res: getAvailabilityResponse) => {
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
  }

  exit(): void {
    let states = this.availability?.standards[0]?.states;
    /* Invoke API on click of save and next button */
    if (!isEmpty(this.editedData)) {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: this.labels.sucessMessage,
        },
        error: {
          severity: 'error',
          message: this.labels.errorMessage,
        },
        validationError: {
          severity: 'error',
          message: this.labels.validationErrorMessage,
        },
      };
      this.editRowsData = this.editedData.map((item) => item.data) || [];
      this.editRowsData.forEach((editedRow) => {
        let originalrow = states.find(
          (re) => re.state.value === editedRow.state.value
        );

        if (originalrow) {
          Object.assign(originalrow, editedRow);
        }
      });
      const availabilityRequest: AvailabilityRequest = {
        ...this.availability,
        requestId: uuidv4(),
      };
      this._availabilityService
        .updatestandard(
          availabilityRequest,
          this.productId,
          this.productVersionId
        )
        .subscribe({
          next: (res: getAvailabilityResponse) => {
            this._layoutService.showMessage(toastMessageConfig['success']);
          },
          error: () => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          },
        });
    }
    this._router.navigate(['products']);
  }

  onButtonAction(action: ButtonAction): void {
    if (action) {
      switch (action) {
        case ButtonAction.BACK:
          this.previous();
          break;
        case ButtonAction.NEXT:
          this.next();
          break;
        case ButtonAction.EXIT:
          this.exit();
          break;
        default:
          break;
      }
    }
  }

  saveEditableRow(data: any): void {
    let states = this.availability?.standards[0]?.states;
    let stateCode: string | undefined;
    let editedState;
    this.stateList.map((state) => {
      if (state.description === data.row.state) {
        stateCode = state.code;
      }
    });
    const index = states.findIndex(
      (stateObj) => stateObj.state.value === stateCode
    );
    states.map((item) => {
      if (item.state.value === stateCode) {
        editedState = item.state;
      }
    });
    const rowEdited = { ...data.row, state: editedState };
    const existingIndex = this.editedData.findIndex(
      (d) => d.rowIndex === index
    );
    const toastMessageConfig = {
      validationError: {
        severity: 'error',
        message: this.labels.validationErrorMessage,
      },
    };
    if (!isEmpty(states)) {
      if (
        'preRenewalPeriodDays' in data.row &&
        'renewalNoticePeriodDays' in data.row
      ) {
        if (data.row.preRenewalPeriodDays >= data.row.renewalNoticePeriodDays) {
          if (existingIndex > -1) {
            this.editedData[existingIndex].data = { ...rowEdited };
          } else {
            this.editedData.push({ rowIndex: index, data: { ...rowEdited } });
          }
          const row = {
            ...data.row,
            state: editedState,
          };
          Object.assign(states[index], row);
        } else {
          const {
            issuingCompanyCode,
            issuingCompany,
            isCurrentVersion,
            minEarnedPremium,
            isRefundable,
            preRenewalPeriodDays,
            nonRenewalNotificationDate,
            renewalNoticePeriodDays,
          } = states[index];

          const row = {
            ...{
              issuingCompanyCode,
              issuingCompany,
              isCurrentVersion,
              minEarnedPremium,
              isRefundable,
              preRenewalPeriodDays,
              nonRenewalNotificationDate,
              renewalNoticePeriodDays,
            },
          };
          const attrIndex = this.attributes.findIndex(
            (stateObj) => stateObj.state === data.row.state
          );
          Object.assign(this.attributes[attrIndex], row);
          this._layoutService.showMessage(
            toastMessageConfig['validationError']
          );
          this.isValid = false;
        }
      } else {
        if (existingIndex > -1) {
          this.editedData[existingIndex].data = { ...rowEdited };
        } else {
          this.editedData.push({ rowIndex: index, data: { ...rowEdited } });
        }
        const row = {
          ...data.row,
          state: editedState,
        };
        Object.assign(states[index], row);
        this.isValid = true;
      }
    }
  }

  handleformValidity(event: any) {
    return event === 'VALID' ? (this.isValid = true) : (this.isValid = false);
  }
}
