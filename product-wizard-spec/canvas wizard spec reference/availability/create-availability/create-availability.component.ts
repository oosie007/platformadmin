import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { SharedService } from '../../../services/shared.service';
import { Standard, StandardAvalability } from '../../../types/availability';
import { MasterData } from '../../../types/product';
import { State_list } from '../../../types/state-list';

@Component({
  selector: 'canvas-create-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, inputUnselectPipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './create-availability.component.html',
  styleUrls: ['./create-availability.component.scss'],
})
export class CreateAvailabilityComponent {
  availabilityForm: FormGroup;
  countrylist!: MasterData[];
  statelist!: State_list[];
  selectedstate!: State_list[];
  blacklistedzipcode: string[] = [];
  selectedcountrycode = '';
  productId = '';
  productVersionId = '';
  isDisabled = false;
  availability: Standard;
  selectedstateValues: string[] = [];
  selectedcountrytext = '';
  toShow = false;
  selectedstates = '';
  addavailability = {
    availabilityId: '',
    country: '',
    state: '',
    locale: 'en',
    blacklistZipCodes: [''],
    requestId: '1',
  };
  country = '';
  /**
   * instantiating the object for post request api call.
   */

  availabilityRequest: StandardAvalability = {
    country: '',
    states: [],
    locale: '',
    blacklistZipCodes: [''],
  };
  toShowtoogle = false;
  constructor(
    private _router: Router,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _fb: FormBuilder,
    private _ref: ChangeDetectorRef
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
    this.country = localStorage.getItem('country') || '';
    // this._updateLayout();
  }

  // private _fetchReferenceData(): void {
  //   combineLatest([
  //     this.availabilityservice.getCountry(),
  //     this.availabilityservice.getState('US'),
  //   ]).subscribe({
  //     next: (response) => {
  //       this.countrylist = response[0];
  //       this.statelist = response[1];
  //       this.availabilityForm.patchValue({
  //         countrycontrol:
  //           this.countrylist
  //             .filter(
  //               (x) => x?.code?.toLowerCase() === this.country.toLowerCase()
  //             )
  //             .map((x) => x.code)[0] ?? '',
  //       });
  //       if (this.country === 'US' || this.country === 'USA') {
  //         this.toShowtoogle = true;
  //       } else {
  //         this.toShowtoogle = false;
  //       }
  //     },
  //     error: () => {
  //       this._layoutService.showMessage({
  //         severity: 'error',
  //         message: 'Unable to fetch data. please try again.',
  //         duration: 5000,
  //       });
  //     },
  //   });
  // }
  // ngOnInit(): void {
  //   this.availabilityForm = this._fb.group({
  //     countrycontrol: [{ value: '', disabled: true }, [Validators.required]],
  //     availabilitybyStates: [false, []],
  //     selectstates: ['', []],
  //     statesChipControl: ['', []],
  //     zipcodes: ['', []],
  //   });

  //   this._fetchReferenceData();
  // }
  // ngDoCheck() {
  //   this._ref.detectChanges();
  // }
  // get field(): { [key: string]: AbstractControl } {
  //   return this.availabilityForm.controls;
  // }

  // onCountryChange() {
  //   const countryData =
  //     this.availabilityForm.get('countrycontrol')?.value ?? '';
  //   if (countryData === 'US' || countryData === 'USA') {
  //     this.toShowtoogle = true;
  //   } else {
  //     this.toShowtoogle = false;
  //   }
  // }

  // onavailabiltyChange() {
  //   const statesData =
  //     this.availabilityForm.get('availabilitybyStates')?.value ?? false;
  //   const countryData =
  //     this.availabilityForm.get('countrycontrol')?.value ?? '';
  //   if (statesData && (countryData === 'US' || countryData === 'USA')) {
  //     this.toShow = true;
  //   } else {
  //     this.toShow = false;
  //   }
  // }

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // createAvailability() {
  //   const country = this.availabilityForm.get('countrycontrol')?.value ?? '';
  //   const statestoogle =
  //     this.availabilityForm.get('availabilitybyStates')?.value ?? false;

