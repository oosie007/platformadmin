/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  CommandsBarComponent,
  LayoutComponent,
  LayoutService,
} from '@canvas/components';
import {
  CbButtonModule,
  CbCheckboxModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbRadioModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbTextAreaModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { isEmpty } from 'lodash-es';
import { ChipsModule, ChipsRemoveEvent } from 'primeng/chips';
import {
  MultiSelectChangeEvent,
  MultiSelectModule,
  MultiSelectSelectAllChangeEvent,
} from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { combineLatest } from 'rxjs';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { AvailabilityService } from '../../../services/availability.service';
import { ProductContextService } from '../../../services/product-context.service';
import { SharedService } from '../../../services/shared.service';
import {
  AvailabilityRequest,
  MainState,
  Standard,
} from '../../../types/availability';
import { MasterData, Statuskeys } from '../../../types/product';
import { Category } from '../../../types/ref-data';
import { State_list } from '../../../types/state-list';
@Component({
  selector: 'canvas-edit-availability',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    inputUnselectPipe,
    CbButtonModule,
    CbTooltipModule,
    CbIconModule,
    CbSelectMultipleModule,
    MultiSelectModule,
    CbToggleModule,

    LayoutComponent,
    CommandsBarComponent,
    CbInputModule,
    CbSelectChoiceModule,
    CbTextAreaModule,
    CbCheckboxModule,
    CbRadioModule,
    RouterModule,
    ToastModule,
    ChipsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './edit-availability.component.html',
  styleUrls: ['./edit-availability.component.scss'],
})
export class EditAvailabilityComponent {
  availabilityId: string;
  availabilityForm: FormGroup;
  countrylist!: MasterData[];
  stateList!: State_list[];
  allStateList!: State_list[];
  selectedState!: State_list[];
  blacklistedzipcode: string[] = [];
  selectedcountrycode = '';
  productId = '';
  productVersionId = '';
  availability: Standard;
  selectedStateValues: string[] = [];
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  selectedcountrytext = '';
  toShow = false;
  addavailability = {
    availabilityId: '',
    country: '',
    state: '',
    locale: 'en',
    blacklistZipCodes: [''],
    requestId: '1',
  };
  toShowtoogle = false;
  /**
   * instantiating the object for post request api call.
   */

  availabilityRequest: AvailabilityRequest = {
    requestId: '',
    standards: [],
    ruleSets: [],
  };

  issuingCompany = null;

  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  productstatus: string;
  isSelect: boolean;
  disableClrSelection = false;
  selectAllStates = false;

  constructor(
    private availabilityservice: AvailabilityService,
    private _router: Router,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _fb: FormBuilder,
    private _ref: ChangeDetectorRef,
    private _productContextService: ProductContextService
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
      localStorage.getItem('availabilityId') != null ||
      localStorage.getItem('availabilityId') != undefined
    ) {
      this.availabilityId = this._productContextService._getAvailabilityId();
    }

    this._updateLayout();
    this.productstatus =
      this._productContextService._getProductContext().status;
  }

  private _fetchReferenceData(): void {
    combineLatest([
      this.availabilityservice.getCountry(),
      this.availabilityservice.getState('US'),
      this.availabilityservice.getavailabilitybyId(
        this.productId,
        this.productVersionId,
        this.availabilityId
      ),
    ]).subscribe({
      next: (response) => {
        this.countrylist = response[0];
        this.allStateList = [...response[1]];
        this.stateList = response[1]?.map((item) => {
          return {
            code: item.code,
            description: item.description,
            disabled: false,
            category: Category.STATE,
          };
        });
        this.availability = response[2];
        if (response[2] != null && response[2] != undefined) {
          this.availability?.states?.map((item) => {
            this.stateList?.map((state) => {
              if (state.code === item?.state?.value && !item.isCurrentVersion) {
                state.disabled = true;
              }
            });
          });
          this._prefillData(response[2]);
        }
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Unable to fetch data. please try again.',
          duration: 5000,
        });
      },
    });
  }

  ngOnInit(): void {
    this.availabilityForm = this._fb.group({
      countrycontrol: [{ value: '', disabled: true }, [Validators.required]],
      availabilitybyStates: [false, []],
      selectStates: ['', []],
      statesChipControl: ['', []],
      zipcodes: ['', []],
    });

    this._fetchReferenceData();
    if (this.productstatus === Statuskeys.FINAL) {
      this.isSelect = true;
    } else {
      this.isSelect = false;
    }
    if (
      this._productContextService._getProductContext().status ===
      Statuskeys.FINAL
    ) {
      this.availabilityForm.disable();
    }
  }

  ngDoCheck() {
    this._ref.detectChanges();
  }

  get field(): { [key: string]: AbstractControl } {
    return this.availabilityForm.controls;
  }

  private _mapPrefillForm(states: MainState[]): { [key: string]: unknown } {
    const stateTypes = states?.map((group) => {
      const isCurrentVersion = group?.isCurrentVersion ?? true;
      if (!isCurrentVersion) {
        this.disableClrSelection = true;
        this.availabilityForm.get('availabilitybyStates')?.disable();
      }
      return {
        code: group?.state?.value,
        description: this.stateList?.find(
          (ins) => ins.code == group?.state?.value
        )?.description,
        disabled: !isCurrentVersion,
        category: Category.STATE,
      };
    });
    this.selectedState = stateTypes;
    if (stateTypes != null || stateTypes != undefined) {
      this.addavailability.state = stateTypes
        .map((x) => x.description)
        .join(',');
      if (this.addavailability.state.length) {
        this.selectedStateValues = this.addavailability.state.split(',');
      }
    }
    return { stateTypes };
  }

  private _prefillData(data: Standard) {
    if (data != null && data != undefined) {
      if (data.country === 'US' || data.country === 'USA') {
        if (
          data.states?.length > 0 ||
          data.blacklistZipCodes.toString().length > 0
        ) {
          this.availabilityForm.patchValue({
            availabilitybyStates: true,
          });

          this.toShow = true;
          this.toShowtoogle = true;
        } else {
          this.availabilityForm.patchValue({
            availabilitybyStates: false,
          });
        }
        this.toShowtoogle = true;
      } else {
        this.availabilityForm.patchValue({
          availabilitybyStates: false,
        });
        this.toShowtoogle = false;
        this.toShow = false;
      }
      const { stateTypes } = this._mapPrefillForm(data.states);

      this.availabilityForm.patchValue({
        countrycontrol:
          this.countrylist
            .filter(
              (x) => x?.code?.toLowerCase() === data?.country.toLowerCase()
            )
            .map((x) => x.code)[0] ?? '',
        selectStates: stateTypes,
        statesChipControl: stateTypes,
        zipcodes: data.blacklistZipCodes.toString(),
      });
    }
  }

  onCountryChange() {
    const countryData =
      this.availabilityForm.get('countrycontrol')?.value ?? '';
    if (countryData === 'US' || countryData === 'USA') {
      this.toShowtoogle = true;
    } else {
      this.toShowtoogle = false;
      this.toShow = false;
    }
  }

  onavailabiltyChange() {
    const statesData =
      this.availabilityForm.get('availabilitybyStates')?.value ?? false;
    const countryData =
      this.availabilityForm.get('countrycontrol')?.value ?? '';
    if (statesData && (countryData === 'US' || countryData === 'USA')) {
      this.toShow = true;
    } else {
      this.toShow = false;
    }
  }

  prepareState(state: State_list): MainState {
    return {
      state: {
        key: '',
        value: state.code || '',
        category: Category.STATE,
      },
      isCurrentVersion: !state.disabled,
      issuingCompany: this.issuingCompany || '',
      issuingCompanyCode: this.issuingCompany || '',
    };
  }

  createAvailability() {
    const country = this.availabilityForm.get('countrycontrol')?.value ?? '';
    const statestoogle =
      this.availabilityForm.get('availabilitybyStates')?.value ?? false;
    if ((country === 'US' || country === 'USA') && statestoogle) {
      const countryData =
        this.availabilityForm.get('selectStates')?.value ?? [];
      const zipCodes = this.availabilityForm.get('zipcodes')?.value ?? [''];
      let states;
      if (this.availability?.states && !isEmpty(this.availability.states)) {
        const map1 = new Map(
          this.availability.states.map((obj) => [obj.state.value, obj])
        );
        states = countryData.map((obj2: State_list) => {
          const code = obj2.code ?? '';
          const obj1 = map1.get(code);
          return obj1 ? obj1 : this.prepareState(obj2);
        });
      } else {
        states = countryData.map((test: State_list) => {
          return this.prepareState(test);
        });
      }

      this.availabilityRequest.standards.push({
        country: this.availabilityForm.get('countrycontrol')?.value ?? '',
        states,
        locale: this.availabilityForm.get('countrycontrol')?.value ?? '',
        blacklistZipCodes: zipCodes.split(','),
        availabilityId: this.availabilityId,
      });
    } else if (country != 'US' || country != 'USA') {
      this.availabilityRequest.standards.push({
        country: this.availabilityForm.get('countrycontrol')?.value ?? '',
        states: [],
        locale: this.availabilityForm.get('countrycontrol')?.value ?? '',
        blacklistZipCodes: [''],
        availabilityId: this.availabilityId,
      });
    }
  }

  bindformData() {
    this.availabilityRequest = {
      requestId: '1',
      standards: this.availabilityRequest.standards,
      ruleSets: [],
    };
  }

  updateAvailability(moveToNext?: boolean) {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Availability updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Unable to update Availability.',
        duration: 5000,
      },
    };

    const toastErrorConfig = {
      error: {
        severity: 'error',
        message: 'Duplicate States are not allowed. ',
        duration: 5000,
      },
    };

    const isDuplicate = this.selectedStateValues.some((item, index) =>
      this.selectedStateValues.includes(item, index + 1)
    );
    if (isDuplicate) {
      this._layoutService.showMessage(toastErrorConfig['error']);
      return;
    }
    this.createAvailability();
    this.bindformData();
    this.availabilityservice
      .updatestandard(
        this.availabilityRequest,
        this.productId,
        this.productVersionId
      )
      .subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
          if (moveToNext) {
            this._router.navigate([`products/${this.productId}/availability`]);
          } else {
            this._router.navigate(['products']);
          }
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
  }

  saveAndExit() {
    this.updateAvailability(false);
  }

  saveAndNext() {
    this.updateAvailability(true);
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
        label: 'availability',
        routerLink: `/products/${this.productId}/Availability`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  previous(): void {
    this._router.navigate([`products/${this.productId}/availability`]);
  }

  next(): void {
    this._router.navigate([`products/${this.productId}/availability`]);
  }

  onMultiSelectChange(event: MultiSelectChangeEvent): void {
    if (event.itemValue) {
      this.availabilityForm?.get('statesChipControl')?.patchValue(event.value);
    }
  }

  onMultiSelectSelectAllChange(event: MultiSelectSelectAllChangeEvent): void {
    this.selectAllStates = event.checked;
    this.selectedState = event.checked
      ? [...this.stateList]
      : [...this.stateList.filter((item) => item.disabled)];
    this.availabilityForm
      ?.get('statesChipControl')
      ?.patchValue(this.selectedState);
  }

  private deleteError(): void {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: 'Delete States from previous version not possible.',
      },
    };
    this._layoutService.showMessage(toastMessageConfig['error']);
  }

  onChipRemove(event: ChipsRemoveEvent): void {
    if (event.value.disabled) {
      const stateValue =
        this.availabilityForm?.get('selectStates')?.value ?? [];
      this.availabilityForm.patchValue({
        statesChipControl: stateValue,
      });
      this.deleteError();
    } else {
      const selectedTypes = this.availabilityForm?.get('selectStates')?.value;
      this.availabilityForm?.patchValue({
        selectStates: selectedTypes.filter(
          (ele: { code: string }) => ele.code !== event.value.code
        ),
      });
      this.selectedState.length === this.stateList.length
        ? (this.selectAllStates = true)
        : (this.selectAllStates = false);
    }
  }

  /* on deletion on chips updating the multiselect dropdown model */
  clearSelection() {
    this.selectAllStates = false;
    this.availabilityForm?.get('selectStates')?.reset();
    this.availabilityForm?.get('statesChipControl')?.reset();
  }
}
