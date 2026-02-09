import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService } from '@canvas/components';
import { AppContextService, RegionService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbRadioModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { chain, first, get } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ChipsModule } from 'primeng/chips';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { CoverageVariantsService } from '../../services/coverage-variants.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  coveragespremiumregistration,
  CoverageVariant,
} from '../../types/coverage';
import { PremiumAllocationLabels } from '../../types/premium-allocation';
import {
  BreakDownType,
  MasterData,
  PremiumAllocationColumns,
} from '../../types/product';

@Component({
  selector: 'canvas-premium-allocation',
  standalone: true,
  templateUrl: './premium-allocation.component.html',
  styleUrl: './premium-allocation.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService],
  imports: [
    CommonModule,
    AccordionModule,
    CbRadioModule,
    CbSelectChoiceModule,
    CbIconModule,
    CbButtonModule,
    CbInputModule,
    TableModule,
    FormsModule,
    ToastModule,
    ChipsModule,
    CbSelectMultipleModule,
    MultiSelectModule,
    CbTooltipModule,
    inputUnselectPipe,
    CbToggleModule,
    ReactiveFormsModule,
  ],
})
export class PremiumAllocationComponent {
  productId!: string;
  productVersionId!: string;
  productstatus: string;
  isDisable = false;
  fieldsetDisabled = false;
  cbColorTheme = CbColorTheme;
  colorTheme: CbColorTheme = this.cbColorTheme.DEFAULT;
  hasManualBreakdown = false;
  breakDownTypeList: MasterData[];
  defaultPremium = 'STDCOVER';
  statusData: MasterData[] = [];
  productRequest!: any;
  coverageVariants: CoverageVariant[];
  expanded = true;
  premiumForm: FormGroup;
  protected iconSize: CbIconSize = CbIconSize.REGULAR;
  labels!: PremiumAllocationLabels;
  selectedBreakDownType: string;
  disableEdit = false;
  premiumAllocation:boolean;
  isPremiumEnabled:boolean;

  constructor(
    private readonly _appContextService: AppContextService,
    private readonly _productService: ProductsService,
    private readonly _router: Router,
    private readonly _layoutService: LayoutService,
    private readonly _sharedService: SharedService,
    private readonly _productContextService: ProductContextService,
    protected regionService: RegionService,
    protected readonly _coverageVariantService: CoverageVariantsService,
    private readonly _fb: FormBuilder,
    private readonly _messageService: MessageService
  ) {
    this.productId = localStorage?.getItem('productId') ?? '';
    this.productVersionId = localStorage?.getItem('productVersionId') ?? '';
    this.loadBreakDownTypeList();

    this.productstatus =
      this._productContextService._getProductContext().status;
      this.premiumAllocation=this._productContextService._getPartnerProvidedData();
      if(this.premiumAllocation){
        this.hasManualBreakdown=false;
        this.isPremiumEnabled=true;
      }
      else this.isPremiumEnabled=false;
    if (this._productContextService.isProductDisabled()) {
      this.isDisable = true;
      this.fieldsetDisabled = true;
    }
    this._updateLayout();

    this.premiumForm = this._fb.group({
      breakDownType: [
        {
          value: '',
          disabled: !!this.fieldsetDisabled,
        },
        [Validators.required],
      ],
      coverageVariants: this._fb.array([], this.coverageTotalValidator()),
    });
    this.labels = <PremiumAllocationLabels>(
      this._appContextService.get('pages.productPremiumAllocation.labels')
    );
  }

  ngOnInit(): void {
    this.getProductDetails(this.productId, this.productVersionId);
  }

  /* styles for layout */
  private _updateLayout() {
    this._layoutService.caption$.next(``);
    this._layoutService.updateBreadcrumbs([
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
      {
        label: 'Premium allocation',
        routerLink: `/products/${this.productId}/premium-allocation`,
      },
    ]);
  }

  loadBreakDownTypeList() {
    this._productService.getBreakDownType().subscribe({
      next: (resp) => {
        this.breakDownTypeList = resp;
      },
      error: () => {
        this._layoutService.showMessage({
          severity: 'error',
          message: 'Unable to fetch premium breakdown',
          duration: 5000,
        });
      },
    });
  }

