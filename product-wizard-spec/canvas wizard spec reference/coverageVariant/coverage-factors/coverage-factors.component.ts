import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService, TableComponent } from '@canvas/components';
import { TableOptions } from '@canvas/components/types';
import { AppContextService } from '@canvas/services';
import { MasterData } from '@canvas/types';
import {
  CbAccordionModule,
  CbButtonModule,
  CbColorTheme,
  CbIconSize,
  CbInputModule,
  CbModalModule,
  CbToggleModule,
} from '@chubb/ui-components';
import { combineLatest } from 'rxjs';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep, isEmpty } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';

import { CoverageFactorsService } from '../../../services/coverage-factors.service';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { CoverageVariant } from '../../../types/coverage';
import {
  CoverageFactor,
  CoverageFactorValues,
} from '../../../types/coverageFactors';
import { Category } from '../../../types/ref-data';
import {
  CoverageFactorsEnum,
  CoverageFactorsLabels,
} from './model/coverage-factors.model';

@UntilDestroy()
@Component({
  selector: 'canvas-coverage-factors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CbButtonModule,
    ReactiveFormsModule,
    CbToggleModule,
    AccordionModule,
    CbInputModule,
    CbAccordionModule,
    TableComponent,
    CbModalModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './coverage-factors.component.html',
  styleUrls: ['./coverage-factors.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CoverageFactorsComponent implements OnInit {
  colorTheme = CbColorTheme.DEFAULT;
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;

  coverageVariants!: CoverageVariant[];
  coverageVariantId = '';
  coverageVariantName = '';
  productId = '';
  productVersionId = '';
  labels!: CoverageFactorsLabels;
  listOptions?: TableOptions;

  ageForm!: FormGroup;
  genderForm!: FormGroup;

  genderData: MasterData[] = [];
  coverageFactorRefData: MasterData[] = [];
  coverageFactors: CoverageFactor[] = [];
  selectedGenderList: MasterData[] = [];
  selectedRow: any;
  loadedTableData: any;

  isReadOnly = false;
  coverageVariantData!: CoverageVariant;
  openConfirmationModal = false;
  modalActions: any;
  pendingAction: {
    type: 'deleteRow' | 'toggleAge' | 'toggleGender' | 'unCheckGender';
    payload?: any;
  } | null;

  constructor(
    private layoutService: LayoutService,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private productsService: ProductsService,
    private appContextService: AppContextService,
    private router: Router,
    private coverageFactorsService: CoverageFactorsService,
    private productContextService: ProductContextService,
    private coverageVariantService: CoverageVariantService
  ) {
    this.initializeContext();
    this.initializeModalActions();
  }

  ngOnInit(): void {
    this._updateLayout();
    this.initForms();
    this.isReadOnly = this.productContextService.isProductDisabled();
    this.fetchReferenceData();
    this.disableAllRows();
    this.setupFormListeners();
  }

  // --- Initialization helpers ---

  private initializeContext(): void {
    const { productId, productVersionId } =
      this.productContextService._getProductContext();
    this.productId = productId;
    this.productVersionId = productVersionId;
    this.coverageVariantId = this.productContextService._getCoverageVariantId();
    this.coverageVariantName =
      this.productContextService._getCoverageVariantName();
    this.labels = <CoverageFactorsLabels>(
      this.appContextService.get('pages.product.coverage-factors.labels')
    );
    this.listOptions = <TableOptions>(
      this.appContextService.get('pages.product.coverage-factors.listOptions')
    );
  }

  private initializeModalActions(): void {
    this.modalActions = {
      primary: { label: this.labels.okButton },
      secondary: { label: this.labels.cancelButton },
    };
  }

  private setupFormListeners(): void {
    this.ageForm
      .get('isActive')
      ?.valueChanges.subscribe((isActive: boolean) => {
        if (this.ageForm.get('isActive')?.dirty) {
          this.checkAllRowsCoverageMappingExists(isActive);
        }
      });
    this.genderForm
      .get('isActive')
      ?.valueChanges.subscribe((isActive: boolean) => {
        if (this.genderForm.get('isActive')?.dirty) {
          this.checkAllGenderRowCoverageMappingExists(isActive);
        }
      });
  }

  // --- Form helpers ---

  private initForms(): void {
    this.ageForm = this.fb.group(
      {
        rows: this.fb.array([this.createRow()]),
        isActive: [{ value: false, disabled: this.isReadOnly }],
      },
      { validators: this.ageRangesNoOverlapValidator }
    );
    this.genderForm = this.fb.group({
      isActive: [{ value: false, disabled: this.isReadOnly }],
    });
  }

  get rows(): FormArray {
    return this.ageForm.get('rows') as FormArray;
  }

  getRowAt(index: number): FormGroup {
    return this.rows.at(index) as FormGroup;
  }

  createRow(): FormGroup {
    return this.fb.group({
      start: [{ value: '', disabled: this.isReadOnly }],
      end: [{ value: '', disabled: this.isReadOnly }],
    });
  }

  addRow(): void {
    this.rows.push(this.createRow());
  }

  // --- Coverage mapping checks ---

  checkAllRowsCoverageMappingExists(isActive: boolean): void {
    if (isActive) {
      this.ageForm.get('isActive')?.setValue(isActive, { emitEvent: false });
      this.enableAllRows();
      return;
    }
    const valueIdsToCheck = this.getAgeRowsValueIds();
    const anyExists = valueIdsToCheck.some((id) =>
      this.valueIdExists(id, 'AGE')
    );
    if (anyExists) {
      this.openPendingAction('toggleAge', isActive);
    } else {
      this.ageForm.get('isActive')?.setValue(isActive, { emitEvent: false });
      this.disableAllRows();
    }
  }

  checkRowCoverageMappingExists(index: number): void {
    const selectedRow = this.getRowAt(index);
    const startRaw = selectedRow.get('start')?.value;
    const endRaw = selectedRow.get('end')?.value;
    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.AGE);
    const existValues = coverageFactor?.values?.find(
      (v) => v.start === startRaw && v.end === endRaw
    );
    const isIdExists = existValues?.valueId
      ? this.valueIdExists(existValues.valueId, 'AGE')
      : false;
    if (isIdExists) {
      this.openPendingAction('deleteRow', index);
    } else {
      this.rows.removeAt(index);
    }
  }

  checkGenderRowCoverageMappingExists(data: MasterData[]): void {
    const missingItems =
      this.loadedTableData?.filter(
        (item1: { id: string | undefined }) =>
          item1.id && !data.some((item2) => item2.id === item1.id)
      ) ?? [];

    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.GENDER);

    if (missingItems.length === 0) {
      this.selectedGenderList = data;
      this.selectedRow = cloneDeep(data);
      return;
    }

    if (missingItems.length === 1) {
      const missingItem = missingItems[0];
      const existValues = coverageFactor?.values?.find(
        (v) => v.value === missingItem?.code
      );
      const isIdExists = existValues?.valueId
        ? this.valueIdExists(existValues.valueId, 'GENDER')
        : false;

      if (isIdExists) {
        this.openPendingAction('unCheckGender', data);
      } else {
        this.selectedGenderList = data;
      }
      return;
    }

    // For multiple missing items
    const valueIdsToCheck = this.getGenderRowsValueIds();
    const anyExists = valueIdsToCheck.some((id) =>
      this.valueIdExists(id, 'GENDER')
    );

    if (anyExists) {
      this.openPendingAction('unCheckGender', data);
    } else {
      this.selectedGenderList = data;
    }
  }

  checkAllGenderRowCoverageMappingExists(isActive: boolean): void {
    if (isActive) {
      this.genderForm.get('isActive')?.setValue(isActive, { emitEvent: false });
      return;
    }
    const valueIdsToCheck = this.getGenderRowsValueIds();
    const anyExists = valueIdsToCheck.some((id) =>
      this.valueIdExists(id, 'GENDER')
    );
    if (anyExists) {
      this.openPendingAction('toggleGender', isActive);
    }
  }

  private openPendingAction(
    type: 'deleteRow' | 'toggleAge' | 'toggleGender' | 'unCheckGender',
    payload?: any
  ): void {
    this.pendingAction = { type, payload };
    this.openConfirmationModal = true;
  }

  // --- ValueId helpers ---

  valueIdExists(
    searchValueId: string,
    factorType: string
  ): boolean | undefined {
    return this.coverageVariantData?.coverageVariantLevels?.some(
      (coverageVariantLevel) =>
        coverageVariantLevel.insuredLevel?.some((insured) =>
          insured.coverageFactorMapping?.coverageFactorCombinations?.some(
            (combination) =>
              combination.factorSet?.some(
                (factor) =>
                  factor.valueId === searchValueId &&
                  factor.factorType === factorType
              )
          )
        )
    );
  }

  private getAgeRowsValueIds(): string[] {
    const rows = this.ageForm?.get('rows') as FormArray;
    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.AGE);
    return rows.controls
      .map((group: AbstractControl) => {
        const startRaw = group.get('start')?.value;
        const endRaw = group.get('end')?.value;
        const existValues = coverageFactor?.values?.find(
          (v) => v.start === startRaw && v.end === endRaw
        );
        return existValues?.valueId;
      })
      .filter((id): id is string => !!id);
  }

  private getGenderRowsValueIds(): string[] {
    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.GENDER);
    return (
      this.loadedTableData
        ?.map((group: MasterData) => {
          const existValues = coverageFactor?.values?.find(
            (v) => v.value === group.code
          );
          return existValues?.valueId;
        })
        .filter((id: any): id is string => !!id) || []
    );
  }

  // --- Row actions ---

  deleteRow(index: number): void {
    this.checkRowCoverageMappingExists(index);
  }

  disableAllRows(): void {
    this.rows.controls.forEach((group) => group.disable());
  }

  enableAllRows(): void {
    this.rows.controls.forEach((group) => group.enable());
  }

  // --- Prefill helpers ---

  prefillAgeForm(ageCoverageFactor: CoverageFactor): void {
    this.ageForm.patchValue({ isActive: ageCoverageFactor.isActive });
    const bands = ageCoverageFactor.values.map((val) => ({
      start: val.start,
      end: val.end,
      valueId: val.valueId,
    }));
    if (!isEmpty(bands)) {
      this.loadAgeBands(bands);
    }
  }

  prefillGenderForm(genderCoverageFactor: CoverageFactor): void {
    this.genderForm.patchValue({ isActive: genderCoverageFactor.isActive });
    const filterValues = genderCoverageFactor.values.map((f) => f.value);
    this.selectedRow = this.genderData.filter((d) =>
      filterValues.includes(d.code)
    );
    this.selectedGenderList = cloneDeep(this.selectedRow);
    this.loadedTableData = cloneDeep(this.selectedRow);
  }

  loadAgeBands(
    bands: {
      start: number | undefined;
      end: number | undefined;
      valueId: string | undefined;
    }[]
  ): void {
    const rowsArray = new FormArray<FormGroup>([]);
    bands.forEach((band) => {
      rowsArray.push(
        this.fb.group({
          start: [band.start],
          end: [band.end],
          valueId: [band.valueId],
        })
      );
    });
    this.ageForm.setControl('rows', rowsArray);
    if (!this.ageForm.get('isActive')?.value) {
      this.disableAllRows();
    }
  }

  // --- Checkbox and navigation ---

  checkboxChecked(event: MasterData[]): void {
    this.checkGenderRowCoverageMappingExists(event);
  }

  previous(): void {
    this.sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  saveAndExit(): void {
    this.handleSave(() => this.router.navigate(['products']));
  }

  saveAndNext(): void {
    this.handleSave(() =>
      this.sharedService.nextButtonClicked.next({ stepCount: 1 })
    );
  }

  private handleSave(onSuccess: () => void): void {
    if (this.isReadOnly) {
      onSuccess();
      return;
    }
    this.saveCoverageFactors(onSuccess);
  }

  private saveCoverageFactors(onSuccess: () => void): void {
    this.ageForm.markAllAsTouched();
    const toastMessageConfig = this.getToastMessageConfig();
    if (this.isAnyCoverageFactorActive()) {
      const { coverageFactor } = this.prepareCoverageFactorPayload();
      const saveObservable = isEmpty(this.coverageFactors)
        ? this.coverageFactorsService.createCoverageFactors(
            this.productId,
            this.productVersionId,
            this.coverageVariantId,
            coverageFactor
          )
        : this.coverageFactorsService.updateCoverageFactors(
            this.productId,
            this.productVersionId,
            this.coverageVariantId,
            coverageFactor
          );
      saveObservable.subscribe({
        next: () => {
          this.layoutService.showMessage(toastMessageConfig.success);
          onSuccess();
        },
        error: (err) => {
          if (err?.error?.errors) {
            const errors = err.error.errors;
            const defaultError = this.labels.createErrorMessage;
            for (const key in errors) {
              this.layoutService.showMessage({
                severity: 'error',
                message: errors[key] || defaultError,
              });
            }
          }
        },
      });
    } else {
      this.layoutService.showMessage(toastMessageConfig.formError);
    }
  }

  public prepareCoverageFactorPayload() {
    const ageActive = this.ageForm?.get('isActive')?.value;
    const genderActive = this.genderForm?.get('isActive')?.value;
    const ageValues: CoverageFactorValues[] = [];
    const genderValues: CoverageFactorValues[] = [];
    const coverageFactor: CoverageFactor[] = [];

    const rows = this.ageForm?.get('rows') as FormArray;
    rows.controls.forEach((group: AbstractControl) => {
      const startRaw = group.get('start')?.value;
      const endRaw = group.get('end')?.value;
      if (
        startRaw !== null &&
        startRaw !== '' &&
        endRaw !== null &&
        endRaw !== ''
      ) {
        ageValues.push(this.prepareAgeValues(startRaw, endRaw));
      }
    });

    coverageFactor.push(
      this.prepareCoverageFactor(
        CoverageFactorsEnum.AGE,
        'RANGE',
        ageActive,
        ageValues
      )
    );

    this.selectedGenderList.forEach((data: MasterData) => {
      genderValues.push(this.prepareGenderValues(data.code));
    });

    coverageFactor.push({
      ...this.prepareCoverageFactor(
        CoverageFactorsEnum.GENDER,
        'STRING',
        genderActive,
        genderValues
      ),
      category: CoverageFactorsEnum.GENDER,
    });

    return { ageActive, genderActive, ageValues, genderValues, coverageFactor };
  }

  private getToastMessageConfig() {
    return {
      success: {
        severity: 'success',
        message: this.labels.createSucessMessage,
      },
      error: {
        severity: 'error',
        message: this.labels.createErrorMessage,
      },
      formError: {
        severity: 'error',
        message: this.labels.formError,
      },
    };
  }

  prepareCoverageFactor(
    factorType: string,
    valueType: string,
    isActive: boolean,
    values: CoverageFactorValues[]
  ): CoverageFactor {
    const coverageFactor = this.getCoverageFactor(factorType);
    return {
      coverageFactorId: coverageFactor?.coverageFactorId ?? '',
      factorType,
      valueType,
      isActive,
      values,
    };
  }

  prepareAgeValues(start: number, end: number): CoverageFactorValues {
    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.AGE);
    const existValues = coverageFactor?.values?.find(
      (v) => v.start === start && v.end === end
    );
    return {
      valueId: existValues?.valueId ?? '',
      start,
      end,
    };
  }

  prepareGenderValues(value: string | undefined): CoverageFactorValues {
    const coverageFactor = this.getCoverageFactor(CoverageFactorsEnum.GENDER);
    const existValues = coverageFactor?.values?.find((v) => v.value === value);
    return {
      valueId: existValues?.valueId ?? '',
      value,
    };
  }

  getCoverageFactor(factorType: string): CoverageFactor | undefined {
    return this.coverageFactors.find((item) => item.factorType === factorType);
  }

  // --- Data fetching ---

  private fetchReferenceData(): void {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: this.labels.errorMessage,
      },
    };
    combineLatest([
      this.productsService.getReferenceData(Category.GENDER),
      this.productsService.getReferenceData(Category.COVERAGEFACTOR),
      this.coverageVariantService.getCoverageVariant(
        this.coverageVariantId,
        this.productId,
        this.productVersionId
      ),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([genderData, coverageFactorRefData, coverageVariantData]) => {
          this.genderData = genderData;
          this.coverageFactorRefData = coverageFactorRefData;
          this.coverageVariantData = coverageVariantData;
          this.updateLabelsFromRefData();
          this.coverageFactors = this.coverageVariantData.coverageFactors ?? [];
          this.coverageFactors?.forEach((item: CoverageFactor) => {
            if (item.factorType === CoverageFactorsEnum.AGE) {
              this.prefillAgeForm(item);
            } else if (item.factorType === CoverageFactorsEnum.GENDER) {
              this.prefillGenderForm(item);
            }
          });
          if (this.isReadOnly) {
            this.ageForm.disable();
            this.genderForm.disable();
          }
        },
        error: () => {
          this.layoutService.showMessage(toastMessageConfig.error);
        },
      });
  }

  private updateLabelsFromRefData(): void {
    this.coverageFactorRefData.map((item) => {
      if (item.code === CoverageFactorsEnum.AGE) {
        this.labels.ageBand = item.description ?? this.labels.ageBand;
      } else if (item.code === CoverageFactorsEnum.GENDER) {
        this.labels.gender = item.description ?? this.labels.gender;
      }
    });
  }

  // --- Validators ---

  ageRangesNoOverlapValidator(form: AbstractControl): ValidationErrors | null {
    const rows = form.get('rows') as FormArray;
    if (!rows || rows.length < 2) return null;

    const ranges = rows.controls
      .map((group: AbstractControl) => {
        const startRaw = group.get('start')?.value;
        const endRaw = group.get('end')?.value;
        if (
          startRaw === null ||
          startRaw === '' ||
          endRaw === null ||
          endRaw === '' ||
          isNaN(Number(startRaw)) ||
          isNaN(Number(endRaw))
        ) {
          return null;
        }
        const start = Number(startRaw);
        const end = Number(endRaw);
        return start <= end ? ([start, end] as [number, number]) : null;
      })
      .filter((range): range is [number, number] => range !== null);

    if (ranges.length !== rows.length || ranges.length < 2) return null;

    ranges.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ranges.length; i++) {
      const prevEnd = ranges[i - 1][1];
      const currStart = ranges[i][0];
      if (currStart <= prevEnd) {
        return { ageOverlap: true };
      }
    }
    return null;
  }

  // --- Coverage factor validation ---

  isAnyCoverageFactorActive(): boolean {
    const ageActive = this.ageForm?.get('isActive')?.value;
    const genderActive = this.genderForm?.get('isActive')?.value;

    let ageValid = true;
    if (ageActive) {
      const rows = this.ageForm?.get('rows') as FormArray;
      ageValid = rows.controls.every((group: AbstractControl) => {
        const startRaw = group.get('start')?.value;
        const endRaw = group.get('end')?.value;
        return (
          startRaw !== '' &&
          startRaw !== null &&
          startRaw !== undefined &&
          endRaw !== '' &&
          endRaw !== null &&
          endRaw !== undefined
        );
      });
      ageValid = ageValid && this.ageForm.valid;
    }

    const genderValid = !genderActive || this.selectedGenderList.length > 0;

    return ageValid && genderValid;
  }

  // --- Layout ---

  private _updateLayout() {
    this.layoutService.updateBreadcrumbs([
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
        label: 'Coverage factors',
        routerLink: `/products/${this.productId}/coveragevariant/coverageFactors`,
        active: true,
      },
    ]);
    this.layoutService.caption$.next('');
  }

  // --- Modal handling ---

  handleConfirmationModal() {
    if (this.pendingAction) {
      switch (this.pendingAction.type) {
        case 'toggleAge':
          this.ageForm
            .get('isActive')
            ?.setValue(!this.pendingAction.payload, { emitEvent: false });
          break;
        case 'toggleGender':
          this.genderForm
            .get('isActive')
            ?.setValue(!this.pendingAction.payload, { emitEvent: false });
          break;
        case 'unCheckGender':
          this.selectedRow = cloneDeep(this.selectedRow);
          this.genderData = cloneDeep(this.genderData);
          break;
      }
    }
    this.openConfirmationModal = false;
    this.pendingAction = null;
  }

  modalConfirmation() {
    if (this.pendingAction) {
      switch (this.pendingAction.type) {
        case 'deleteRow':
          this.rows.removeAt(this.pendingAction.payload);
          break;
        case 'toggleAge':
          this.ageForm
            .get('isActive')
            ?.setValue(this.pendingAction.payload, { emitEvent: false });
          this.pendingAction.payload
            ? this.enableAllRows()
            : this.disableAllRows();
          break;
        case 'toggleGender':
          this.genderForm
            .get('isActive')
            ?.setValue(this.pendingAction.payload, { emitEvent: false });
          break;
        case 'unCheckGender':
          this.selectedGenderList = this.pendingAction.payload;
          this.loadedTableData = this.pendingAction.payload;
          break;
      }
    }
    this.openConfirmationModal = false;
    this.pendingAction = null;
  }
}
