/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
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
import { CanvasCommandsModule, StudioCommands } from '@canvas/commands';
import { LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
import { StudioCommandDefinition } from '@canvas/types';
import {
  CbButtonModule,
  CbCheckboxConfig,
  CbCheckboxModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbModalModule,
  CbMultiCheckboxModule,
  CbSelectChoiceModule,
  CbSelectMultipleModule,
  CbToggleModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEmptyString } from 'is-what';
import { isEmpty } from 'lodash';
import { isNull, isUndefined } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { ChipsModule, ChipsRemoveEvent } from 'primeng/chips';
import { DropdownModule } from 'primeng/dropdown';
import {
  MultiSelectChangeEvent,
  MultiSelectModule,
  MultiSelectSelectAllChangeEvent,
} from 'primeng/multiselect';
import { combineLatest } from 'rxjs';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import {
  CoverageVariant,
  CustomAttribute,
  Individual,
  InsuredGroupType,
  InsuredType,
} from '../../../types/coverage';
import {
  DependentTypeKeys,
  InsuredTypeKeys,
} from '../../../types/coverage-variant-level';
import {
  PredefinedAttr,
  SupportedInsuredType,
  Value,
} from '../../../types/insured-object';
import { MasterData, PredefinedAttrs } from '../../../types/product';
import { ProductContext } from '../../../types/product-context';
import { ANNIVERSARY, Category, MsgIds } from '../../../types/ref-data';
import { InsuredFormTypes } from '../insured-type-selection/model/insured-type.model';
import { InsuredTypeLabels } from './model/insured-type.model';

@UntilDestroy()
@Component({
  selector: 'canvas-insured-type',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CbButtonModule,
    ReactiveFormsModule,
    CbToggleModule,
    CbSelectMultipleModule,
    MultiSelectModule,
    ChipsModule,
    AccordionModule,
    CbInputModule,
    CbIconModule,
    CbModalModule,
    CbSelectChoiceModule,
    CanvasCommandsModule,
    CbCheckboxModule,
    CbTooltipModule,
    inputUnselectPipe,
    CbMultiCheckboxModule,
    DropdownModule,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './insured-type.component.html',
  styleUrls: ['./insured-type.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InsuredTypeComponent implements OnInit {
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;
  coverageVariants!: CoverageVariant[];
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  selectAllInsured = false;
  selectAllDependant = false;
  selectAllFileTypes: boolean[] = [];
  saveInsuredCommand: StudioCommandDefinition;
  individualInsuredForm: FormGroup;
  selectedInsuredTypes: MasterData[] = [];
  selectedDependantTypes: MasterData[] = [];
  selectedFileTypes: (MasterData | undefined)[][] = [];
  isDependantSelected = false;
  insuredTypeselection: InsuredType[] = [];
  insuredTypes: InsuredGroupType[] = [];
  customAttributes: CustomAttribute[] = [];
  insuredList: MasterData[] = [];
  dependantList: MasterData[] = [];
  dataTypes: MasterData[] = [];
  fileTypes: MasterData[] = [];
  selectedIndividual: Individual | undefined;
  insuredReferenceData: MasterData[];
  dependentReferenceData: MasterData[];
  productContext: ProductContext;
  country: string;
  disableMIClrSelection = false;
  disableDPClrSelection = false;
  disableSPClrSelection = false;
  disableDel: boolean[] = [];
  disableMIAttrDel: boolean[] = [];
  disableSPAttrDel: boolean[] = [];
  disableChildAttrDel: boolean[] = [];
  disableAdultAttrDel: boolean[] = [];
  disableAdd = false;
  isGroupRated: boolean;
  includeBeneficiaries: boolean;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  disableEdit = false;
  openDeleteModal: boolean;
  deleteSelectedItem: any;
  currVersChange: boolean;
  isBeneficiaryIncluded = false;
  maxBeneficiariesAllowed: number | undefined;
  overAgeCancellationTypes: MasterData[] = [];
  selectAllPredefinedAttributes: {
    [key: string]: boolean;
  } = {
    MI: false,
    SP: false,
    DPCHILD: false,
    DPADULT: false,
  };
  supportedInsuredType: SupportedInsuredType[] | undefined;
  selectedPredefinedAttributes: MasterData[] = [];
  noDuplicatesList: { [key: string]: CbCheckboxConfig[] } = {};
  requiredAttributesList: { [key: string]: CbCheckboxConfig[] } = {};
  productClass: string;
  predefinedAttributes: MasterData[];
  preDefinedAttributesList: PredefinedAttr[];
  insuredPredefinedattrList: Value[];
  openDeleteAttributeModal = false;
  deleteSelectedAttribute: any;
  predefinedAtts: {
    [key: string]: PredefinedAttr[];
  } = {
    MAIN_INS: [],
    SPOUSE: [],
    DPCHILD: [],
    DPADULT: [],
  };
  miPredefAttr: PredefinedAttrs[] = [];
  spPredefAttr: PredefinedAttrs[] = [];
  dpChildPredefAttr: PredefinedAttrs[] = [];
  dpAdultPredefAttr: PredefinedAttrs[] = [];
  deleteSelectedInsuredlobAttribute: string;
  duplicateAttrError: string;
  predefinedAttrsInsured: any;
  supportedInsuredTypes: SupportedInsuredType[] = [];
  predefinedAttrs: (PredefinedAttr | undefined)[];
  deleteModalTitle: string;
  insuredFormTypes = InsuredFormTypes;
  labels!: InsuredTypeLabels;

  get typeSelectionForm(): FormGroup {
    return this.individualInsuredForm.get('typeSelectionForm') as FormGroup;
  }

  get insuredType(): FormControl {
    return this.individualInsuredForm
      .get('typeSelectionForm')
      ?.get('insuredType') as FormControl;
  }

  get dependantType(): FormControl {
    return this.individualInsuredForm
      .get('typeSelectionForm')
      ?.get('dependantType') as FormControl;
  }
  get minAge(): FormControl {
    return this.mainInsuredForm?.get('minAge') as FormControl;
  }
  get isMainInsuredSelected(): boolean {
    return this.insuredType?.value?.some(
      (ele: { code: string }) => ele.code === InsuredTypeKeys.MAININSURED
    );
  }

  get mainInsuredForm(): FormGroup {
    return this.individualInsuredForm.get('mainInsuredForm') as FormGroup;
  }

  get isSpouseSelected(): boolean {
    return this.insuredType?.value?.some(
      (ele: { code: string }) => ele.code === InsuredTypeKeys.SPOUSE
    );
  }

  get spouseInsuredForm(): FormGroup {
    return this.individualInsuredForm.get('spouseInsuredForm') as FormGroup;
  }

  get dependantChildForm(): FormGroup {
    return this.individualInsuredForm.get('dependantChildForm') as FormGroup;
  }

  get dependantAdultForm(): FormGroup {
    return this.individualInsuredForm.get('dependantAdultForm') as FormGroup;
  }

  get isDependantChildSelected(): boolean {
    return (
      this.dependantType?.value &&
      this.dependantType.value.some(
        (ele: { code: string }) => ele.code === DependentTypeKeys.CHILD
      )
    );
  }

  get isDependantAdultSelected(): boolean {
    return (
      this.dependantType?.value &&
      this.dependantType.value.some(
        (ele: { code: string }) => ele.code === DependentTypeKeys.ADULT
      )
    );
  }

  get formArray(): FormArray {
    return (<FormGroup>this.individualInsuredForm.get('customAttributesForm'))
      ?.controls['attributes'] as FormArray;
  }

  constructor(
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _fb: FormBuilder,
    private _commands: StudioCommands,
    private _router: Router,
    private _productsService: ProductsService,
    private _variantLevelService: VariantLevelService,
    private _cdRef: ChangeDetectorRef,
    private _productContextService: ProductContextService,
    private _appContextService: AppContextService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this.coverageVariantId = localStorage?.getItem('coverageVariantId') || '';
    this.productClass = localStorage?.getItem('ProductClass') || '';
    this.productClass = localStorage?.getItem('ProductClass') || '';
    this._productContext();
    this.labels = <InsuredTypeLabels>(
      this._appContextService.get('pages.product.insured-type.labels')
    );
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

  ngOnInit(): void {
    this._initForm();
    this._observeAndSetValidators();
    this._fetchReferenceData();
    if (this._productContextService.isProductDisabled()) {
      this.individualInsuredForm.disable();
      this.disableEdit =
        this.disableMIClrSelection =
        this.disableDPClrSelection =
        this.disableSPClrSelection =
        this.disableAdd =
          true;
      this.setDisableDel(true);
    }
  }

  setDisableDel(flag = false): void {
    for (let i = 0; i < this.formArray?.length; i++) {
      this.disableDel[i] = flag;
    }
  }

  addAttribute(): void {
    this.formArray.push(this._initCustomAttribute());
    this.disableDel.push(false);
    this.selectAllFileTypes.push(false);
  }

  public set changesForCurrVersion(v: boolean) {
    this.currVersChange = v;
  }

  removeAttribute(index: number): void {
    this.formArray.removeAt(index);
    this.disableDel.splice(index, 1);
    this.selectAllFileTypes.splice(index, 1);
    this.openDeleteModal = false;
  }

  keyExists(key: string): boolean {
    return key in this.predefinedAtts;
  }

  addPredefinedAttributes(selectedInsureds?: string[]) {
    if (selectedInsureds == undefined || selectedInsureds?.length == 0) {
      selectedInsureds = [
        MsgIds.MAIN_INS,
        MsgIds.SPOUSE,
        MsgIds.DPCHILD,
        MsgIds.DPADULT,
      ];
    }
    if (selectedInsureds != undefined && selectedInsureds.length > 0) {
      for (let selInsured of selectedInsureds) {
        switch (selInsured) {
          case 'CHILD':
            selInsured = MsgIds.DPCHILD;
            break;
          case 'ADULT':
            selInsured = MsgIds.DPADULT;
            break;
        }
        if (
          this.keyExists(selInsured) &&
          this.predefinedAtts[selInsured].length == 0
        ) {
          const predefinedAttributes = this.insuredPredefinedattrList?.find(
            (ins) => ins.msgId === selInsured
          )?.predefinedAttr;
          if (predefinedAttributes != undefined) {
            this.predefinedAtts[selInsured].push(...predefinedAttributes);
          }
        }
      }
    }
  }

  onMultiSelectChange(
    event: MultiSelectChangeEvent,
    type: string,
    insuredType?: string,
    objectArrayControl?: AbstractControl
  ): void {
    if (event.itemValue) {
      switch (type) {
        case InsuredFormTypes.INSUREDTYPE: {
          this.disableRateAsIndividualCheck(event.value);
          this.typeSelectionForm
            ?.get('insuredTypeChipControl')
            ?.patchValue(event.value);
          const dependentValue = event.value.find(
            (ele: { code: string }) => ele.code == InsuredTypeKeys.DEPENDENT
          );
          if (
            event.value.find(
              (ele: { code: string }) => ele.code !== InsuredTypeKeys.DEPENDENT
            )
          ) {
            this.selectAllDependant = false;
            if (!dependentValue?.disabled) {
              this.dependantType?.reset();
            }
          }
          event.value.length === this.insuredList.length
            ? (this.selectAllInsured = true)
            : (this.selectAllInsured = false);
          break;
        }
        case InsuredFormTypes.DEPENDENTTYPE: {
          this.typeSelectionForm
            ?.get('dependantTypeChipControl')
            ?.patchValue(event.value);
          event.value.length === this.dependantList.length
            ? (this.selectAllDependant = true)
            : (this.selectAllDependant = false);
          break;
        }
        case InsuredFormTypes.PREDEFINEDATTRIBUTE: {
          if (insuredType) {
            this._toggleRequiredAndDuplicateAttributes(insuredType);
            objectArrayControl
              ?.get('predefinedTypeChipControl')
              ?.patchValue(event.value);
            switch (insuredType) {
              case InsuredTypes.MI: {
                event.value.length === this.miPredefAttr.length
                  ? (this.selectAllPredefinedAttributes[insuredType] = true)
                  : (this.selectAllPredefinedAttributes[insuredType] = false);
                break;
              }
              case InsuredTypes.SP: {
                event.value.length === this.spPredefAttr.length
                  ? (this.selectAllPredefinedAttributes[insuredType] = true)
                  : (this.selectAllPredefinedAttributes[insuredType] = false);
                break;
              }
              case InsuredTypes.DPADULT: {
                event.value.length === this.dpAdultPredefAttr.length
                  ? (this.selectAllPredefinedAttributes[insuredType] = true)
                  : (this.selectAllPredefinedAttributes[insuredType] = false);
                break;
              }
              case InsuredTypes.DPCHILD: {
                event.value.length === this.dpChildPredefAttr.length
                  ? (this.selectAllPredefinedAttributes[insuredType] = true)
                  : (this.selectAllPredefinedAttributes[insuredType] = false);
                break;
              }
            }
            break;
          }
        }
      }
      if (type === 'insuredType' || type === 'dependantType') {
        const codes: string[] = [];
        event.value.forEach((item: { code: string }) => {
          codes.push(item.code);
        });
        this.addPredefinedAttributes(codes);
      }
    }
  }

  onMultiSelectSelectAllChange(
    event: MultiSelectSelectAllChangeEvent,
    type: string,
    insuredType?: string,
    objectArrayControl?: AbstractControl
  ): void {
    const codes: string[] = [];
    switch (type) {
      case InsuredFormTypes.INSUREDTYPE: {
        this.selectAllInsured = event.checked;
        this.disableRateAsIndividual(false);
        if (event.checked) {
          const dependentValue = this.insuredList.find(
            (ele) => ele.code == InsuredTypeKeys.DEPENDENT
          );
          if (!dependentValue?.disabled) {
            this.dependantType?.reset();
          }
        }
        this.selectedInsuredTypes = event.checked
          ? [...this.insuredList]
          : [...this.insuredList.filter((item) => item.disabled)];
        this.typeSelectionForm
          ?.get('insuredTypeChipControl')
          ?.patchValue(this.selectedInsuredTypes);
        codes.push('MAIN_INS', 'SPOUSE');
        break;
      }

      case InsuredFormTypes.DEPENDENTTYPE: {
        this.selectAllDependant = event.checked;
        this.selectedDependantTypes = event.checked
          ? [...this.dependantList]
          : [...this.dependantList.filter((item) => item.disabled)];
        this.typeSelectionForm
          ?.get('dependantTypeChipControl')
          ?.patchValue(this.selectedDependantTypes);
        codes.push('DPCHILD', 'DPADULT');
        break;
      }

      case InsuredFormTypes.PREDEFINEDATTRIBUTE: {
        if (insuredType) {
          switch (insuredType) {
            case InsuredTypes.MI:
              this.preDefinedAttributesList = this.miPredefAttr;
              break;
            case InsuredTypes.SP:
              this.preDefinedAttributesList = this.spPredefAttr;
              break;
            case InsuredTypes.DPADULT:
              this.preDefinedAttributesList = this.dpAdultPredefAttr;
              break;
            case InsuredTypes.DPCHILD:
              this.preDefinedAttributesList = this.dpChildPredefAttr;
              break;
          }

          objectArrayControl
            ?.get('predefinedAttribute')
            ?.patchValue(
              event.checked ? [...this.preDefinedAttributesList] : []
            );
          objectArrayControl
            ?.get('predefinedTypeChipControl')
            ?.patchValue(
              event.checked ? [...this.preDefinedAttributesList] : []
            );

          this.selectAllPredefinedAttributes[insuredType] = event.checked;
          this._toggleRequiredAndDuplicateAttributes(insuredType);
        }
        break;
      }
    }
    if (type === 'insuredType' || type === 'dependantType') {
      this.addPredefinedAttributes(codes);
    }
  }

  hasDuplicates(array: any[]): boolean {
    const uniqueValues = new Set();
    for (const item of array) {
      if (uniqueValues.has(item)) {
        return true; // Duplicate found
      }
      uniqueValues.add(item);
    }
    return false; // No duplicates
  }

  //Check custom attributes with MI/SP/DPCHILD/DPADULT predefined attributes
  hasCustAttrDuplicates(custArr: any[], array: any[]): boolean {
    for (const custAttr of custArr) {
      for (const item of array) {
        if (custAttr === item) {
          return true;
        }
      }
    }
    return false;
  }

  predefinedAttrDuplicateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Check if the control has a value and the form is fully initialized
      if (!control || control.value === null || control.value === '') {
        // Skip validation if the control is empty or not initialized
        return null;
      }
      const invalidItems = control.value.filter(
        (item: { description: string }) =>
          this.duplicatesCheckPredefinedAttr(item.description)
      );
      if (invalidItems.length > 0) {
        return { attrDuplicate: true };
      } else {
        return null;
      }
    };
  }

  customAttrDuplicateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Check if the control has a value and the form is fully initialized
      if (!control || control.value === null || control.value === '') {
        // Skip validation if the control is empty or not initialized
        return null;
      }

      if (this.duplicatesCheckCustomAttr(control.value)) {
        return { attrDuplicate: true };
      } else {
        return null;
      }
    };
  }

  getPredefinedAttributeValues(form: string): string[] {
    const values: string[] = [];
    const predefinedAttributeValues = this.individualInsuredForm
      ?.get(form)
      ?.get('predefinedAttribute')?.value;
    if (
      predefinedAttributeValues != null &&
      predefinedAttributeValues != undefined &&
      predefinedAttributeValues != ''
    ) {
      predefinedAttributeValues?.map((val: any) => {
        values.push(val.description?.toLowerCase());
      });
    }
    return values;
  }

  duplicatesCheckPredefinedAttr(inputValue: string): boolean {
    const attributes =
      this.formArray?.controls?.map((control) =>
        control.get('name')?.value.toLowerCase().trim()
      ) || [];

    if (
      this.hasCustAttrDuplicates([inputValue.toLocaleLowerCase()], attributes)
    ) {
      return true;
    }
    return false;
  }

  duplicatesCheckCustomAttr(inputValue: string): boolean {
    const attributes =
      this.formArray?.controls?.map((control) =>
        control.get('name')?.value.toLowerCase().trim()
      ) || [];
    const miPredefinedAttrs =
      this.getPredefinedAttributeValues('mainInsuredForm');
    const spPredefinedAttrs =
      this.getPredefinedAttributeValues('spouseInsuredForm');
    const childPredefinedAttrs =
      this.getPredefinedAttributeValues('dependantChildForm');
    const adultPredefinedAttrs =
      this.getPredefinedAttributeValues('dependantAdultForm');

    const predefinedAttrs = [
      ...miPredefinedAttrs,
      ...spPredefinedAttrs,
      ...childPredefinedAttrs,
      ...adultPredefinedAttrs,
    ];

    if (
      this.hasDuplicates(attributes) ||
      this.hasCustAttrDuplicates(
        [inputValue.toLocaleLowerCase()],
        predefinedAttrs
      )
    ) {
      return true;
    }
    return false;
  }

  fileTypeChanged(i: number) {
    if (this.formArray.controls[i].get('dataType')?.value === 'FILE') {
      this.formArray.controls[i].get('maxOccurence')?.enable();
      this.formArray.controls[i].get('validationExpression')?.enable();
      this.formArray.controls[i]
        .get('maxOccurence')
        ?.setValidators(Validators.required);
      this.formArray.controls[i]
        .get('validationExpression')
        ?.setValidators(Validators.required);
    } else {
      this.formArray.controls[i].get('maxOccurence')?.clearValidators();
      this.formArray.controls[i].get('validationExpression')?.clearValidators();
      this.formArray.controls[i].get('maxOccurence')?.disable();
      this.formArray.controls[i].get('validationExpression')?.disable();
    }

    if (this.formArray.controls[i].get('dataType')?.value === 'STRING') {
      const nameControl = this.formArray.controls[i].get('name');
      nameControl?.addValidators([
        Validators.required,
        Validators.maxLength(500),
      ]);
      nameControl?.updateValueAndValidity();
    } else {
      const nameControl = this.formArray.controls[i].get('name');
      nameControl?.addValidators([
        Validators.required,
        Validators.maxLength(100),
      ]);
      nameControl?.updateValueAndValidity();
    }
  }

  selectAllFileType(i: number, event: MultiSelectSelectAllChangeEvent) {
    this.selectAllFileTypes[i] = event.checked;
    this.selectedFileTypes[i] = event.checked ? [...this.fileTypes] : [];

    this.formArray.controls[i]
      .get('fileTypes')
      ?.patchValue(event.checked ? [...this.fileTypes] : []);
  }
  onFileTypeSelect(e: MultiSelectChangeEvent, i: number) {
    this.selectedFileTypes[i] = e.value;
    const selectedFileTypes: string = e.value
      .map((types: MasterData) => `.${types.description}`)
      .join(', ');
    this.formArray.controls[i]
      .get('validationExpression')
      ?.patchValue(selectedFileTypes);
  }

  stringToList(str: string): MasterData[] {
    const listItems: string[] = str.replace(/\./g, '').split(', ');
    const list: MasterData[] = listItems
      ?.map((item) =>
        this.fileTypes.find((type) => type?.description === item.toLowerCase())
      )
      .filter((item): item is MasterData => !!item);

    return list;
  }

  listToString(list: MasterData[]) {
    const str = list
      .map((item: MasterData) => `.${item.description}`)
      .join(', ');
    return str;
  }

  clearSelection(
    type: string,
    insuredType?: string,
    objectArrayControl?: AbstractControl
  ): void {
    switch (type) {
      case InsuredFormTypes.INSUREDTYPE: {
        this.selectAllInsured = false;
        this.insuredType?.reset();
        this.isDependantSelected = false;
        this.dependantType?.reset();
        this.typeSelectionForm?.get('insuredTypeChipControl')?.reset();
        this.disableRateAsIndividual(false);
        break;
      }

      case InsuredFormTypes.DEPENDENTTYPE: {
        this.selectAllDependant = false;
        this.dependantType?.reset();
        this.typeSelectionForm?.get('dependantTypeChipControl')?.reset();
        break;
      }

      case InsuredFormTypes.PREDEFINEDATTRIBUTE:
        if (insuredType) {
          this._toggleRequiredAndDuplicateAttributes(insuredType);
          this.selectAllPredefinedAttributes[insuredType] = false;
        }

        objectArrayControl?.get('predefinedAttribute')?.patchValue([]);
        objectArrayControl?.get('predefinedTypeChipControl')?.reset();
        break;
    }
  }

  private deleteError(): void {
    const toastMessageConfig = {
      error: {
        severity: 'error',
        message: 'Delete Insured types from previous version not possible.',
      },
    };
    this._layoutService.showMessage(toastMessageConfig['error']);
  }

  onChipRemove(
    event: ChipsRemoveEvent,
    type: string,
    insuredType?: string,
    objectArrayContol?: AbstractControl
  ): void {
    if (event.value.disabled) {
      switch (type) {
        case InsuredFormTypes.INSUREDTYPE: {
          const insuredTypeValue =
            this.typeSelectionForm?.get('insuredType')?.value ?? [];
          this.disableRateAsIndividualCheck(insuredTypeValue);
          this.typeSelectionForm.patchValue({
            insuredTypeChipControl: insuredTypeValue,
          });
          break;
        }

        case InsuredFormTypes.DEPENDENTTYPE: {
          const dependantTypeValue =
            this.typeSelectionForm?.get('dependantType')?.value ?? [];
          this.typeSelectionForm.patchValue({
            dependantTypeChipControl: dependantTypeValue,
          });
          break;
        }
      }
      this.deleteError();
    } else {
      switch (type) {
        case InsuredFormTypes.INSUREDTYPE: {
          const selectedTypes = this.insuredType?.value;
          this.insuredType?.patchValue(
            selectedTypes.filter(
              (ele: { code: string }) => ele.code !== event.value.code
            )
          );
          this.disableRateAsIndividualCheck(this.insuredType?.value);
          if (event.value.code === InsuredTypeKeys.DEPENDENT) {
            this.dependantType?.reset();
          }
          this.selectedInsuredTypes.length === this.insuredList.length
            ? (this.selectAllInsured = true)
            : (this.selectAllInsured = false);
          break;
        }

        case InsuredFormTypes.DEPENDENTTYPE: {
          const selectedTypes = this.dependantType?.value;
          this.dependantType?.patchValue(
            selectedTypes.filter(
              (ele: { code: string }) => ele.code !== event.value.code
            )
          );
          this.selectedDependantTypes.length === this.dependantList.length
            ? (this.selectAllDependant = true)
            : (this.selectAllDependant = false);
          break;
        }

        case InsuredFormTypes.PREDEFINEDATTRIBUTE: {
          if (insuredType) {
            const id = event.value.description;
            // this._toggleRequiredAndDuplicateAttributes(insuredType);
            const selectedItems = objectArrayContol
              ?.get('predefinedTypeChipControl')
              ?.value.filter((ele: { msgId: string }) => ele.msgId !== id);
            objectArrayContol
              ?.get('predefinedTypeChipControl')
              ?.patchValue(selectedItems);
            objectArrayContol
              ?.get('predefinedAttribute')
              ?.patchValue(selectedItems);
            this._toggleRequiredAndDuplicateAttributes(insuredType);
            if (
              selectedItems.length === this.preDefinedAttributesList?.length
            ) {
              if (
                this.selectAllPredefinedAttributes[insuredType] != undefined
              ) {
                this.selectAllPredefinedAttributes[insuredType] = true;
              }
            } else {
              if (
                this.selectAllPredefinedAttributes[insuredType] != undefined
              ) {
                this.selectAllPredefinedAttributes[insuredType] = false;
              }
            }
          }
          break;
        }
      }
    }
  }

  checkDuplicateAttributesExist(arr: CustomAttribute[]) {
    const values = arr.map((item) => item['attrName']);
    const attrs = arr.filter(
      (item, index) => values.indexOf(item['attrName']) !== index
    );
    if (attrs.length > 0) {
      return true;
    }
    return false;
  }

  saveAndExit(moveToNext?: boolean): void {
    this.updateValidators();
    if (
      this.typeSelectionForm.invalid ||
      this.formArray.invalid ||
      this.individualInsuredForm.invalid
    ) {
      this.individualInsuredForm.markAllAsTouched();
      return;
    }

    const toastMessageConfig = {
      mainInsuredSpouseSuccess: {
        severity: 'success',
        message:
          'Individual Insured Saved Successfully. Minimum and maximum count for main insured and/or spouse has been defaulted to 0.',
        duration: 5000,
      },
      mainInsuredSuccess: {
        severity: 'success',
        message:
          'Individual Insured Saved Successfully. Minimum and maximum count for main insured has been defaulted to 0.',
        duration: 5000,
      },
      spouseSuccess: {
        severity: 'success',
        message:
          'Individual Insured Saved Successfully. Minimum and maximum count for spouse has been defaulted to 0.',
        duration: 5000,
      },
      predefinedAttributesDuplicate: {
        severity: 'error',
        message: 'Duplicate predefined attribues are not allowed',
        duration: 5000,
      },
      customAttributesDuplicate: {
        severity: 'error',
        message: 'Duplicate custom attribues are not allowed',
        duration: 5000,
      },
      success: {
        severity: 'success',
        message: 'Individual Insured Saved Successfully.',
        duration: 5000,
      },
      error: {
        severity: 'error',
        message: 'error occured. please try again after sometime.',
        duration: 5000,
      },
    };
    let mainInsuredValid = false;
    let spouseValid = false;
    let dependantChildValid = false;
    let dependantAdultValid = false;
    this.changesForCurrVersion = this.currVersChange || this.formArray.dirty;
    this.individualInsuredForm.markAllAsTouched();
    this.individualInsuredForm.updateValueAndValidity();

    !this.isMainInsuredSelected ||
    (this.isMainInsuredSelected &&
      (this.mainInsuredForm.status === 'DISABLED' ||
        this.mainInsuredForm.valid))
      ? (mainInsuredValid = true)
      : (mainInsuredValid = false);
    !this.isSpouseSelected ||
    (this.isSpouseSelected &&
      (this.spouseInsuredForm.status === 'DISABLED' ||
        this.spouseInsuredForm.valid))
      ? (spouseValid = true)
      : (spouseValid = false);

    !this.isDependantChildSelected ||
    (this.isDependantChildSelected &&
      (this.dependantChildForm.status === 'DISABLED' ||
        this.dependantChildForm.valid))
      ? (dependantChildValid = true)
      : (dependantChildValid = false);

    !this.isDependantAdultSelected ||
    (this.isDependantAdultSelected &&
      (this.dependantAdultForm.status === 'DISABLED' ||
        this.dependantAdultForm.valid))
      ? (dependantAdultValid = true)
      : (dependantAdultValid = false);

    if (this.formArray.length > 1) {
      const customAttributes = this._getPredefinedAttributes(this.formArray);
      if (this.checkDuplicateAttributesExist(customAttributes)) {
        dependantAdultValid = false;
        this._layoutService.showMessage(
          toastMessageConfig['customAttributesDuplicate']
        );
        return;
      } else {
        dependantAdultValid = true;
      }
    }

    if (
      !mainInsuredValid ||
      !spouseValid ||
      !dependantAdultValid ||
      !dependantChildValid
    ) {
      this.individualInsuredForm.markAllAsTouched();
      return;
    }
    if (
      (!mainInsuredValid ||
        !spouseValid ||
        !dependantAdultValid ||
        !dependantChildValid) &&
      !this.currVersChange
    ) {
      if (moveToNext) {
        const individualRated = this.getIndividuallyRatedValueForMainInsured();
        if (individualRated) {
          this._sharedService.nextButtonClicked.next({ stepCount: 1 });
        } else {
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/insuredCombination`,
          ]);
        }
      }
    } else {
      const saveInsuredCommand = {
        commandName: 'HttpCommand',
        parameter: {
          url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/insured?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
          method: 'PATCH',
        },
      };
      //this._sharedService.nextButtonClicked.next({ stepCount: 1 });

      const requestObject = this._prepareRequestObject();
      this._commands
        .execute(saveInsuredCommand, requestObject, {})
        .then((response) => {
          const insureds = this.insuredTypes.map((x) => x.insured);
          if (
            insureds.includes('Main Insured') &&
            insureds.includes('Spouse')
          ) {
            this._layoutService.showMessage(
              toastMessageConfig[
                `${response === false ? 'error' : 'mainInsuredSpouseSuccess'}`
              ]
            );
          } else if (insureds.includes('Main Insured')) {
            this._layoutService.showMessage(
              toastMessageConfig[
                `${response === false ? 'error' : 'mainInsuredSuccess'}`
              ]
            );
          } else if (insureds.includes('Spouse')) {
            this._layoutService.showMessage(
              toastMessageConfig[
                `${response === false ? 'error' : 'spouseSuccess'}`
              ]
            );
          } else {
            this._layoutService.showMessage(
              toastMessageConfig[`${response === false ? 'error' : 'success'}`]
            );
          }
          const individualRated =
            this.getIndividuallyRatedValueForMainInsured();
          if (moveToNext) {
            if (individualRated) {
              this._sharedService.nextButtonClicked.next({ stepCount: 1 });
            } else {
              this._router.navigate([
                `/products/${this.productId}/coveragevariant/insuredCombination`,
              ]);
            }
          } else {
            this._router.navigate(['products']);
          }
        })
        .catch(() => {
          this._layoutService.showMessage(toastMessageConfig['error']);
        });
    }
  }

  submit(): void {
    this._productsService.setInsuredIndividual(true);
    const individualRated = this.getIndividuallyRatedValueForMainInsured();
    if (individualRated) {
      this._sharedService.nextButtonClicked.next({ stepCount: 1 });
    } else {
      this._router.navigate([
        `/products/${this.productId}/coveragevariant/insuredCombination`,
      ]);
    }
  }

  saveAndNext(): void {
    this._productsService.setInsuredIndividual(true);
    if (this._productContextService.isProductDisabled()) {
      const individualRated = this.getIndividuallyRatedValueForMainInsured();
      if (individualRated) {
        this._sharedService.nextButtonClicked.next({ stepCount: 1 });
      } else {
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/insuredCombination`,
        ]);
      }
    } else {
      this.saveAndExit(true);
    }
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({
      stepCount: 1,
      isRoute: true,
      routeOrFunction: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
    });
  }

  private _observeAndSetValidators(): void {
    this.insuredType.valueChanges.subscribe((items) => {
      if (!isEmpty(items)) {
        const dependantItem = items?.find(
          (item: { code: InsuredTypeKeys }) =>
            item.code === InsuredTypeKeys.DEPENDENT
        );
        if (!isEmpty(dependantItem)) {
          this.isDependantSelected = true;
          this._toggleDependant('add');
        } else {
          this.isDependantSelected = false;
          this._toggleDependant('remove');
        }
        this._cdRef.detectChanges();
      }
    });
  }

  private _initForm(): void {
    const statusVal = this._productContextService.isProductDisabled() ?? false;

    this.individualInsuredForm = this._fb.group({
      typeSelectionForm: this._fb.group({
        individuallyRated: this._fb.control(false, []),
        includeBeneficiary: this._fb.control(false, []),
        maxBeneficiariesAllowed: this._fb.control(null, []),
        insuredType: this._fb.control({ value: '', disabled: statusVal }, [
          Validators.required,
        ]),
        insuredTypeChipControl: this._fb.control(
          { value: '', disabled: statusVal },
          []
        ),
        dependantType: this._fb.control({ value: '', disabled: statusVal }, [
          Validators.required,
        ]),
        dependantTypeChipControl: this._fb.control(
          { value: '', disabled: statusVal },
          []
        ),
      }),

      mainInsuredForm: this._fb.group(this._initInsuredGroup(InsuredTypes.MI)),
      spouseInsuredForm: this._fb.group(
        this._initInsuredGroup(InsuredTypes.SP)
      ),
      dependantChildForm: this._fb.group({
        rateAsGroup: this._fb.control(false, []),
        ...this._initInsuredGroup(InsuredTypes.DPCHILD),
      }),
      dependantAdultForm: this._fb.group({
        rateAsGroup: this._fb.control(false, []),
        ...this._initInsuredGroup(InsuredTypes.DPADULT),
      }),
      overAgeCancellation: this._fb.control(ANNIVERSARY, []),
      customAttributesForm: this._fb.group({
        attributes: this._fb.array([]),
      }),
    });
  }

  private _fetchReferenceData(): void {
    combineLatest([
      this._productsService.getReferenceData(Category.INSURED),
      this._productsService.getDataTypes(),
      this._variantLevelService.getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._productsService.getReferenceData(Category.DEPENDENTTYPE),
      this._productsService.getReferenceData(Category.FILETYPE),
      this._productsService.getReferenceData(Category.OVERAGECANCELREASON),
      this._productsService.getInsuredPredefineAttributes(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.insuredList = response[0]
            .filter(
              (item) =>
                item.code !== InsuredTypeKeys.ADULT &&
                item.code !== InsuredTypeKeys.CHILD
            )
            .map((item) => {
              return {
                code: item.code,
                description: item.description,
                disabled: false,
              };
            });
          this.dependantList = response[3]
            .filter(
              (item) =>
                item.code === DependentTypeKeys.ADULT ||
                item.code === DependentTypeKeys.CHILD
            )
            .map((item) => {
              return {
                code: item.code,
                description: item.description,
                disabled: false,
              };
            });
          this.insuredReferenceData = response[0];
          this.dataTypes = response[1];
          this.selectedIndividual = response[2].insured?.individual;
          this.selectedIndividual?.insuredTypes[0].insuredGroupTypes.map(
            (insuredGroupType: InsuredGroupType) => {
              this.insuredList.map((item) => {
                if (
                  item.code === InsuredTypeKeys.DEPENDENT &&
                  (insuredGroupType.individual?.value ===
                    DependentTypeKeys.ADULT ||
                    insuredGroupType.individual?.value ===
                      DependentTypeKeys.CHILD) &&
                  !insuredGroupType.isCurrentVersion
                ) {
                  this.dependantList.map((dependentItem) => {
                    if (
                      dependentItem.code ===
                        insuredGroupType.individual.value &&
                      !insuredGroupType.isCurrentVersion
                    ) {
                      dependentItem.disabled = true;
                    }
                  });
                  item.disabled = true;
                }
                if (
                  item.code === insuredGroupType.individual.value &&
                  !insuredGroupType.isCurrentVersion
                ) {
                  item.disabled = true;
                }
              });
            }
          );
          this.includeBeneficiaries =
            response[2].insured?.includeBeneficiaries || false;
          this.isBeneficiaryIncluded = this.includeBeneficiaries;
          this.dependentReferenceData = response[3];
          this.maxBeneficiariesAllowed =
            response[2].insured?.maxBeneficiariesAllowed;
          this.fileTypes = response[4];
          this.overAgeCancellationTypes = response[5];
          this.predefinedAttributes = response[6];

          const productClass = response[2]?.productClass?.value;
          if (productClass) {
            this._productsService
              .getPredefinedAttrInsured(productClass)
              .subscribe((res) => {
                this.predefinedAttrsInsured = res;
                this.supportedInsuredTypes =
                  this.predefinedAttrsInsured?.data?.productClass?.supportedInsuredType;

                this.predefinedAttrs = this.supportedInsuredTypes?.flatMap(
                  (supportedType) =>
                    supportedType?.values?.flatMap(
                      (value) => value.predefinedAttr
                    )
                );
                this._getInsuredPredefinedAttributes();
              });
          }

          if (!isEmpty(this.selectedIndividual)) {
            this._prefillForm();
          }
        },
        error: () => {
          this._layoutService.showMessage({
            severity: 'error',
            message: 'error occured. please try again after sometime.',
            duration: 5000,
          });
        },
      });
  }

  generatePredefinedAttributes(attributes: any[]): any[] {
    const result: any[] = [];
    attributes.forEach((item: any) => {
      const data = {
        msgId: item.msgId,
        description: item.description,
      };
      result.push(data);
    });
    return result;
  }

  private _getInsuredPredefinedAttributes() {
    this._productsService
      .getPredefinedAttrByMsgId('MAIN_INS', this.predefinedAttrsInsured)
      .subscribe((result) => {
        this.miPredefAttr = this.generatePredefinedAttributes(result);
      });
    this._productsService
      .getPredefinedAttrByMsgId('SPOUSE', this.predefinedAttrsInsured)
      .subscribe((result) => {
        this.spPredefAttr = this.generatePredefinedAttributes(result);
      });
    this._productsService
      .getPredefinedAttrByMsgId('DPCHILD', this.predefinedAttrsInsured)
      .subscribe((result) => {
        this.dpChildPredefAttr = this.generatePredefinedAttributes(result);
      });
    this._productsService
      .getPredefinedAttrByMsgId('DPADULT', this.predefinedAttrsInsured)
      .subscribe((result) => {
        this.dpAdultPredefAttr = this.generatePredefinedAttributes(result);
      });
  }

  private _mapPrefillLists(): { [key: string]: unknown } {
    const insuredTypes =
      this.selectedIndividual?.insuredTypes?.[0]?.insuredGroupTypes
        ?.filter(
          (ins) =>
            ins.individual.value !== InsuredTypeKeys.ADULT &&
            ins.individual.value !== InsuredTypeKeys.CHILD &&
            ins.individual.value !== DependentTypeKeys.CHILD &&
            ins.individual.value !== DependentTypeKeys.ADULT
        )
        .map((group) => {
          if (!group.isCurrentVersion) {
            if (group.individual.value == InsuredTypeKeys.MAININSURED) {
              this.disableMIClrSelection = true;
            } else if (group.individual.value == InsuredTypeKeys.SPOUSE) {
              this.disableSPClrSelection = true;
            }
          }

          return {
            code: group.individual.value,
            description: this.insuredReferenceData.find(
              (ins) => ins.code == group.individual.value
            )?.description,
            disabled: !group.isCurrentVersion,
          };
        });
    const dependentTypes =
      this.selectedIndividual?.insuredTypes?.[0]?.insuredGroupTypes
        ?.filter(
          (ins) =>
            ins.individual.value === DependentTypeKeys.ADULT ||
            ins.individual.value === DependentTypeKeys.CHILD
        )
        .map((group) => {
          if (!group.isCurrentVersion) {
            this.disableDPClrSelection = true;
          }

          return {
            code: group.individual.value,
            description: this.dependentReferenceData.find(
              (ins) => ins.code == group.individual.value
            )?.description,
            disabled: !group.isCurrentVersion,
          };
        });
    const insuredList = insuredTypes?.filter(
      (ins) =>
        ins.code !== InsuredTypeKeys.ADULT &&
        ins.code !== InsuredTypeKeys.CHILD &&
        ins.code !== DependentTypeKeys.CHILD &&
        ins.code !== DependentTypeKeys.ADULT
    );
    const dependentList = dependentTypes?.filter(
      (ins) =>
        ins.code === DependentTypeKeys.ADULT ||
        ins.code === DependentTypeKeys.CHILD
    );
    if ((dependentList?.length || 0) > 0) {
      let disabled = false;
      dependentList?.map((item) => {
        if (item.disabled) {
          disabled = true;
        }
      });
      insuredList?.push({
        code: InsuredTypeKeys.DEPENDENT,
        description: 'Dependent',
        disabled,
      });
    }
    insuredList?.length === this.insuredList.length
      ? (this.selectAllInsured = true)
      : (this.selectAllInsured = false);
    dependentList?.length === this.dependantList.length
      ? (this.selectAllDependant = true)
      : (this.selectAllDependant = false);
    return { insuredList, dependentList };
  }

  private _prefillForm(): void {
    const mipredefDetails: any[] = [],
      spPredefDetails: any[] = [],
      dpChildPredefDetails: any[] = [],
      dpAdultPredefDetails: any[] = [];
    const { insuredList, dependentList } = this._mapPrefillLists();
    this.typeSelectionForm.patchValue({
      individuallyRated: this.selectedIndividual?.individuallyRated ?? '',
      includeBeneficiary: this.includeBeneficiaries ?? '',
      maxBeneficiariesAllowed: this.maxBeneficiariesAllowed ?? '',
      insuredType: insuredList ?? [],
      insuredTypeChipControl: insuredList ?? [],
      dependantType: dependentList ?? [],
      dependantTypeChipControl: dependentList ?? [],
    });
    const insuredGroupTypes =
      this.selectedIndividual?.insuredTypes?.[0]?.insuredGroupTypes;
    const isOnlyMainInsuredPresent =
      insuredGroupTypes?.length === 1 &&
      insuredGroupTypes[0]?.individual.value === MsgIds.MAIN_INS;
    if (isOnlyMainInsuredPresent) {
      this.disableRateAsIndividual(true);
    }
    insuredGroupTypes?.forEach((group) => {
      if (group.individual.value === InsuredTypeKeys.MAININSURED) {
        this.mainInsuredForm.patchValue(Object.assign({}, group));
        if (!group.isCurrentVersion) {
          this.mainInsuredForm.disable();
        }

        group.lobSpecificAttributes?.forEach((attr) => {
          const disableEditFlag =
            this._productContextService.isProductDisabled() ||
            !attr.isCurrentVersion;
          this.disableMIAttrDel.push(disableEditFlag);
        });

        group.lobSpecificAttributes.forEach((attr) => {
          const pValue = {
            id: attr.attrName,
            description: attr.description,
          };
          mipredefDetails.push(pValue);

          this.requiredAttributesList['MI'] = [
            ...(this.requiredAttributesList['MI'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.required,
            },
          ];

          this.noDuplicatesList['MI'] = [
            ...(this.noDuplicatesList['MI'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.doNotAllowDuplicate,
            },
          ];
        });

        this.mainInsuredForm
          .get('predefinedAttribute')
          ?.patchValue(mipredefDetails);
        this.mainInsuredForm
          .get('predefinedTypeChipControl')
          ?.patchValue(mipredefDetails);
        this.mainInsuredForm
          .get('requiredAttribute')
          ?.patchValue(this.requiredAttributesList['MI']);
        this.mainInsuredForm
          .get('doNotAllowDuplicateAttribute')
          ?.patchValue(this.noDuplicatesList['MI']);
      } else if (group.individual.value === InsuredTypeKeys.SPOUSE) {
        this.spouseInsuredForm.patchValue(Object.assign({}, group));
        if (!group.isCurrentVersion) {
          this.spouseInsuredForm.disable();
        }
        group.lobSpecificAttributes?.forEach((attr) => {
          const disableEditFlag =
            this._productContextService.isProductDisabled() ||
            !attr.isCurrentVersion;
          this.disableSPAttrDel.push(disableEditFlag);
        });

        group.lobSpecificAttributes.forEach((attr) => {
          const pValue = {
            id: attr.attrName,
            description: attr.description,
          };
          spPredefDetails.push(pValue);

          this.requiredAttributesList['SP'] = [
            ...(this.requiredAttributesList['SP'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.required,
            },
          ];

          this.noDuplicatesList['SP'] = [
            ...(this.noDuplicatesList['SP'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.doNotAllowDuplicate,
            },
          ];
        });

        this.spouseInsuredForm
          .get('predefinedAttribute')
          ?.patchValue(spPredefDetails);
        this.spouseInsuredForm
          .get('predefinedTypeChipControl')
          ?.patchValue(spPredefDetails);
        this.spouseInsuredForm
          .get('requiredAttribute')
          ?.patchValue(this.requiredAttributesList['SP']);
        this.spouseInsuredForm
          .get('doNotAllowDuplicateAttribute')
          ?.patchValue(this.noDuplicatesList['SP']);
      } else if (group.individual.value === DependentTypeKeys.CHILD) {
        this.dependantChildForm.patchValue(Object.assign({}, group));
        if (!group.isCurrentVersion) {
          this.dependantChildForm.disable();
          group.lobSpecificAttributes?.forEach((attr) => {
            const disableEditFlag =
              this._productContextService.isProductDisabled() ||
              !attr.isCurrentVersion;
            this.disableChildAttrDel.push(disableEditFlag);
          });
        }
        group.lobSpecificAttributes.forEach((attr) => {
          const pValue = {
            id: attr.attrName,
            description: attr.description,
          };
          dpChildPredefDetails.push(pValue);

          this.requiredAttributesList['DPCHILD'] = [
            ...(this.requiredAttributesList['DPCHILD'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.required,
            },
          ];

          this.noDuplicatesList['DPCHILD'] = [
            ...(this.noDuplicatesList['DPCHILD'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.doNotAllowDuplicate,
            },
          ];
        });

        this.dependantChildForm
          .get('predefinedAttribute')
          ?.patchValue(dpChildPredefDetails);
        this.dependantChildForm
          .get('predefinedTypeChipControl')
          ?.patchValue(dpChildPredefDetails);
        this.dependantChildForm
          .get('requiredAttribute')
          ?.patchValue(this.requiredAttributesList['DPCHILD']);
        this.dependantChildForm
          .get('doNotAllowDuplicateAttribute')
          ?.patchValue(this.noDuplicatesList['DPCHILD']);
      } else if (group.individual.value === DependentTypeKeys.ADULT) {
        this.dependantAdultForm.patchValue(Object.assign({}, group));
        if (!group.isCurrentVersion) {
          this.dependantAdultForm.disable();
        }
        group.lobSpecificAttributes?.forEach((attr) => {
          const disableEditFlag =
            this._productContextService.isProductDisabled() ||
            !attr.isCurrentVersion;
          this.disableAdultAttrDel.push(disableEditFlag);
        });
        group.lobSpecificAttributes.forEach((attr) => {
          const pValue = {
            id: attr.attrName,
            description: attr.description,
          };
          dpAdultPredefDetails.push(pValue);

          this.requiredAttributesList['DPADULT'] = [
            ...(this.requiredAttributesList['DPADULT'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.required,
            },
          ];

          this.noDuplicatesList['DPADULT'] = [
            ...(this.noDuplicatesList['DPADULT'] ?? []),
            {
              label: attr.description || '',
              value: attr.description,
              checked: attr.doNotAllowDuplicate,
            },
          ];
        });

        this.dependantAdultForm
          .get('predefinedAttribute')
          ?.patchValue(dpAdultPredefDetails);
        this.dependantAdultForm
          .get('predefinedTypeChipControl')
          ?.patchValue(dpAdultPredefDetails);
        this.dependantAdultForm
          .get('requiredAttribute')
          ?.patchValue(this.requiredAttributesList['DPADULT']);
        this.dependantAdultForm
          .get('doNotAllowDuplicateAttribute')
          ?.patchValue(this.noDuplicatesList['DPADULT']);
      }
    });
    this.individualInsuredForm.patchValue({
      overAgeCancellation:
        this.selectedIndividual?.overAgeCancellation?.value ?? ANNIVERSARY,
    });

    this.selectedIndividual?.customAttributes?.forEach((attr) => {
      const selectedFileTypesArray = attr.validationExpression
        ?.replace(/\./g, '')
        .split(', ');
      const selectedFileTypes = selectedFileTypesArray?.map((type) => {
        return this.fileTypes.find(
          (fileType) => fileType.description === type.toLowerCase()
        );
      });
      if (selectedFileTypes !== undefined) {
        this.selectedFileTypes.push(selectedFileTypes);
      }
      if (selectedFileTypes?.length === this.fileTypes.length) {
        this.selectAllFileTypes.push(true);
      } else {
        this.selectAllFileTypes.push(false);
      }
      const disableEditFlag =
        this._productContextService.isProductDisabled() ||
        (!attr.isCurrentVersion ?? true);
      this.disableDel.push(disableEditFlag);
      this.formArray.push(this._initCustomAttribute(attr));
    });
  }

  private _getInsuredGroupTypes(type: string): InsuredGroupType | undefined {
    const insuredGroupTypes =
      this.selectedIndividual?.insuredTypes[0].insuredGroupTypes.filter(
        (item) => item.individual.value === type
      );
    if (insuredGroupTypes) {
      return insuredGroupTypes[0];
    }
    return undefined;
  }

  getLobSpecificAttributes(form: FormGroup): any[] {
    const predefinedAttributes = form.get('predefinedAttribute')?.value;
    if (!Array.isArray(predefinedAttributes)) {
      return [];
    }
    return predefinedAttributes?.map((value: any, index: number) => {
      const attr = form.get('predefinedAttribute')?.value[index];
      return {
        attrName: attr?.description,
        section: '',
        description: attr?.description,
        type: '',
        required: (<CbCheckboxConfig[]>(
          form.get('requiredAttribute')?.value
        ))?.find((item) => item.value === attr.description)?.checked,
        validationExpression: '',
        doNotAllowDuplicate: (<CbCheckboxConfig[]>(
          form.get('doNotAllowDuplicateAttribute')?.value
        ))?.find((item) => item.value === attr.description)?.checked,
        options: [],
        refDataMappingCategory: this.miPredefAttr.find(
          (att) => att.description === attr?.description
        )?.category,
        defaultValue: attr?.defaultValue,
      };
    });
  }

  private _prepareRequestObject(): InsuredData {
    const individuallyRated = this.getIndividuallyRatedValueForMainInsured();
    const includeBeneficiaries =
      this.typeSelectionForm.get('includeBeneficiary')?.value;
    const maxBeneficiariesAllowed = includeBeneficiaries
      ? isEmptyString(
          this.typeSelectionForm.get('maxBeneficiariesAllowed')?.value
        )
        ? null
        : this.typeSelectionForm.get('maxBeneficiariesAllowed')?.value
      : null;
    const overAgeCancelReason = this.individualInsuredForm.get(
      'overAgeCancellation'
    )?.value;

    this.isMainInsuredSelected
      ? this.insuredTypes.push({
          insured: 'Main Insured',
          minCount: this.mainInsuredForm.get('minCount')?.value || 0,
          maxCount: this.mainInsuredForm.get('maxCount')?.value || 0,
          minAge: this.mainInsuredForm.get('minAge')?.value,
          maxAge: this.mainInsuredForm.get('maxAge')?.value,
          renewalAge: this.mainInsuredForm.get('renewalAge')?.value,
          isCurrentVersion:
            this._getInsuredGroupTypes(InsuredTypeKeys.MAININSURED)
              ?.isCurrentVersion ?? true,
          individual: {
            key:
              this.insuredList.find(
                (ins) => ins.code == InsuredTypeKeys.MAININSURED
              )?.id || '',
            value: InsuredTypeKeys.MAININSURED,
            category: Category.INSURED,
          },
          lobSpecificAttributes: this.getLobSpecificAttributes(
            this.mainInsuredForm
          ),
        })
      : null;

    this.isSpouseSelected
      ? this.insuredTypes.push({
          insured: 'Spouse',
          minCount: this.spouseInsuredForm.get('minCount')?.value || 0,
          maxCount: this.spouseInsuredForm.get('maxCount')?.value || 0,
          minAge: this.spouseInsuredForm.get('minAge')?.value,
          maxAge: this.spouseInsuredForm.get('maxAge')?.value,
          renewalAge: this.spouseInsuredForm.get('renewalAge')?.value,
          isCurrentVersion:
            this._getInsuredGroupTypes(InsuredTypeKeys.SPOUSE)
              ?.isCurrentVersion ?? true,
          individual: {
            key:
              this.insuredList.find((ins) => ins.code == InsuredTypeKeys.SPOUSE)
                ?.id || '',
            value: InsuredTypeKeys.SPOUSE,
            category: Category.INSURED,
          },
          lobSpecificAttributes: this.getLobSpecificAttributes(
            this.spouseInsuredForm
          ),
        })
      : null;

    this.isDependantChildSelected
      ? this.insuredTypes.push({
          insured: 'Children',
          minCount: this.dependantChildForm.get('minCount')?.value || 0,
          maxCount: this.dependantChildForm.get('maxCount')?.value || 0,
          minAge: this.dependantChildForm.get('minAge')?.value,
          maxAge: this.dependantChildForm.get('maxAge')?.value,
          renewalAge: this.dependantChildForm.get('renewalAge')?.value,

          isCurrentVersion:
            this._getInsuredGroupTypes(DependentTypeKeys.CHILD)
              ?.isCurrentVersion ?? true,
          individual: {
            key:
              this.dependantList.find(
                (ins) => ins.code == DependentTypeKeys.CHILD
              )?.id || '',
            value: DependentTypeKeys.CHILD,
            category: Category.DEPENDENTTYPE,
          },
          lobSpecificAttributes: this.getLobSpecificAttributes(
            this.dependantChildForm
          ),
        })
      : null;

    this.isDependantAdultSelected
      ? this.insuredTypes.push({
          insured: 'Adult',
          minCount: this.dependantAdultForm.get('minCount')?.value || 0,
          maxCount: this.dependantAdultForm.get('maxCount')?.value || 0,
          minAge: this.dependantAdultForm.get('minAge')?.value,
          maxAge: this.dependantAdultForm.get('maxAge')?.value,
          renewalAge: this.dependantAdultForm.get('renewalAge')?.value,
          isCurrentVersion:
            this._getInsuredGroupTypes(DependentTypeKeys.ADULT)
              ?.isCurrentVersion ?? true,
          individual: {
            key:
              this.dependantList.find(
                (ins) => ins.code == DependentTypeKeys.ADULT
              )?.id || '',
            value: DependentTypeKeys.ADULT,
            category: Category.DEPENDENTTYPE,
          },
          lobSpecificAttributes: this.getLobSpecificAttributes(
            this.dependantAdultForm
          ),
        })
      : null;

    for (let i = 0; i < this.formArray.length; i++) {
      const control = this.formArray.controls[i];
      const validationExpression = control
        .get('fileTypes')
        ?.value.map((types: MasterData) => `.${types.description}`)
        .join(', ');
      this.customAttributes.push({
        attrId: crypto.randomUUID(),
        attrName: control.get('name')?.value,
        type: control.get('dataType')?.value,
        required: control.get('required')?.value,
        doNotAllowDuplicate: control.get('doNotAllowDuplicate')?.value,
        defaultValue: !(
          control.get('dataType')?.value === 'DROPDOWN' ||
          control.get('dataType')?.value === 'FILE'
        )
          ? control.get('defaultValue')?.value
          : '',
        maxOccurence: control.get('maxOccurence')?.value,
        validationExpression: validationExpression,
        answers: control.get('answers')?.value,
        isCurrentVersion:
          control.get('name')?.status === 'DISABLED' ? false : true,
      });
    }

    if (this.selectedIndividual != undefined) {
      this.insuredTypeselection = [];
      if (this.selectedIndividual.insuredTypes.length > 0) {
        this.selectedIndividual.insuredTypes[0].insuredGroupName =
          individuallyRated ? '#Individually Rated#' : '#Group Rated#';
        this.selectedIndividual.insuredTypes[0].insuredGroupTypes =
          this.insuredTypes;
        this.isGroupRated =
          this.selectedIndividual.insuredTypes[0].insuredGroupName ===
          '#Group Rated#'
            ? true
            : false;

        if (this.isGroupRated) {
          this.selectedIndividual?.insuredTypes[0].insuredGroupTypes.forEach(
            (defaultItem: InsuredGroupType) => {
              this.selectedIndividual?.insuredTypes.forEach(
                (comb: InsuredType) => {
                  comb.insuredGroupTypes.forEach(
                    (insured: InsuredGroupType) => {
                      if (defaultItem.insured === insured.insured) {
                        insured.minAge = defaultItem.minAge;
                        insured.maxAge = defaultItem.maxAge;
                        insured.renewalAge = defaultItem.renewalAge;
                        insured.minCount = defaultItem.minCount;
                        insured.maxCount = defaultItem.maxCount;
                      }
                    }
                  );
                }
              );
            }
          );
        }

        this.selectedIndividual.insuredTypes.forEach((item: any) => {
          const data = {
            insuredGroupName: item.insuredGroupName,
            insuredGroupTypes: item.insuredGroupTypes,
            isCurrentVersion: item.isCurrentVersion,
          };
          this.insuredTypeselection.push(data);
        });
      } else {
        const data = {
          insuredGroupName: individuallyRated
            ? '#Individually Rated#'
            : '#Group Rated#',
          insuredGroupTypes: this.insuredTypes,
          isCurrentVersion: true,
        };
        this.insuredTypeselection.push(data);
      }
    } else {
      const data = {
        insuredGroupName: individuallyRated
          ? '#Individually Rated#'
          : '#Group Rated#',
        insuredGroupTypes: this.insuredTypes,
        isCurrentVersion: true,
      };
      this.insuredTypeselection.push(data);
    }

    return {
      insuredId: crypto.randomUUID(),
      includeBeneficiaries: includeBeneficiaries,
      maxBeneficiariesAllowed: includeBeneficiaries
        ? maxBeneficiariesAllowed
        : null,
      individual: {
        individuallyRated: individuallyRated,
        ageRequired: true,
        insuredTypes: this.insuredTypeselection,
        customAttributes: this.customAttributes,
        overAgeCancellation: {
          key:
            this.overAgeCancellationTypes.find(
              (oct) => oct.code == overAgeCancelReason
            )?.id || '1035',
          value:
            this.overAgeCancellationTypes.find(
              (oct) => oct.code == overAgeCancelReason
            )?.code || ANNIVERSARY,
          category: Category.OVERAGECANCELREASON,
        },
      },
      entities: [],
      requestId: crypto.randomUUID(),
    };
  }

  private _getPredefinedAttributes(formArray: FormArray) {
    const lobSpecificAttributes: CustomAttribute[] = [];
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.controls[i];
      const validationExpression = control
        .get('fileTypes')
        ?.value.map((types: MasterData) => `.${types.description}`)
        .join(', ');
      lobSpecificAttributes.push({
        attrId: control.get('attrId')?.value,
        attrName: control.get('name')?.value,
        description: control.get('name')?.value,
        type: control.get('dataType')?.value,
        required:
          (<CbCheckboxConfig[]>control.get('requiredAttribute')?.value)?.find(
            (item) => item.value === control.get('name')?.value
          )?.checked || false,
        doNotAllowDuplicate:
          (<CbCheckboxConfig[]>(
            control.get('doNotAllowDuplicateAttribute')?.value
          ))?.find((item) => item.value === control.get('name')?.value)
            ?.checked || false,
        defaultValue: !(
          control.get('dataType')?.value === 'DROPDOWN' ||
          control.get('dataType')?.value === 'FILE'
        )
          ? control.get('defaultValue')?.value
          : '',
        validationExpression: validationExpression,
        options: control.get('options')?.value,
        section: control.get('section')?.value,
        isCurrentVersion:
          control.get('name')?.status === 'DISABLED' ? false : true ?? true,
      });
    }
    return lobSpecificAttributes;
  }

  private _toggleDependant(type: string): void {
    if (type === 'add') {
      const dependantControl = this._fb.control('', [Validators.required]);
      this.typeSelectionForm.addControl('dependantType', dependantControl);
    } else {
      this.typeSelectionForm.removeControl('dependantType');
    }
  }

  private _updateLayout() {
    this._layoutService.updateBreadcrumbs([
      { label: 'Products', routerLink: '/products' },
      {
        label: 'Insured type',
        routerLink: `/products/${this.productId}/insuredType`,
      },
    ]);
  }

  private _initInsuredGroup(insuredType?: string): Insured {
    const statusVal = this._productContextService.isProductDisabled();

    return {
      minCount:
        insuredType &&
        (insuredType == InsuredTypes.MI || insuredType == InsuredTypes.SP)
          ? this._fb.control({ value: '0', disabled: statusVal ? true : false })
          : this._fb.control({ value: '', disabled: statusVal ? true : false }),
      maxCount:
        insuredType &&
        (insuredType == InsuredTypes.MI || insuredType == InsuredTypes.SP)
          ? this._fb.control({ value: '0', disabled: statusVal ? true : false })
          : this._fb.control({ value: '', disabled: statusVal ? true : false }),
      minAge: this._fb.control(
        { value: '', disabled: statusVal ? true : false },
        [Validators.required, Validators.max(99)]
      ),
      maxAge: this._fb.control(
        { value: '', disabled: statusVal ? true : false },
        [Validators.required, Validators.max(999)]
      ),
      renewalAge: this._fb.control(
        { value: '', disabled: statusVal ? true : false },
        [Validators.required, Validators.max(999)]
      ),
      predefinedAttribute: this._fb.control(
        { value: '', disabled: statusVal ? true : false },
        [this.predefinedAttrDuplicateValidator()]
      ),
      predefinedTypeChipControl: this._fb.control(
        { value: '', disabled: statusVal ? true : false },
        []
      ),
      requiredAttribute: this._fb.control({
        value: false,
        disabled: statusVal,
      }),
      doNotAllowDuplicateAttribute: this._fb.control({
        value: false,
        disabled: statusVal,
      }),
    };
  }

  private _initCustomAttribute(attr?: CustomAttribute): FormGroup {
    const statusVal =
      (this._productContextService.isProductDisabled() ||
        (attr && !attr?.isCurrentVersion)) ??
      false;
    let selectedFileType: MasterData[] = [];
    if (attr?.validationExpression) {
      selectedFileType = this.stringToList(attr?.validationExpression);
    }

    const maxLength = attr?.type === 'STRING' ? 500 : 100;
    const answersArray = this._fb.array<FormGroup>([]);
    if (attr?.answers) {
      attr.answers.forEach((answer) => {
        answersArray.push(this._initAnswerWithValues(answer));
      });
    }

    return this._fb.group({
      required: this._fb.control(
        { value: attr?.required ?? false, disabled: statusVal },
        []
      ),
      doNotAllowDuplicate: this._fb.control(
        {
          value: attr?.doNotAllowDuplicate ?? false,
          disabled: statusVal,
        },
        []
      ),
      name: this._fb.control(
        { value: attr?.attrName ?? '', disabled: statusVal },
        [
          Validators.required,
          Validators.maxLength(maxLength),
          this.customAttrDuplicateValidator(),
        ]
      ),
      dataType: this._fb.control(
        { value: attr?.type ?? null, disabled: statusVal },
        [Validators.required]
      ),
      maxOccurence: this._fb.control(
        {
          value:
            attr?.maxOccurence && attr?.maxOccurence != 0
              ? attr.maxOccurence
              : 1,
          disabled: statusVal,
        },
        [Validators.min(1), Validators.max(99)]
      ),
      fileTypes: this._fb.control(
        { value: selectedFileType, disabled: false },
        []
      ),
      validationExpression: this._fb.control(
        {
          value: attr?.validationExpression ?? '',
          disabled: statusVal,
        },
        []
      ),
      answers: answersArray,
      defaultValue: this._fb.control({
        value: attr?.defaultValue ?? '',
        disabled: statusVal,
      }),
    });
  }

  private _initAnswerWithValues(answer: {
    answerValue: string;
    answerDescription: string;
  }): FormGroup {
    const statusVal = this._productContextService.isProductDisabled();
    return this._fb.group({
      answerValue: this._fb.control(
        { value: answer.answerValue, disabled: statusVal ? true : false },
        Validators.required
      ),
      answerDescription: this._fb.control(
        { value: answer.answerDescription, disabled: statusVal ? true : false },
        Validators.required
      ),
    });
  }

  removeAnswer(attribute: FormGroup, index: number): void {
    this.openDeleteAttributeModal = true;
    this.deleteSelectedAttribute = { attribute, index };
  }

  addAnswer(attribute: FormGroup): void {
    const answersArray = attribute.get('answers') as FormArray;
    answersArray.push(this._initAnswer());
  }

  private _initAnswer(): FormGroup {
    return this._fb.group({
      answerValue: this._fb.control('', Validators.required),
      answerDescription: this._fb.control('', Validators.required),
    });
  }

  getAnswersControls(attributeIndex: number): FormArray {
    const attributeGroup = this.formArray.at(attributeIndex) as FormGroup;
    return attributeGroup.get('answers') as FormArray;
  }

  getAttribute(index: number): FormGroup {
    return this.formArray.at(index) as FormGroup;
  }

  _validateMaxCount(insuredType: string): string | null {
    switch (insuredType) {
      case InsuredTypes.MI: {
        const minCount = this.mainInsuredForm.get('minCount')?.value;
        const maxCount = this.mainInsuredForm.get('maxCount')?.value;
        const maxCountControl = this.mainInsuredForm.get('maxCount');
        if (
          (maxCountControl?.dirty || maxCountControl?.touched) &&
          maxCount != null
        ) {
          if (minCount > maxCount) {
            maxCountControl.setErrors({
              minCount: 'Max quantity should be greater than min quantity.',
            });
            return 'Max count should be greater than or equal to min count';
          }
        }
        return null;
      }
      case InsuredTypes.SP: {
        const minCount = this.spouseInsuredForm.get('minCount')?.value;
        const maxCount = this.spouseInsuredForm.get('maxCount')?.value;
        const maxCountControl = this.spouseInsuredForm.get('maxCount');
        if (
          (maxCountControl?.dirty || maxCountControl?.touched) &&
          maxCount != null
        ) {
          if (minCount > maxCount) {
            maxCountControl.setErrors({
              minCount: 'Max quantity should be greater than min quantity.',
            });
            return 'Max count should be greater than or equal to min count';
          }
        }
        return null;
      }
      case InsuredTypes.DPADULT: {
        const minCount = this.dependantAdultForm.get('minCount')?.value;
        const maxCount = this.dependantAdultForm.get('maxCount')?.value;
        const maxCountControl = this.dependantAdultForm.get('maxCount');
        if (
          (maxCountControl?.dirty || maxCountControl?.touched) &&
          maxCount != null
        ) {
          if (minCount > maxCount) {
            maxCountControl.setErrors({
              minCount: 'Max quantity should be greater than min quantity.',
            });
            return 'Max count should be greater than or equal to min count';
          }
        }
        return null;
      }
      case InsuredTypes.DPCHILD: {
        const minCount = this.dependantChildForm.get('minCount')?.value;
        const maxCount = this.dependantChildForm.get('maxCount')?.value;
        const maxCountControl = this.dependantChildForm.get('maxCount');
        if (
          (maxCountControl?.dirty || maxCountControl?.touched) &&
          maxCount != null
        ) {
          if (minCount > maxCount) {
            maxCountControl.setErrors({
              minCount: 'Max quantity should be greater than min quantity.',
            });
            return 'Max count should be greater than or equal to min count';
          }
        }
        return null;
      }
      default:
        return null;
    }
  }

  _validateMinAge(insuredType: string): string | null {
    switch (insuredType) {
      case InsuredTypes.MI:
        if (
          this.mainInsuredForm.get('minAge')?.invalid &&
          (this.mainInsuredForm.get('minAge')?.dirty ||
            this.mainInsuredForm.get('minAge')?.touched)
        ) {
          if (this.mainInsuredForm.get('minAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.mainInsuredForm.get('minAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.mainInsuredForm.get('minAge')?.value >
            this.mainInsuredForm.get('maxAge')?.value
          )
            return "Minimum age can't be more than maximum age";
          if (
            this.mainInsuredForm.get('minAge')?.value >
            this.mainInsuredForm.get('renewalAge')?.value
          )
            return "Minimum age can't be more than renewal age";
        }
        return null;
      case InsuredTypes.SP:
        if (
          this.spouseInsuredForm.get('minAge')?.invalid &&
          (this.spouseInsuredForm.get('minAge')?.dirty ||
            this.spouseInsuredForm.get('minAge')?.touched)
        ) {
          if (this.spouseInsuredForm.get('minAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.spouseInsuredForm.get('minAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.spouseInsuredForm.get('minAge')?.value >
            this.spouseInsuredForm.get('maxAge')?.value
          )
            return "Minimum age can't be more than maximum age";
          if (
            this.spouseInsuredForm.get('minAge')?.value >
            this.spouseInsuredForm.get('renewalAge')?.value
          )
            return "Minimum age can't be more than renewal age";
        }
        return null;
      case InsuredTypes.DPADULT:
        if (
          this.dependantAdultForm.get('minAge')?.invalid &&
          (this.dependantAdultForm.get('minAge')?.dirty ||
            this.dependantAdultForm.get('minAge')?.touched)
        ) {
          if (this.dependantAdultForm.get('minAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantAdultForm.get('minAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantAdultForm.get('minAge')?.value >
            this.dependantAdultForm.get('maxAge')?.value
          )
            return "Minimum age can't be more than maximum age";
          if (
            this.dependantAdultForm.get('minAge')?.value >
            this.dependantAdultForm.get('renewalAge')?.value
          )
            return "Minimum age can't be more than renewal age";
        }
        return null;
      case InsuredTypes.DPCHILD:
        if (
          this.dependantChildForm.get('minAge')?.invalid &&
          (this.dependantChildForm.get('minAge')?.dirty ||
            this.dependantChildForm.get('minAge')?.touched)
        ) {
          if (this.dependantChildForm.get('minAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantChildForm.get('minAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantChildForm.get('minAge')?.value >
            this.dependantChildForm.get('maxAge')?.value
          )
            return "Minimum age can't be more than maximum age";
          if (
            this.dependantChildForm.get('minAge')?.value >
            this.dependantChildForm.get('renewalAge')?.value
          )
            return "Minimum age can't be more than renewal age";
        }
        return null;
      default:
        return null;
    }
  }

  _validateMaxAge(insuredType: string): string | null {
    switch (insuredType) {
      case InsuredTypes.MI:
        if (
          this.mainInsuredForm.get('maxAge')?.invalid &&
          (this.mainInsuredForm.get('maxAge')?.dirty ||
            this.mainInsuredForm.get('maxAge')?.touched)
        ) {
          if (this.mainInsuredForm.get('maxAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.mainInsuredForm.get('maxAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.mainInsuredForm.get('maxAge')?.value <
            this.mainInsuredForm.get('minAge')?.value
          )
            return "Maximum age can't be less than minimum age";
          if (
            this.mainInsuredForm.get('maxAge')?.value <
            this.mainInsuredForm.get('renewalAge')?.value
          )
            return "Minimum age can't be less than renewal age";
        }
        return null;
      case InsuredTypes.SP:
        if (
          this.spouseInsuredForm.get('maxAge')?.invalid &&
          (this.spouseInsuredForm.get('maxAge')?.dirty ||
            this.spouseInsuredForm.get('maxAge')?.touched)
        ) {
          if (this.spouseInsuredForm.get('maxAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.spouseInsuredForm.get('maxAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.spouseInsuredForm.get('maxAge')?.value <
            this.spouseInsuredForm.get('minAge')?.value
          )
            return "Maximum age can't be less than minimum age";
          if (
            this.spouseInsuredForm.get('maxAge')?.value <
            this.spouseInsuredForm.get('renewalAge')?.value
          )
            return "Minimum age can't be less than renewal age";
        }
        return null;
      case InsuredTypes.DPADULT:
        if (
          this.dependantAdultForm.get('maxAge')?.invalid &&
          (this.dependantAdultForm.get('maxAge')?.dirty ||
            this.dependantAdultForm.get('maxAge')?.touched)
        ) {
          if (this.dependantAdultForm.get('maxAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantAdultForm.get('maxAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantAdultForm.get('maxAge')?.value <
            this.dependantAdultForm.get('minAge')?.value
          )
            return "Maximum age can't be less than minimum age";
          if (
            this.dependantAdultForm.get('maxAge')?.value <
            this.dependantAdultForm.get('renewalAge')?.value
          )
            return "Minimum age can't be less than renewal age";
        }
        return null;
      case InsuredTypes.DPCHILD:
        if (
          this.dependantChildForm.get('maxAge')?.invalid &&
          (this.dependantChildForm.get('maxAge')?.dirty ||
            this.dependantChildForm.get('maxAge')?.touched)
        ) {
          if (this.dependantChildForm.get('maxAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantChildForm.get('maxAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantChildForm.get('maxAge')?.value <
            this.dependantChildForm.get('minAge')?.value
          )
            return "Maximum age can't be less than minimum age";
          if (
            this.dependantChildForm.get('maxAge')?.value <
            this.dependantChildForm.get('renewalAge')?.value
          )
            return "Minimum age can't be less than renewal age";
        }
        return null;
      default:
        return null;
    }
  }

  _validateRenewalAge(insuredType: string): string | null {
    switch (insuredType) {
      case InsuredTypes.MI:
        if (
          this.mainInsuredForm.get('renewalAge')?.invalid &&
          (this.mainInsuredForm.get('renewalAge')?.dirty ||
            this.mainInsuredForm.get('renewalAge')?.touched)
        ) {
          if (this.mainInsuredForm.get('renewalAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.mainInsuredForm.get('renewalAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.mainInsuredForm.get('renewalAge')?.value <
            this.mainInsuredForm.get('minAge')?.value
          )
            return "Renewal age can't be less than minimum age";
          if (
            this.mainInsuredForm.get('renewalAge')?.value <
            this.mainInsuredForm.get('maxAge')?.value
          )
            return "Renewal age can't be more than maximum age";
        }
        return null;
      case InsuredTypes.SP:
        if (
          this.spouseInsuredForm.get('renewalAge')?.invalid &&
          (this.spouseInsuredForm.get('renewalAge')?.dirty ||
            this.spouseInsuredForm.get('renewalAge')?.touched)
        ) {
          if (this.spouseInsuredForm.get('renewalAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.spouseInsuredForm.get('renewalAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.spouseInsuredForm.get('renewalAge')?.value <
            this.spouseInsuredForm.get('minAge')?.value
          )
            return "Renewal age can't be less than minimum age";
          if (
            this.spouseInsuredForm.get('renewalAge')?.value <
            this.spouseInsuredForm.get('maxAge')?.value
          )
            return "Renewal age can't be more than maximum age";
        }
        return null;
      case InsuredTypes.DPCHILD:
        if (
          this.dependantChildForm.get('renewalAge')?.invalid &&
          (this.dependantChildForm.get('renewalAge')?.dirty ||
            this.dependantChildForm.get('renewalAge')?.touched)
        ) {
          if (this.dependantChildForm.get('renewalAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantChildForm.get('renewalAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantChildForm.get('renewalAge')?.value <
            this.dependantChildForm.get('minAge')?.value
          )
            return "Renewal age can't be less than minimum age";
          if (
            this.dependantChildForm.get('renewalAge')?.value <
            this.dependantChildForm.get('maxAge')?.value
          )
            return "Renewal age can't be more than maximum age";
        }
        return null;
      case InsuredTypes.DPADULT:
        if (
          this.dependantAdultForm.get('renewalAge')?.invalid &&
          (this.dependantAdultForm.get('renewalAge')?.dirty ||
            this.dependantAdultForm.get('renewalAge')?.touched)
        ) {
          if (this.dependantAdultForm.get('renewalAge')?.errors?.['max'])
            return 'Max length is 2';
          if (this.dependantAdultForm.get('renewalAge')?.errors?.['required'])
            return 'Required field';
          if (
            this.dependantAdultForm.get('renewalAge')?.value <
            this.dependantAdultForm.get('minAge')?.value
          )
            return "Renewal age can't be less than minimum age";
          if (
            this.dependantAdultForm.get('renewalAge')?.value <
            this.dependantAdultForm.get('maxAge')?.value
          )
            return "Renewal age can't be more than maximum age";
        }
        return null;
      default:
        return null;
    }
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  enableDeleteConfirmation(index: number, insured?: string) {
    this.openDeleteModal = true;
    this.deleteSelectedItem = index;
    this.deleteSelectedInsuredlobAttribute = insured ?? '';
    if (insured) {
      this.deleteModalTitle =
        'Do you want to delete the Pre-defined attribute?';
    } else {
      this.deleteModalTitle = 'Do you want to delete the custom attribute?';
    }
  }

  deleteConfirmation() {
    this.removeAttribute(this.deleteSelectedItem);
  }

  getPredefinedAttributeNameErrorMessage(nameControl: any) {
    if (!nameControl) {
      return null;
    }

    if (nameControl.invalid && (nameControl.dirty || nameControl.touched)) {
      if (nameControl.errors?.['attrDuplicate']) {
        return this.labels?.duplicateCustAttrErrorMessage;
      }
    }
    if (nameControl.errors?.['attrDuplicate']) {
      return this.labels?.duplicateCustAttrErrorMessage;
    }

    return null;
  }

  getCustAttributeNameErrorMessage(nameControl: any, dataTypeControl: any) {
    if (!nameControl) {
      return null;
    }

    if (nameControl.invalid && (nameControl.dirty || nameControl.touched)) {
      if (nameControl.errors?.['maxlength']) {
        const dataTypeValue = dataTypeControl ? dataTypeControl.value : null;
        return dataTypeValue === 'STRING'
          ? 'Data cannot be more than 500 characters'
          : 'Data cannot be more than 100 characters';
      }
      if (nameControl.errors?.['attrDuplicate']) {
        return this.labels?.duplicateCustAttrErrorMessage;
      }
    }
    if (nameControl.errors?.['attrDuplicate']) {
      return this.labels?.duplicateCustAttrErrorMessage;
    }

    return null;
  }

  getDropdownAnswerErrorMessage(nameControl: any) {
    if (!nameControl) {
      return null;
    }

    if (nameControl.invalid && (nameControl.dirty || nameControl.touched)) {
      return 'Required field';
    }
    return null;
  }

  toggleBeneficiary() {
    this.isBeneficiaryIncluded = !this.isBeneficiaryIncluded;
  }

  private _toggleRequiredAndDuplicateAttributes(insuredType: string): void {
    //Main insured
    if (insuredType === InsuredTypes.MI) {
      this.mainInsuredForm?.get('requiredAttribute')?.reset();
      this.mainInsuredForm?.get('doNotAllowDuplicateAttribute')?.reset();

      this.requiredAttributesList[InsuredTypes.MI] = [];
      this.noDuplicatesList[InsuredTypes.MI] = [];

      this.mainInsuredForm
        ?.get('predefinedAttribute')
        ?.value?.forEach((obj: PredefinedAttr) => {
          this.requiredAttributesList[InsuredTypes.MI] = [
            ...(this.requiredAttributesList[InsuredTypes.MI] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];

          this.noDuplicatesList[InsuredTypes.MI] = [
            ...(this.noDuplicatesList[InsuredTypes.MI] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];
        });
    }
    //Spouse
    else if (insuredType === InsuredTypes.SP) {
      this.spouseInsuredForm?.get('requiredAttribute')?.reset();
      this.spouseInsuredForm?.get('doNotAllowDuplicateAttribute')?.reset();

      this.requiredAttributesList[InsuredTypes.SP] = [];
      this.noDuplicatesList[InsuredTypes.SP] = [];

      this.spouseInsuredForm
        ?.get('predefinedAttribute')
        ?.value?.forEach((obj: MasterData) => {
          this.requiredAttributesList[InsuredTypes.SP] = [
            ...(this.requiredAttributesList[InsuredTypes.SP] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];

          this.noDuplicatesList[InsuredTypes.SP] = [
            ...(this.noDuplicatesList[InsuredTypes.SP] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];
        });
    }
    //Dependent child
    else if (insuredType === InsuredTypes.DPCHILD) {
      this.dependantChildForm?.get('requiredAttribute')?.reset();
      this.dependantChildForm?.get('doNotAllowDuplicateAttribute')?.reset();

      this.requiredAttributesList[InsuredTypes.DPCHILD] = [];
      this.noDuplicatesList[InsuredTypes.DPCHILD] = [];

      this.dependantChildForm
        ?.get('predefinedAttribute')
        ?.value?.forEach((obj: MasterData) => {
          this.requiredAttributesList[InsuredTypes.DPCHILD] = [
            ...(this.requiredAttributesList[InsuredTypes.DPCHILD] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];

          this.noDuplicatesList[InsuredTypes.DPCHILD] = [
            ...(this.noDuplicatesList[InsuredTypes.DPCHILD] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];
        });
    }
    //Dependent Adult
    else if (insuredType === InsuredTypes.DPADULT) {
      this.dependantAdultForm?.get('requiredAttribute')?.reset();
      this.dependantAdultForm?.get('doNotAllowDuplicateAttribute')?.reset();

      this.requiredAttributesList[InsuredTypes.DPADULT] = [];
      this.noDuplicatesList[InsuredTypes.DPADULT] = [];

      this.dependantAdultForm
        ?.get('predefinedAttribute')
        ?.value?.forEach((obj: MasterData) => {
          this.requiredAttributesList[InsuredTypes.DPADULT] = [
            ...(this.requiredAttributesList[InsuredTypes.DPADULT] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];

          this.noDuplicatesList[InsuredTypes.DPADULT] = [
            ...(this.noDuplicatesList[InsuredTypes.DPADULT] ?? []),
            {
              label: obj.description || '',
              value: obj.description,
              checked: false,
            },
          ];
        });
    }
  }

  handleDeleteAttributeModal() {
    this.openDeleteAttributeModal = false;
  }

  deleteAttributeConfirmation() {
    const { attribute, index } = this.deleteSelectedAttribute;
    const answersArray = attribute.get('answers') as FormArray;
    answersArray.removeAt(index);
    this.openDeleteAttributeModal = false;
  }

  updateValidators() {
    if (!this.isDependantAdultSelected) {
      this.dependantAdultForm?.controls['minAge']?.clearValidators();
      this.dependantAdultForm?.controls['maxAge']?.clearValidators();
      this.dependantAdultForm?.controls['renewalAge']?.clearValidators();
      this.dependantAdultForm?.get('minAge')?.updateValueAndValidity();
      this.dependantAdultForm.get('maxAge')?.updateValueAndValidity();
      this.dependantAdultForm.get('renewalAge')?.updateValueAndValidity();
      this.individualInsuredForm
        .get('dependantAdultForm')
        ?.updateValueAndValidity();
    }
    if (!this.isDependantChildSelected) {
      this.dependantChildForm?.controls['minAge']?.clearValidators();
      this.dependantChildForm?.controls['maxAge']?.clearValidators();
      this.dependantChildForm?.controls['renewalAge']?.clearValidators();
      this.dependantChildForm?.controls['minAge']?.updateValueAndValidity();
      this.dependantChildForm?.controls['maxAge']?.updateValueAndValidity();
      this.dependantChildForm.get('renewalAge')?.updateValueAndValidity();
      this.dependantChildForm?.updateValueAndValidity();
      this.individualInsuredForm
        .get('dependantChildForm')
        ?.updateValueAndValidity();
    }
    if (!this.isSpouseSelected) {
      this.spouseInsuredForm?.controls['minAge']?.clearValidators();
      this.spouseInsuredForm?.controls['maxAge']?.clearValidators();
      this.spouseInsuredForm?.controls['renewalAge']?.clearValidators();
      this.spouseInsuredForm?.get('minAge')?.updateValueAndValidity();
      this.spouseInsuredForm.get('maxAge')?.updateValueAndValidity();
      this.spouseInsuredForm.get('renewalAge')?.updateValueAndValidity();
      this.individualInsuredForm.get('spouseInsuredForm')?.clearValidators();
    }
    this.individualInsuredForm.updateValueAndValidity();
  }

  disableRateAsIndividualCheck(data: any[]): void {
    const isOnlyMainInsuredPresent =
      data.length === 1 && data[0]?.code === MsgIds.MAIN_INS;
    this.toggleIndividuallyRated(!isOnlyMainInsuredPresent);
  }

  disableRateAsIndividual(flag: boolean): void {
    this.toggleIndividuallyRated(!flag);
  }

  isMainInsuredTypeSelected(): boolean {
    const insuredTypeValue = this.typeSelectionForm?.get('insuredType')?.value;
    return (
      insuredTypeValue.length === 1 &&
      insuredTypeValue[0]?.code === MsgIds.MAIN_INS
    );
  }

  getIndividuallyRatedValueForMainInsured(): boolean {
    if (this.isMainInsuredTypeSelected()) {
      return true;
    }
    return this.typeSelectionForm?.get('individuallyRated')?.value;
  }

  // getIndividuallyRatedValue(): boolean {
  //   if (this.isMainInsuredTypeSelected()) {
  //     return true;
  //   }
  //   return this.typeSelectionForm?.get('individuallyRated')?.value;
  // }

  private toggleIndividuallyRated(enable: boolean): void {
    const individuallyRated = this.typeSelectionForm?.get('individuallyRated');
    if (enable) {
      individuallyRated?.enable();
    } else {
      individuallyRated?.setValue(true);
      individuallyRated?.disable();
    }
    //enable ? individuallyRated?.enable() : individuallyRated?.disable();
  }
}

export interface Insured {
  minCount: FormControl;
  maxCount: FormControl;
  minAge: FormControl;
  maxAge: FormControl;
  renewalAge: FormControl;
  predefinedAttribute: FormControl;
  predefinedTypeChipControl: FormControl;
  requiredAttribute: FormControl;
  doNotAllowDuplicateAttribute: FormControl;
  //predefinedAttributesForm: FormGroup;
}

export interface InsuredData {
  insuredId: string;
  includeBeneficiaries: boolean;
  individual: Individual;
  entities?: string[];
  requestId: string;
  maxBeneficiariesAllowed: number;
}

export interface InsuredResponse {
  data: InsuredData;
  succeeded: boolean;
  requestId: string;
}

export const InsuredTypes = {
  MI: 'MI',
  SP: 'SP',
  DPCHILD: 'DPCHILD',
  DPADULT: 'DPADULT',
};
