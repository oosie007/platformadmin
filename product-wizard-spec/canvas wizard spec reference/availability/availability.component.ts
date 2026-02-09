import { CommonModule, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { CanvasCommandsModule, CommandsModule } from '@canvas/commands';
import {
  ActionsComponent,
  CanvasFormComponent,
  CommandsBarComponent,
  DrawerComponent,
  FieldConfig,
  LayoutComponent,
  LayoutService,
  SearchFilterComponent,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import { SortOrder, TableOptions } from '@canvas/components/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbModalModule,
  CbSearchInputModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { KeyFilterModule } from 'primeng/keyfilter';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { combineLatest, Subscription } from 'rxjs';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  RootAvailability,
  Standard,
  Standards,
  State,
} from '../../types/availability';
import { availabilityColumns } from '../../types/availability-columns';
import { CountryCodes } from '../../types/constants';
import { MasterData } from '../../types/product';

@Component({
  selector: 'canvas-availability',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    TableModule,
    ButtonModule,
    TableComponent,
    CommandsBarComponent,
    KeyFilterModule,
    ActionsComponent,
    LayoutComponent,
    MatIconModule,
    MatMenuModule,
    CbIconModule,
    CbButtonModule,
    CommandsModule,
    ToolbarModule,
    SearchFilterComponent,
    AutoCompleteModule,
    CbSearchInputModule,
    SidebarFormComponent,
    DrawerComponent,
    FieldConfig,
    CanvasFormComponent,
    CanvasCommandsModule,
    CbTooltipModule,
    ToastModule,
    CbModalModule,
  ],
  providers: [MessageService],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AvailabilityComponent implements OnInit, OnDestroy {
  showCreateAvailability = false;
  showEditAvailability = false;
  availabilityList!: Standard[];
  productId: string;
  productVersionId = '';
  state: State;
  stateList: MasterData[] = [];
  standards: Standards;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  options!: TableOptions;
  disabledval = true;
  canSaveExit = false;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  stateVal = '';
  statelst: string[];
  stateValue: string[] = [];

  statelist: MasterData = {
    id: '',
    code: '',
    description: '',
    rank: 0,
  };
  stateData: MasterData[] = [];
  open = true;
  _showModal: boolean;
  countrylist!: MasterData[];
  private subscription: Subscription;
  availabilityId: string;
  /*
   * Constructor injecting availability Service
   */

  constructor(
    private _availabilityService: AvailabilityService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _router: Router,
    private _productContextService: ProductContextService,
    private _productService: ProductsService
  ) {
    this.options = <TableOptions>{
      showPaginator: true,
      defaultSortField: 'country',
      defaultSortOrder: SortOrder.DESC,
      rowsPerPageOptions: [15, 30, 50, 100],
      columns: availabilityColumns,
    };

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

    this.subscription = this._availabilityService._showModalUpdated.subscribe(
      (value) => {
        console.log(value);
        this._showModal = value;
        this.open = true;
      }
    );
    this._updateLayout();
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
        label: 'availability',
        routerLink: `/products/${this.productId}/Availability`,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  /**
   * removes queryparameters from headers.
   */
  private _removeQueryParams() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete this.context?.commands?.get?.parameter?.headers?.queryparameters;
  }
  closeModal() {
    this.open = false;
  }

  ngOnInit() {
    this.getAvailabilities();
    //Clearing up availability Id in IdContext ✏
    this._productContextService._setAvailabilityId('');
  }

  Delete() {
    this.open = false;
    this._availabilityService.deleteAvailability(true);
    this.deleteAvailability();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this._removeQueryParams();
      this.subscription.unsubscribe();
    }
  }

  next(): void {
    this._sharedService.nextButtonClicked.next({
      stepCount: 1,
    });
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  saveAndExit(): void {
    this._router.navigate(['products']);
  }

  onSelectedRow(event: Standard) {
    const msgData = this.countrylist.findIndex(
      (msg) => msg.code === CountryCodes.US
    );
    if (
      !isNullOrUndefined(event) &&
      msgData !== -1 &&
      event.country === this.countrylist[msgData].description
    ) {
      this._productContextService._setAvailabilityId(
        event.availabilityId || ''
      );
      this.disabledval = false;
      localStorage.setItem('availabilityId', event.availabilityId);
      this._router.navigate([`/products/${this.productId}/availability/edit`]);
    }
  }

  deleteAvailability(): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Availability deleted successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to delete availability, error occured.',
        duration: 5000,
      },
    };
    this.availabilityId = this._productContextService._getAvailabilityId();
    this._availabilityService
      .deletestandard(
        this.productId,
        this.productVersionId,
        this.availabilityId
      )
      .subscribe({
        next: (res) => {
          if (res.succeeded === true) {
            this._layoutService.showMessage(toastMessageConfig['success']);
            this.getAvailabilities();
          }
        },
        error: (res) => {
          const { errors } = res.error ?? [];
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
  }

  createAvailability() {
    this._router.navigate([`/products/${this.productId}/availability/create`]);
  }

  getAvailabilities(): void {
    combineLatest([
      this._productService.getCountry(),
      this._productService.getState('US'),
      this._availabilityService.getAvailability(
        this.productId,
        this.productVersionId
      ),
    ]).subscribe({
      next: (response) => {
        this.countrylist = response[0];
        this.stateList = response[1];
        this.bindData(response[2]);
      },
    });
  }

  bindData(response: RootAvailability) {
    this.availabilityList = [];
    this.canSaveExit = this._productContextService.isProductDisabled();

    if (response.standards != null && response.standards.length > 0) {
      response.standards.forEach((items: any) => {
        Object.keys(items).map((row: any) => {
          if (row === 'country') {
            items[row] =
              this.countrylist
                .filter(
                  (x) =>
                    x.description?.toLowerCase() ===
                      items.country.toLowerCase() ||
                    x.code?.toLowerCase() === items.country.toLowerCase()
                )
                .map((x) => x.description)[0] || '';
          }
          if (row === 'states') {
            items[row] = Array.from(items[row])
              .map((x: any) => x?.state?.value)
              .toString();
            const rowData = items[row];
            this.statelst = rowData.split(',');
            for (let i = 0; i < this.statelst.length; i++) {
              this.stateVal = this.statelst[i];
              const itemdata =
                this.stateList
                  .filter(
                    (x) =>
                      x.description?.toLowerCase() ===
                        this.stateVal.toLowerCase() ||
                      x.code?.toLowerCase() === this.stateVal.toLowerCase()
                  )
                  .map((x) => x.description)[0] || '';
              this.stateValue.push(itemdata);
              items[row] = this.stateValue;
            }
          }
        });
      });
      this.availabilityList = response.standards;
      this._productContextService._setAvailabilityId(
        response.standards[0].availabilityId || ''
      );
    }
  }
}
