/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  DrawerComponent,
  FieldConfig,
  LayoutComponent,
  LayoutService,
  SidebarFormComponent,
} from '@canvas/components';
import {
  CbButtonModule,
  CbCheckboxModule,
  CbColorTheme,
  CbIconModule,
  CbInputModule,
  CbSelectChoiceModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';
import { combineLatest, Observable } from 'rxjs';
import { inputUnselectPipe } from '../../pipes/input-unselect.pipe';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import {
  MultiRatingModel,
  RatingData,
  RatingFactorModel,
  RatingItemModel,
} from '../../types/rating';

@Component({
  selector: 'canvas-rating-factors',
  standalone: true,
  imports: [
    CommonModule,
    CbCheckboxModule,
    CbButtonModule,
    CbSelectChoiceModule,
    FormsModule,
    SidebarFormComponent,
    FieldConfig,
    ReactiveFormsModule,
    DrawerComponent,
    CbInputModule,
    CbToggleModule,
    LayoutComponent,
    CbTooltipModule,
    CbIconModule,
    inputUnselectPipe,
  ],
  templateUrl: './rating-factors.component.html',
  styleUrls: ['./rating-factors.component.scss'],
})
export class RatingFactorsComponent implements OnInit {
  ratingFactorListForm: FormGroup;
  addRatingFactorForm: FormGroup;
  editRatingFactorForm: FormGroup;
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  customProductAttributes: any;
  openCreateDrawer = false;
  openEditDrawer = false;
  productRatingFactors: RatingItemModel[];
  premiumRatingFactor!: RatingData[];
  applySelectAll = false;
  editingIndex: number | undefined | null;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  checkboxcolortheme = CbColorTheme.DEFAULT;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  model: MultiRatingModel = {
    ratingFactorName: '',
    allowCustom: '',
    associatedAttribute: '',
    answerId_1: '',
    answerValue_1: '',
    answerId_2: '',
    answerValue_2: '',
    answerId_3: '',
    answerValue_3: '',
    answerId_4: '',
    answerValue_4: '',
    answerId_5: '',
    answerValue_5: '',
  };
  addRatingSchema: UIKitNgxFormlyFormJsonSchema;
  isDisabled = false;

  get formArray(): FormArray {
    return (<FormGroup>this.ratingFactorListForm.get('ratingFactorsList'))
      ?.controls['ratingFactors'] as FormArray;
  }

  get values(): FormArray {
    return this.addRatingFactorForm.get('values') as FormArray;
  }

  get editCustomValues(): FormArray {
    return this.editRatingFactorForm.get('values') as FormArray;
  }
  get editField(): { [key: string]: AbstractControl } {
    return this.editRatingFactorForm.controls;
  }

  constructor(
    private productService: ProductsService,
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _router: Router,
    private _fb: FormBuilder,
    private _productContextService: ProductContextService
  ) {
    this._updateLayout();
  }
  private _updateLayout() {
    this._layoutService.headerStyle$.next('layout__header--product');
    this._layoutService.captionStyle$.next('layout__caption--product');
    this._layoutService.updateBreadcrumbs([
      { label: 'Products', routerLink: '/products' },
      { label: 'RatingFactors' },
    ]);
  }

  ngOnInit() {
    const statusVal = this._productContextService.isProductDisabled();

    this.productId = localStorage?.getItem('productId') || 'SXDPTST12';
    this.productVersionId = localStorage?.getItem('productVersionId') || '1.0';
    this.coverageVariantId =
      localStorage?.getItem('coverageVariantId') || 'LOANPR';
    this.productService
      .getProductAttributes(this.productId, this.productVersionId)
      .subscribe((res) => {
        this.customProductAttributes = res;
      });
    this.ratingFactorListForm = this._fb.group({
      ratingFactorsList: this._fb.group({
        ratingFactors: this._fb.array([]),
      }),
    });
    this.addRatingFactorForm = this._fb.group({
      ratingFactorName: [
        { value: '', disabled: statusVal ? true : false },
        Validators.required,
      ],
      allowCustom: [{ value: false, disabled: statusVal ? true : false }],
      associatedAttribute: [{ value: '', disabled: statusVal ? true : false }],
      values: this._fb.array([]),
    });
    this.addDefinedValue();
    this.addRatingFactorForm
      .get('allowedCustom')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.addRatingFactorForm.get('associatedAttribute')?.disable();
          this.addRatingFactorForm.get('associatedAttribute')?.setValue('');
          this.addRatingFactorForm
            .get('associatedAttribute')
            ?.clearValidators();
          this.addRatingFactorForm
            .get('values')
            ?.setValidators([Validators.required, Validators.minLength(1)]);
        } else {
          this.addRatingFactorForm.get('associatedAttribute')?.enable();
          this.addRatingFactorForm
            .get('associatedAttribute')
            ?.setValidators([Validators.required]);
          this.addRatingFactorForm.get('values')?.clearValidators();
        }
        this.addRatingFactorForm.get('values')?.updateValueAndValidity();
        this.addRatingFactorForm
          .get('associatedAttribute')
          ?.updateValueAndValidity();
      });

    combineLatest([
      this.productService.getProductRatingFactors(),
      this.productService.getProductPremiumRatingFactors(
        this.productId,
        this.productVersionId
      ),
    ]).subscribe(([res1, res2]) => {
      const combinedRatingFactor: RatingFactorModel[] = [];
      // combine array without duplicates
      res1.forEach((item) => {
        const matchItemIndex = res2.findIndex(
          (elem) => elem.name === item.description
        );
        if (matchItemIndex !== -1) {
          combinedRatingFactor.push({ ...item, selected: true });
          res2.splice(matchItemIndex, 1);
        } else {
          combinedRatingFactor.push({ ...item, selected: false });
        }
      });
      // items of res2 that are not duplicates
      res2.forEach((item) => {
        combinedRatingFactor.push({ ...item, selected: true });
      });

      combinedRatingFactor.forEach((item) => {
        this.formArray.push(
          this._fb.group({
            label: item.description ? item.description : item.name,
            selected: item.selected,
            category: item.category ? item.category : item.id,
            type: item.type ? item.type : 'Global',
            associatedProductAttribute: item.associatedProductAttribute || '',
            values: item.values
              ? this._fb.array(item.values)
              : this._fb.array([]),
          })
        );
      });
    });
    if (this._productContextService.isProductDisabled()) {
      this.ratingFactorListForm.disable();
      this.addRatingFactorForm.disable();
      this.isDisabled = true;
    }
  }

  newDefinedValue(): FormGroup {
    return this._fb.group({
      answerID: ['', Validators.required],
      answerValue: ['', Validators.required],
    });
  }
  addDefinedValue(): void {
    this.values.push(this.newDefinedValue());
  }
  addDefinedValueEdit(): void {
    this.editCustomValues.push(this.newDefinedValue());
  }
  removeDefinedValue(i: number): void {
    this.values.removeAt(i);
  }
  removeDefinedValueEdit(i: number): void {
    this.editCustomValues.removeAt(i);
  }
  getRatingFormControls() {
    return this.ratingFactorListForm.get('ratingFactors') as FormArray;
  }

  public toggleDrawer() {
    this.openCreateDrawer = !this.openCreateDrawer;
    this.clearRatingFactorForm();
  }

  public toggleEditDrawer() {
    this.openEditDrawer = !this.openEditDrawer;
    this.editRatingFactorForm.reset();
  }
  clearRatingFactorForm() {
    this.addRatingFactorForm.reset();
    const values = this.addRatingFactorForm.get('values') as FormArray;
    values.clear();
    this.addDefinedValue();
  }

  onSaveRatingFactor() {
    const formValue = this.addRatingFactorForm.value;
    const isAllowCustom = formValue?.allowCustom;
    const values = formValue.values.map(
      (i: { answerID: string; answerValue: string }) => {
        const val = {
          key: i.answerID,
          value: i.answerValue,
          desc: i.answerValue,
        };
        return val;
      }
    );
    if (isAllowCustom) {
      this.formArray.push(
        this._fb.group({
          label: formValue?.ratingFactorName,
          selected: true,
          category: formValue?.ratingFactorName,
          type: 'Custom',
          associatedProductAttribute: '',
          values: this._fb.array(values),
        })
      );
    } else {
      this.formArray.push(
        this._fb.group({
          label: formValue?.ratingFactorName,
          selected: true,
          category: formValue?.ratingFactorName,
          type: 'Custom',
          associatedProductAttribute: formValue?.associatedAttribute,
          values: [],
        })
      );
    }

    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Rating Factor Saved Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'error occured. please try again after sometime.',
        duration: 5000,
      },
      warning: {
        severity: 'warn',
        message: 'Product could not be updated as it is in Final status',
        duration: 5000,
      },
    };
    this.saveRatingFactors().subscribe({
      next: () => {
        this._layoutService.showMessage(toastMessageConfig[`success`]);
        this.toggleDrawer();
      },
      error: (res) => {
        if (String(res.error).includes('not allowed for update operation')) {
          // this._layoutService.showMessage(toastMessageConfig['warning']);
        } else {
          this._layoutService.showMessage(toastMessageConfig[`error`]);
        }
      },
    });
  }
  onEditRatingFactor() {
    let formItem;
    const formValue = this.editRatingFactorForm.value;
    const isAllowCustom = formValue?.allowCustom;
    const values = formValue.values.map(
      (i: { answerID: string; answerValue: string }) => {
        const val = {
          key: i.answerID,
          value: i.answerValue,
          desc: i.answerValue,
        };
        return val;
      }
    );
    if (isAllowCustom) {
      formItem = this._fb.group({
        label: formValue?.ratingFactorName,
        selected: true,
        category: formValue?.ratingFactorName,
        type: 'Custom',
        associatedProductAttribute: '',
        values: this._fb.array(values),
      });
    } else {
      formItem = this._fb.group({
        label: formValue?.ratingFactorName,
        selected: true,
        category: formValue?.ratingFactorName,
        type: 'Custom',
        associatedProductAttribute: formValue?.associatedAttribute,
        values: [],
      });
    }
    if (this.editingIndex && formItem) {
      this.formArray.removeAt(this.editingIndex);
      this.formArray.insert(this.editingIndex, formItem);
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Rating Factor Edit Successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'error occured. please try again after sometime.',
          duration: 5000,
        },
        warning: {
          severity: 'warn',
          message: 'Product could not be updated as it is in Final status',
          duration: 5000,
        },
      };
      this.saveRatingFactors().subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig[`success`]);
          this.toggleEditDrawer();
          this.editingIndex = null;
        },
        error: (res) => {
          if (String(res.error).includes('not allowed for update operation')) {
            // this._layoutService.showMessage(toastMessageConfig['warning']);
          } else {
            this._layoutService.showMessage(toastMessageConfig[`error`]);
          }
        },
      });
    }
  }
  onSubmit(formValue: MultiRatingModel) {
    if (formValue.allowCustom) {
      this.formArray.push(
        this._fb.group({
          label: formValue.ratingFactorName,
          selected: true,
          category: formValue.ratingFactorName,
          type: 'Custom',
          associatedProductAttribute: '',
          answerId_1: formValue.answerId_1,
          answerValue_1: formValue.answerValue_1,
          answerId_2: formValue.answerId_2,
          answerValue_2: formValue.answerValue_2,
          answerId_3: formValue.answerId_3,
          answerValue_3: formValue.answerValue_3,
          answerId_4: formValue.answerId_4,
          answerValue_4: formValue.answerValue_4,
          answerId_5: formValue.answerId_5,
          answerValue_5: formValue.answerValue_5,
        })
      );
    } else {
      this.formArray.push(
        this._fb.group({
          label: formValue.ratingFactorName,
          selected: true,
          category: formValue.ratingFactorName,
          type: 'Custom',
          associatedProductAttribute: formValue.associatedAttribute,
          answerId_1: '',
          answerValue_1: '',
          answerId_2: '',
          answerValue_2: '',
          answerId_3: '',
          answerValue_3: '',
          answerId_4: '',
          answerValue_4: '',
          answerId_5: '',
          answerValue_5: '',
        })
      );
    }
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Rating Factor Saved Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'error occured. please try again after sometime.',
        duration: 5000,
      },
      warning: {
        severity: 'warn',
        message: 'Product could not be updated as it is in Final status',
        duration: 5000,
      },
    };
    this.saveRatingFactors().subscribe({
      next: () => {
        this._layoutService.showMessage(toastMessageConfig[`success`]);
      },
      error: (res) => {
        if (String(res.error).includes('not allowed for update operation')) {
          //this._layoutService.showMessage(toastMessageConfig['warning']);
        } else {
          this._layoutService.showMessage(toastMessageConfig[`error`]);
        }
      },
    });
  }
  selectAllRatingFactor() {
    this.applySelectAll = !this.applySelectAll;
    if (this.applySelectAll) {
      this.formArray.controls.forEach((e) => {
        e.patchValue({ selected: true });
      });
    } else {
      this.formArray.controls.forEach((e) => {
        e.patchValue({ selected: false });
      });
    }
  }
  editRatingFactor(i: number) {
    this.editingIndex = i;
    const ratingFactor = this.formArray.at(i)?.value;
    const allowCustom =
      ratingFactor.associatedProductAttribute === '' ? true : false;
    const associatedProductAttr = ratingFactor.associatedProductAttribute || '';
    if (ratingFactor.type === 'Custom') {
      this.editRatingFactorForm = this._fb.group({
        ratingFactorName: [ratingFactor.label, Validators.required],
        allowCustom: [allowCustom],
        associatedAttribute: [associatedProductAttr],
        values: this._fb.array([]),
      });

      ratingFactor?.values?.forEach((i: { key: string; value: string }) => {
        this.editCustomValues.push(
          this._fb.group({
            answerID: [i?.key, Validators.required],
            answerValue: [i?.value, Validators.required],
          })
        );
      });
      this.editRatingFactorForm
        .get('allowedCustom')
        ?.valueChanges.subscribe((value) => {
          if (value) {
            this.editRatingFactorForm.get('associatedAttribute')?.disable();
            this.editRatingFactorForm.get('associatedAttribute')?.setValue('');
            this.editRatingFactorForm
              .get('associatedAttribute')
              ?.clearValidators();
            this.editRatingFactorForm
              .get('values')
              ?.setValidators([Validators.required, Validators.minLength(1)]);
          } else {
            this.editRatingFactorForm.get('associatedAttribute')?.enable();
            this.editRatingFactorForm
              .get('associatedAttribute')
              ?.setValidators([Validators.required]);
            this.editRatingFactorForm.get('values')?.clearValidators();
          }
          this.editRatingFactorForm.get('values')?.updateValueAndValidity();
          this.editRatingFactorForm
            .get('associatedAttribute')
            ?.updateValueAndValidity();
        });

      this.openEditDrawer = true;
    } else {
      this._layoutService.showMessage({
        severity: 'warn',
        message: 'Only Custom Rating Factors are editable.',
        duration: 5000,
      });
      return;
    }
  }

  next(): void {
    if (this._productContextService.isProductDisabled()) {
      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Rating Factor Saved Successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'error occured. please try again after sometime.',
          duration: 5000,
        },
        warning: {
          severity: 'info',
          message: 'Product could not be updated as it is in Final status',
          duration: 5000,
        },
      };
      this.saveRatingFactors().subscribe({
        next: () => {
          this._layoutService.showMessage(toastMessageConfig[`success`]);
        },
        error: (res) => {
          if (String(res.error).includes('not allowed for update operation')) {
            this._layoutService.showMessage(toastMessageConfig['warning']);
          } else {
            this._layoutService.showMessage(toastMessageConfig[`error`]);
          }
        },
      });
    }
  }

  previous(): void {}

  saveAndExit(): void {
    const toastMessageConfig = {
      success: {
        severity: 'success',
        message: 'Rating Factor Saved Successfully',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'error occured. please try again after sometime',
        duration: 5000,
      },
      warning: {
        severity: 'warn',
        message: 'Product could not be updated as it is in Final status',
        duration: 5000,
      },
    };
    this.saveRatingFactors().subscribe({
      next: () => {
        this._layoutService.showMessage(toastMessageConfig[`success`]);
      },
      error: (res) => {
        if (String(res.error).includes('not allowed for update operation')) {
          this._layoutService.showMessage(toastMessageConfig['warning']);
        }
        this._layoutService.showMessage(toastMessageConfig[`error`]);
      },
    });
    this._router.navigate(['products']);
  }

  saveRatingFactors(): Observable<any> {
    const selected = this.formArray.controls
      .filter((elem) => elem.value.selected)
      .map((elem) => {
        return {
          name: elem.value.label,
          category: elem.value.category,
          type: elem.value.type,
          associatedProductAttribute: elem.value.associatedProductAttribute,
          values: elem.value.values,
        };
      });
    return this.productService.PostProductPremiumRatingFactors(
      selected,
      this.productId,
      this.productVersionId
    );
  }
}