  //   if ((country === 'US' || country === 'USA') && statestoogle) {
  //     const countryData =
  //       this.availabilityForm.get('selectstates')?.value ?? [];
  //     const zipCodes = this.availabilityForm.get('zipcodes')?.value ?? [''];
  //     const states = countryData.map((test: State_list) => {
  //       return {
  //         value: test.code,
  //         key: test.id,
  //         category: Category.COUNTRY,
  //       };
  //     });
  //     this.availabilityRequest.country =
  //       this.availabilityForm.get('countrycontrol')?.value ?? '';
  //     this.availabilityRequest.state = states;
  //     this.availabilityRequest.blacklistZipCodes = zipCodes.split(',');
  //     this.availabilityRequest.locale = `en`;
  //   } else if (country != 'US' || country != 'USA') {
  //     this.availabilityRequest.country =
  //       this.availabilityForm.get('countrycontrol')?.value ?? '';
  //     this.availabilityRequest.state = [];
  //     this.availabilityRequest.blacklistZipCodes = [''];
  //     this.availabilityRequest.locale = `en`;
  //   }
  // }

  // createAvailabilityData(moveToNext?: boolean) {
  //   const toastMessageConfig = {
  //     success: {
  //       severity: 'success',
  //       message: 'Availability added successfully.',
  //       duration: 5000,
  //     },
  //     error: {
  //       severity: 'error',
  //       message: 'Unable to add Availability.',
  //       duration: 5000,
  //     },
  //   };
  //   const toastErrorConfig = {
  //     error: {
  //       severity: 'error',
  //       message: 'Duplicate States are not allowed. ',
  //       duration: 5000,
  //     },
  //   };
  //   const isDuplicate = this.selectedstateValues.some((item, index) =>
  //     this.selectedstateValues.includes(item, index + 1)
  //   );
  //   if (isDuplicate) {
  //     this._layoutService.showMessage(toastErrorConfig['error']);
  //     this._router.navigate([`products/${this.productId}/availability`]);
  //     return;
  //   }
  //   this.createAvailability();
  //   this.availabilityservice
  //     .createStandard(
  //       this.availabilityRequest,
  //       this.productId,
  //       this.productVersionId
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         this._layoutService.showMessage(toastMessageConfig['success']);
  //       },
  //       error: () => {
  //         this._layoutService.showMessage(toastMessageConfig['error']);
  //       },
  //     });
  //   if (moveToNext) {
  //     this._router.navigate([`products/${this.productId}/availability`]);
  //   } else {
  //     this._router.navigate(['products']);
  //   }
  // }
  // saveAndExit() {
  //   this.createAvailabilityData(false);
  // }
  // saveAndNext() {
  //   this.createAvailabilityData(true);
  // }

  // /* function to update the layout */
  // private _updateLayout() {
  //   this._layoutService.updateBreadcrumbs([
  //     { label: 'Home', routerLink: 'home' },
  //     { label: 'Products', routerLink: '/products' },
  //     {
  //       label: `${this.productId}`,
  //       routerLink: `/products/${this.productId}/update`,
  //     },
  //     {
  //       label: 'availability',
  //       routerLink: `/products/${this.productId}/Availability`,
  //       active: true,
  //     },
  //   ]);
  //   this._layoutService.caption$.next('');
  // }

  // previous(): void {
  //   this._router.navigate([`products/${this.productId}/availability`]);
  // }

  // /* trigger the event on change of ultiselect dropdown ng model  */
  // onstateChange() {
  //   if (this.selectedstate != null || this.selectedstate != undefined) {
  //     this.addavailability.state = this.selectedstate
  //       .map((x) => x.description)
  //       .join(',');
  //     this.selectedstateValues = this.addavailability.state.split(',');
  //     if (this.selectedstateValues.length <= 0) {
  //       this.isDisabled = true;
  //     } else {
  //       this.isDisabled = false;
  //     }
  //   }
  // }

  // /* on deletion on chips updating the multiselect dropdown model */
  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // clearSelection(_selection: string[]) {
  //   this.selectedstateValues = [];
  //   this.selectedstate = [];
  // }

  // /*  trigger the event on model change of chips */
  // onchipstateChange(event: any) {
  //   if (this.selectedstate != null || this.selectedstate != undefined) {
  //     this.selectedstate = this.selectedstate.filter((selectedState) => {
  //       return event.find((state: any) => selectedState.description == state);
  //     });
  //     if (this.selectedstateValues.length <= 0) {
  //       this.isDisabled = true;
  //     } else {
  //       this.isDisabled = false;
  //     }
  //   }
  // }
}