  onPremiumToggleChange(e: Event) {
    this.hasManualBreakdown = !this.hasManualBreakdown;
  }

  updateCoverageVariants(moveToNext: boolean): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Premium allocation (%) updated successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'Failed to update premium allocation (%), error occurred.',
        duration: 5000,
      },
      validation: {
        key: 'tr',
        severity: 'error',
        summary: 'Error',
        detail: 'Allocation Percentage Should be 100 %',
        life: 5000,
        sticky: true,
        closable: true,
      },
    };

    const handleNavigation = () => {
      if (moveToNext) {
        this._sharedService.nextButtonClicked.next({ stepCount: 1 });
      } else {
        this._router.navigate(['products']);
      }
    };

    const updateProductInfo = () => {
      const request = {
        ...this.productRequest,
        requestId: crypto.randomUUID(),
      };
      this._productService.updateAllProductInfo(request).subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig['success']);
          handleNavigation();
        },
        error: () => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        },
      });
    };

    if (this._productContextService.isProductDisabled()) {
      handleNavigation();
    } else if (!this.hasManualBreakdown && !this.isPremiumEnabled) {
      this.productRequest.rating.hasManualBreakdown = this.hasManualBreakdown;
      updateProductInfo();
    } else if (this.premiumForm.valid) {
      this.productRequest.coverageVariants = this.getCoverageVariantsRequest();
      this.productRequest.rating = {
        ...this.productRequest.rating,
        hasManualBreakdown: this.hasManualBreakdown,
        breakDownType: this.breakDownType.value,
      };
      updateProductInfo();
    } else {
      this._messageService.add(toastMessageConfig['validation']);
    }
  }

  getCoverageVariantsRequest() {
    const list = this.coverageVariants;
    const formValues = this.coverageVariantsArray?.controls;
    const breakdownType = this.breakDownType.value;
    if (breakdownType === BreakDownType.STDCOVER) {
      list.forEach((coverageVariant: CoverageVariant) => {
        coverageVariant.allocationPercent = 1;
        coverageVariant.coveragespremiumregistration?.forEach(
          (stdVariant: coveragespremiumregistration) => {
            const formData = formValues.find(
              (control) =>
                control?.get('coveragesRef')?.value?.id ===
                stdVariant.stdCoverageCode
            );
            if (formData) {
              stdVariant.allocationPercent =
                formData?.get('allocationPercent')?.value;
            }
          }
        );
      });
      return list;
    } else if (breakdownType === BreakDownType.COVGVAR) {
      formValues.forEach((control: any) => {
        const id = control?.get('coveragesRef')?.value?.id;

        list.forEach((coverageVariant: CoverageVariant) => {
          if (coverageVariant.coverageVariantId === id) {
            coverageVariant.allocationPercent =
              control.get('allocationPercent').value;
          }
        });
      });
      return list;
    }
    return this.coverageVariants;
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  getBreakDownType() {
    return this.premiumForm.get('breakDownType')?.value;
  }

  // Getter for coverageVariants
  get coverageVariantsArray(): FormArray {
    return this.premiumForm.get('coverageVariants') as FormArray;
  }

  // Getter for breakdown
  get breakDownType(): FormControl {
    return this.premiumForm.get('breakDownType') as FormControl;
  }

  coverageTotalValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const total = control.value.reduce(
        (allocation: number, variant: CoverageVariant) => {
          return Number(allocation) + Number(variant.allocationPercent);
        },
        0
      );
      if (total !== 100) {
        return { coverageTotalError: { value: total } };
      }
      return null;
    };
  }

  // premiumTotalValidator(): ValidatorFn {
  //   return (control: AbstractControl): ValidationErrors | null => {
  //     const total = control.value.reduce((allocation: number, premium: any) => {
  //       return Number(allocation) + Number(premium.premiumAllocationPercent);
  //     }, 0);
  //     if (total !== 100) {
  //       return { premiumTotalError: { value: total } };
  //     }
  //     return null;
  //   };
  // }

  saveAndExit(): void {
    this.updateCoverageVariants(false);
  }

  saveAndNext(): void {
    if (!this._productContextService.isProductDisabled()) {
      this.updateCoverageVariants(true);
    } else {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    }
  }

  initPremiumAllocations(data: PremiumAllocationColumns[]) {
    const coverageVariantsFormArray = this.coverageVariantsArray;
    data.forEach((variant: any, i: number) => {
      const coverageGroup = this.createCoverageGroup(variant);
      coverageVariantsFormArray.push(coverageGroup);
    });
  }

  createCoverageGroup(variant: CoverageVariant) {
    return this._fb.group({
      coveragesRef: variant,
      allocationPercent: [
        {
          value: variant.allocationPercent,
          disabled: !!this.fieldsetDisabled,
        },
        [
          Validators.required,
          Validators.min(1),
          Validators.max(100),
          Validators.pattern('^\\d*(\\.\\d+)?$'),
        ],
      ],
    });
  }

  standardCoverageCodeList(
    data: CoverageVariant[]
  ): PremiumAllocationColumns[] {
    const uniqueCodesArray = chain(data)
      .flatMap((item) => item.coveragespremiumregistration || [])
      .groupBy('stdCoverageCode')
      .map((items, code) => ({
        id: code,
        name: get(first(items), 'stdCoverageDescription', ''),
        allocationPercent: get(first(items), 'allocationPercent'),
      }))
      .value();
    return uniqueCodesArray;
  }

  coverageVariantList(data: CoverageVariant[]): PremiumAllocationColumns[] {
    const uniqueCodesArray = data.map((item) => {
      return {
        id: item.coverageVariantId,
        name: item.name,
        allocationPercent: item.allocationPercent,
      };
    });
    return uniqueCodesArray;
  }

  getProductDetails(_productId: string, _productVersionId: string): void {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: `Product details fetch failed`,
        duration: 5000,
      },
    };
    this._productService
      .getProductFull(_productId, _productVersionId)
      .subscribe({
        next: (resp) => {
          if (resp) {
            this.productRequest = resp;
            if (!isNullOrUndefined(this.productRequest?.coverageVariants)) {
              this.coverageVariants = this.productRequest?.coverageVariants;
              const { hasManualBreakdown, breakDownType } =
                this.productRequest?.rating || {};
              this.hasManualBreakdown = !isNullOrUndefined(hasManualBreakdown)
                ? hasManualBreakdown
                : false;
              this.selectedBreakDownType = breakDownType ?? '';
              this.premiumForm.patchValue({
                breakDownType: breakDownType,
              });
            }
            this.loadPremiumAllocation();
          if(this.hasManualBreakdown == false && this.isPremiumEnabled==false){
            Object.defineProperty(this.premiumForm, 'valid', { get: () => true });
           // this.premiumForm.valid;
          }else this.premiumForm.invalid;
          }
        },
        error: (e) => {
          this._layoutService.showMessage(toastMessageConfig['error']);
          console.log('error: ' + e);
        },
      });
  }

  loadPremiumAllocation() {
    let tableData: PremiumAllocationColumns[];
    const breakDownType = this.breakDownType.value ?? '';
    switch (breakDownType) {
      case BreakDownType.COVGVAR:
        tableData = this.coverageVariantList(this.coverageVariants);
        break;
      case BreakDownType.STDCOVER:
        tableData = this.standardCoverageCodeList(this.coverageVariants);
        break;
      default:
        console.error('Invalid defaultPremium value:', this.defaultPremium);
        return;
    }

    this.initPremiumAllocations(tableData);
  }

  reRenderTable() {
    
    this.resetFormToOriginal();
    this.loadPremiumAllocation();
    // if(this.hasManualBreakdown){
    //   this.premiumForm.valid;
    // }
    // else this.premiumForm.invalid;
  }

  resetFormToOriginal() {
    this.premiumForm = this._fb.group({
      breakDownType: this.breakDownType,
      coverageVariants: this._fb.array([], this.coverageTotalValidator()),
    });
  }
}
