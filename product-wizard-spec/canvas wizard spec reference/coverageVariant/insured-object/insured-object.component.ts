/* eslint-disable @typescript-eslint/no-explicit-any */
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
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import { LayoutComponent, LayoutService } from '@canvas/components';
import { AppContextService } from '@canvas/services';
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
import { isEmpty } from 'lodash';
import { isNull, isUndefined } from 'lodash-es';
import { AccordionModule } from 'primeng/accordion';
import { ChipsModule, ChipsRemoveEvent } from 'primeng/chips';
import {
  MultiSelectChangeEvent,
  MultiSelectModule,
  MultiSelectSelectAllChangeEvent,
} from 'primeng/multiselect';
import { combineLatest } from 'rxjs';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { InsuredTypeService } from '../../../services/insured-type.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant } from '../../../types/coverage';
import {
  CustomAttribute,
  InsuredObject,
  InsuredObjectPostRequest,
  PredefinedAttr,
  SupportedInsuredType,
  Value,
} from '../../../types/insured-object';
import { MasterData } from '../../../types/product';
import { ProductContext } from '../../../types/product-context';
import { Category } from '../../../types/ref-data';
import {
  CustomeAttributes,
  InsuredFormTypes,
  InsuredObjectForm,
  InsuredType,
} from '../insured-type-selection/model/insured-type.model';
import { InsuredObjectLabels } from './model/insured-object.model';

@UntilDestroy()
@Component({
  selector: 'canvas-insured-object',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    CbButtonModule,
    ReactiveFormsModule,
    CbToggleModule,
    CbSelectMultipleModule,
    CbCheckboxModule,
    MultiSelectModule,
    ChipsModule,
    AccordionModule,
    CbInputModule,
    CbIconModule,
    CbModalModule,
    CbSelectChoiceModule,
    CbMultiCheckboxModule,
    CbTooltipModule,
    inputUnselectPipe,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './insured-object.component.html',
  styleUrls: ['./insured-object.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InsuredObjectComponent implements OnInit {
  protected checkInput(i: number) {
    console.log(this.getAttributesFormArray(i).value);
  }
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;
  coverageVariants!: CoverageVariant[];
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  selectAllFlags: {
    [key: string]: {
      selectAllPredefinedAttributes: boolean;
      selectAllAllowedParties: boolean;
      selectAllFileTypes: boolean[];
    };
  } = {};
  selectAllInsured = false;
  insuredObjectForm: FormGroup;
  selectedObjectTypes: Value[] = [];
  modalOpen = false;
  open: boolean;
  insuredTypes: InsuredType[] = [];
  customAttributes: CustomeAttributes[] = [];
  insuredFormTypes = InsuredFormTypes;
  insuredObjectId!: string;
  insuredList: Value[];
  preDefinedAttributesList: PredefinedAttr[];
  allowedPartiesList: MasterData[] = [];
  productClass: string;
  dataTypes: MasterData[] = [];
  predefinedAttr: PredefinedAttr[] | undefined;
  insuredObjectsList: InsuredObject[] | undefined;
  supportedInsuredType: SupportedInsuredType[] | undefined;
  productContext: ProductContext;
  country: string;
  policyHolderTypeOptions: MasterData[] = [];
  noDuplicatesList: { [key: string]: CbCheckboxConfig[] } = {};
  requiredAttributesList: { [key: string]: CbCheckboxConfig[] } = {};
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  selectAllFileTypes: boolean[][] = [];
  selectedFileTypes: (MasterData | undefined)[][] = [];
  fileTypeList: MasterData[] = [];
  disableEdit = false;

  disableDel: boolean[][] = [];
  currVersChange: boolean;
  disableClrSelection = false;
  get typeSelectionForm(): FormGroup {
    return this.insuredObjectForm.get('typeSelectionForm') as FormGroup;
  }

  get policyHolderType(): FormControl {
    return this.insuredObjectForm
      .get('typeSelectionForm')
      ?.get('policyHolderType') as FormControl;
  }

  get objectType(): FormControl {
    return this.insuredObjectForm
      .get('typeSelectionForm')
      ?.get('objectType') as FormControl;
  }

  get objectFormArray(): FormArray {
    return this.insuredObjectForm.get('objectsForm') as FormArray;
  }

  public set changesForCurrVersion(v: boolean) {
    this.currVersChange = v;
  }

  openDeleteModal: boolean;
  deleteSelectedItem: any;
  openDeleteAttributeModal = false;
  deleteSelectedAttribute: any;

  labels!: InsuredObjectLabels;

  constructor(
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _fb: FormBuilder,
    private _router: Router,
    private _commands: StudioCommands,
    private _insuredTypeService: InsuredTypeService,
    private _productsService: ProductsService,
    private _variantLevelService: VariantLevelService,
    private _productContextService: ProductContextService,
    private _appContextService: AppContextService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this.coverageVariantId = localStorage?.getItem('coverageVariantId') || '';
    this.productClass = localStorage?.getItem('ProductClass') || '';

    this.labels = <InsuredObjectLabels>(
      this._appContextService.get('pages.product.insured-object.labels')
    );
  }

  ngOnInit(): void {
    const statusVal = this._productContextService.isProductDisabled();

    this.insuredObjectForm = this._fb.group({
      typeSelectionForm: this._fb.group({
        policyHolderType: this._fb.control(
          { value: '', disabled: statusVal ? true : false },
          [Validators.required]
        ),
        objectType: this._fb.control(
          { value: '', disabled: statusVal ? true : false },
          [Validators.required]
        ),
        objectTypeChipControl: this._fb.control(
          { value: '', disabled: statusVal ? true : false },
          []
        ),
      }),
      objectsForm: this._fb.array([]),
    });

    this._fetchReferenceData();
    this._productContext();
    if (statusVal) {
      this.insuredObjectForm.disable();
      this.typeSelectionForm.disable();
      this.disableEdit = true;
    }
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

  getObjectFromCode(code: string): string {
    return (
      this.insuredList.find((obj) => obj.msgId === code)?.description || ''
    );
  }

  getAttributesFormArray(index: number): FormArray {
    return (<FormGroup>(
      this.objectFormArray.controls[index]?.get('customAttributesForm')
    ))?.controls['attributes'] as FormArray;
  }

  getObjectId(index: number): string {
    return this.objectFormArray.controls[index]?.get('objectId')?.value;
  }

  addAttribute(index: number, disableEditFlag = false): void {
    this.getAttributesFormArray(index).push(this._initCustomAttribute(index));
    if (!this.disableDel[index]) {
      this.disableDel[index] = [];
    }
    this.disableDel[index]?.push(disableEditFlag);
  }

  removeAttribute(parentIndex: number, index: number): void {
    this.openDeleteModal = false;
    this.getAttributesFormArray(parentIndex).removeAt(index);
    this.disableDel[parentIndex].splice(index, 1);
    this.objectFormArray.markAsDirty();
  }

  onMultiSelectChange(
    event: MultiSelectChangeEvent,
    type: string,
    objectArrayControl?: AbstractControl
  ): void {
    if (event.itemValue) {
      switch (type) {
        case InsuredFormTypes.OBJECTTYPE:
          event.value.length === this.insuredList.length
            ? (this.selectAllInsured = true)
            : (this.selectAllInsured = false);

          if (this.selectAllInsured) {
            this.typeSelectionForm
              ?.get('objectTypeChipControl')
              ?.patchValue(this.selectedObjectTypes);
          }
          if ((<any>event.originalEvent).selected) {
            this._toggleInsuredGroups(event.itemValue, 'add');
          } else {
            this._toggleInsuredGroups(event.itemValue, 'remove');
          }
          this.typeSelectionForm
            ?.get('objectTypeChipControl')
            ?.patchValue(this.selectedObjectTypes);
          break;

        case InsuredFormTypes.PREDEFINEDATTRIBUTE:
          this._toggleRequiredAndDuplicateAttributes(objectArrayControl);
          objectArrayControl
            ?.get('predefinedTypeChipControl')
            ?.patchValue(event.value);
          if (
            !this.selectAllFlags[objectArrayControl?.get('objectId')?.value]
          ) {
            this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
              ...this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ],
            };
          }
          event.value.length === this.preDefinedAttributesList.length
            ? (this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ].selectAllPredefinedAttributes = true)
            : (this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ].selectAllPredefinedAttributes = false);
          break;

        case InsuredFormTypes.ALLOWEDPARTYTYPE:
          objectArrayControl
            ?.get('allowedParties')
            ?.get('insuredChipControl')
            ?.patchValue(event.value);
          if (
            !this.selectAllFlags[objectArrayControl?.get('objectId')?.value]
          ) {
            this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
              ...this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ],
            };
          }
          event.value.length === this.allowedPartiesList.length
            ? (this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ].selectAllAllowedParties = true)
            : (this.selectAllFlags[
                objectArrayControl?.get('objectId')?.value
              ].selectAllAllowedParties = false);
          break;
      }
    }
  }

  onMultiSelectSelectAllChange(
    event: MultiSelectSelectAllChangeEvent,
    type: string,
    objectArrayControl?: AbstractControl
  ): void {
    switch (type) {
      case InsuredFormTypes.OBJECTTYPE:
        this.selectAllInsured = event.checked;
        this.selectedObjectTypes = event.checked
          ? [...this.insuredList]
          : [...this.insuredList.filter((item) => item.disabled)];
        this._toggleInsuredGroups({}, event.checked ? 'add' : 'remove', true);
        this.typeSelectionForm
          ?.get('objectTypeChipControl')
          ?.patchValue(this.selectedObjectTypes);
        break;

      case InsuredFormTypes.PREDEFINEDATTRIBUTE:
        this._toggleRequiredAndDuplicateAttributes(objectArrayControl);
        this.preDefinedAttributesList =
          this.selectedObjectTypes.find(
            (obj) =>
              obj.description == objectArrayControl?.get('objectId')?.value
          )?.predefinedAttr || [];
        objectArrayControl
          ?.get('predefinedAttribute')
          ?.patchValue(event.checked ? [...this.preDefinedAttributesList] : []);
        objectArrayControl
          ?.get('predefinedTypeChipControl')
          ?.patchValue(event.checked ? [...this.preDefinedAttributesList] : []);
        if (this.selectAllFlags[objectArrayControl?.get('objectId')?.value]) {
          this.selectAllFlags[
            objectArrayControl?.get('objectId')?.value
          ].selectAllPredefinedAttributes = event.checked;
        } else {
          this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
            ...this.selectAllFlags[objectArrayControl?.get('objectId')?.value],
            selectAllPredefinedAttributes: true,
          };
        }
        break;

      case InsuredFormTypes.ALLOWEDPARTYTYPE:
        objectArrayControl
          ?.get('allowedParties')
          ?.get('insured')
          ?.patchValue(event.checked ? [...this.allowedPartiesList] : []);
        objectArrayControl
          ?.get('allowedParties')
          ?.get('insuredChipControl')
          ?.patchValue(event.checked ? [...this.allowedPartiesList] : []);
        if (this.selectAllFlags[objectArrayControl?.get('objectId')?.value]) {
          this.selectAllFlags[
            objectArrayControl?.get('objectId')?.value
          ].selectAllAllowedParties = event.checked;
        } else {
          this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
            ...this.selectAllFlags[objectArrayControl?.get('objectId')?.value],
            selectAllAllowedParties: true,
          };
        }
        break;
    }
  }

  onSelectAllFileTypes(
    e: MultiSelectSelectAllChangeEvent,
    a?: AbstractControl
  ) {
    e.checked
      ? a?.get('fileTypes')?.patchValue([...this.fileTypeList])
      : a?.get('fileTypes')?.patchValue([]);
  }
  clearSelection(type: string, objectArrayControl?: AbstractControl): void {
    switch (type) {
      case InsuredFormTypes.OBJECTTYPE:
        this.selectAllInsured = false;
        this.objectType?.reset();
        this.objectFormArray.clear();
        this.typeSelectionForm?.get('objectTypeChipControl')?.reset();
        break;

      case InsuredFormTypes.PREDEFINEDATTRIBUTE:
        this._toggleRequiredAndDuplicateAttributes(objectArrayControl);
        if (this.selectAllFlags[objectArrayControl?.get('objectId')?.value]) {
          this.selectAllFlags[
            objectArrayControl?.get('objectId')?.value
          ].selectAllPredefinedAttributes = false;
        } else {
          this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
            ...this.selectAllFlags[objectArrayControl?.get('objectId')?.value],
            selectAllPredefinedAttributes: false,
          };
        }

        objectArrayControl?.get('predefinedAttribute')?.patchValue([]);
        objectArrayControl?.get('predefinedTypeChipControl')?.reset();
        break;

      case InsuredFormTypes.ALLOWEDPARTYTYPE:
        objectArrayControl
          ?.get('allowedParties')
          ?.get('insured')
          ?.patchValue([]);
        objectArrayControl
          ?.get('allowedParties')
          ?.get('insuredChipControl')
          ?.reset();
        if (this.selectAllFlags[objectArrayControl?.get('objectId')?.value]) {
          this.selectAllFlags[
            objectArrayControl?.get('objectId')?.value
          ].selectAllAllowedParties = false;
        } else {
          this.selectAllFlags[objectArrayControl?.get('objectId')?.value] = {
            ...this.selectAllFlags[objectArrayControl?.get('objectId')?.value],
            selectAllAllowedParties: false,
          };
        }
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
    objectArrayContol?: AbstractControl
  ): void {
    if (event.value.disabled) {
      const objectTypeValue =
        this.typeSelectionForm?.get('objectType')?.value ?? [];
      this.typeSelectionForm.patchValue({
        objectTypeChipControl: objectTypeValue,
      });
      this.deleteError();
    } else {
      const id = event.value.id || event.value.msgId || event.value.code;
      switch (type) {
        case InsuredFormTypes.OBJECTTYPE: {
          const selectedTypes = this.objectType?.value;
          this.objectType?.patchValue(
            selectedTypes.filter((ele: { msgId: string }) => ele.msgId !== id)
          );
          this._toggleInsuredGroups(event.value, 'remove');
          this.selectedObjectTypes.length === this.insuredList.length
            ? (this.selectAllInsured = true)
            : (this.selectAllInsured = false);
          break;
        }
        case InsuredFormTypes.PREDEFINEDATTRIBUTE: {
          this._toggleRequiredAndDuplicateAttributes(objectArrayContol);
          const selectedItems = objectArrayContol
            ?.get('predefinedTypeChipControl')
            ?.value.filter((ele: { msgId: string }) => ele.msgId !== id);
          objectArrayContol
            ?.get('predefinedTypeChipControl')
            ?.patchValue(selectedItems);
          objectArrayContol
            ?.get('predefinedAttribute')
            ?.patchValue(selectedItems);
          if (selectedItems.length === this.preDefinedAttributesList.length) {
            if (
              this.selectAllFlags[objectArrayContol?.get('objectId')?.value]
                ?.selectAllPredefinedAttributes != undefined
            ) {
              this.selectAllFlags[
                objectArrayContol?.get('objectId')?.value
              ].selectAllPredefinedAttributes = true;
            }
          } else {
            if (
              this.selectAllFlags[objectArrayContol?.get('objectId')?.value]
                ?.selectAllPredefinedAttributes != undefined
            ) {
              this.selectAllFlags[
                objectArrayContol?.get('objectId')?.value
              ].selectAllPredefinedAttributes = false;
            }
          }
          break;
        }

        case InsuredFormTypes.ALLOWEDPARTYTYPE: {
          const selectedItems = objectArrayContol
            ?.get('allowedParties')
            ?.get('insuredChipControl')
            ?.value.filter((ele: { id: string }) => ele.id !== id);
          objectArrayContol
            ?.get('allowedParties')
            ?.get('insured')
            ?.patchValue(selectedItems);
          if (selectedItems.length === this.allowedPartiesList.length) {
            if (
              this.selectAllFlags[objectArrayContol?.get('objectId')?.value]
                ?.selectAllAllowedParties != undefined
            ) {
              this.selectAllFlags[
                objectArrayContol?.get('objectId')?.value
              ].selectAllAllowedParties = true;
            }
          } else {
            if (
              this.selectAllFlags[objectArrayContol?.get('objectId')?.value]
                ?.selectAllAllowedParties != undefined
            ) {
              this.selectAllFlags[
                objectArrayContol?.get('objectId')?.value
              ].selectAllAllowedParties = false;
            }
          }
          break;
        }
      }
    }
  }

  saveAndExit(moveToNext?: boolean): void {
    this.changesForCurrVersion =
      this.currVersChange || this.objectFormArray.dirty;
    this.insuredObjectForm?.markAllAsTouched();
    this.insuredObjectForm?.updateValueAndValidity();
    if (this.insuredObjectForm.invalid) {
      return;
    } else {
      const saveInsuredCommand = {
        commandName: 'HttpCommand',
        parameter: {
          url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/insuredobjects?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
          method: 'POST',
        },
      };

      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: 'Insured Object Saved Successfully.',
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: 'error occured. please try again after sometime.',
          duration: 5000,
        },
        updateSuccess: {
          severity: 'success',
          message: 'Insured Object Updated Successfully.',
          duration: 5000,
        },
        cvResetSuccess: {
          severity: 'success',
          message:
            'Coverage variant levels has been reset. All pre-existing variant levels are removed.',
          duration: 5000,
        },
        cvResetFailure: {
          severity: 'success',
          message: 'Coverage variant levels could not be reset.',
          duration: 5000,
        },
      };
      const insuredObjectList: InsuredObject[] = [];
      for (let i = 0; i < this.objectFormArray.length; i++) {
        const insuredObject = this._prepareRequestObject(i);
        insuredObjectList.push(insuredObject);
      }
      const payload: InsuredObjectPostRequest = {
        insuredObjects: insuredObjectList,
      };

      if (
        this.insuredObjectsList != undefined &&
        this.insuredObjectsList != null &&
        this.insuredObjectsList?.length > 0
      ) {
        const editInsuredCommand = {
          commandName: 'HttpCommand',
          parameter: {
            url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/insuredobjects?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
            method: 'PATCH',
          },
        };
        const resetCVLevelCommand = {
          commandName: 'HttpCommand',
          parameter: {
            url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/variantlevels?versionId=${this.productVersionId}`,
            method: 'PUT',
          },
        };
        const resetCVLevelPayload = {
          requestId: this.productContext.requestId,
          coverageVariantLevels: [],
        };
        this._commands
          .execute(editInsuredCommand, payload, {})
          .then((response) => {
            const oldInsList = this.insuredObjectsList?.map((ins) =>
              ins.type.value.toUpperCase()
            );
            const newInsList = insuredObjectList?.map((ins) =>
              ins.type.value.toUpperCase()
            );

            if (moveToNext) {
              this._sharedService.nextButtonClicked.next({
                stepCount: this._productsService.getCoverageFactorsStepCount(),
              });
            } else {
              this._router.navigate(['products']);
            }
            if (
              !this.disableClrSelection &&
              !(
                oldInsList?.length === newInsList?.length &&
                oldInsList?.sort().join(',') === newInsList?.sort().join(',')
              )
            ) {
              this._commands
                .execute(resetCVLevelCommand, resetCVLevelPayload, {})
                .then((res) => {
                  this._layoutService.showMessage(
                    toastMessageConfig[
                      `${res === false ? 'cvResetFailure' : 'cvResetSuccess'}`
                    ]
                  );
                });
            }
            this._layoutService.showMessage(
              toastMessageConfig[
                `${response === false ? 'error' : 'updateSuccess'}`
              ]
            );
          })
          .catch(() => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          });
      } else {
        this._commands
          .execute(saveInsuredCommand, payload, {})
          .then((response) => {
            this._layoutService.showMessage(
              toastMessageConfig[`${response === false ? 'error' : 'success'}`]
            );
            if (moveToNext) {
              this._sharedService.nextButtonClicked.next({
                stepCount: this._productsService.getCoverageFactorsStepCount(),
              });
            } else {
              this._router.navigate(['products']);
            }
          })
          .catch(() => {
            this._layoutService.showMessage(toastMessageConfig['error']);
          });
      }
    }
  }

  saveAndNext(): void {
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next({
        stepCount: this._productsService.getCoverageFactorsStepCount(),
      });
    } else {
      this.saveAndExit(true);
    }
  }

  private _toggleRequiredAndDuplicateAttributes(
    objectArrayControl?: AbstractControl
  ): void {
    objectArrayControl?.get('requiredAttribute')?.reset();
    objectArrayControl?.get('doNotAllowDuplicateAttribute')?.reset();

    this.requiredAttributesList[objectArrayControl?.get('objectId')?.value] =
      [];
    this.noDuplicatesList[objectArrayControl?.get('objectId')?.value] = [];

    objectArrayControl
      ?.get('predefinedAttribute')
      ?.value.forEach((obj: PredefinedAttr) => {
        this.requiredAttributesList[objectArrayControl.get('objectId')?.value] =
          [
            ...(this.requiredAttributesList[
              objectArrayControl.get('objectId')?.value
            ] ?? []),
            {
              label: obj.description,
              value: obj.description,
              checked: false,
            },
          ];

        this.noDuplicatesList[objectArrayControl.get('objectId')?.value] = [
          ...(this.noDuplicatesList[
            objectArrayControl.get('objectId')?.value
          ] ?? []),
          {
            label: obj.description,
            value: obj.description,
            checked: false,
          },
        ];
      });
  }

  private _fetchReferenceData(): void {
    combineLatest([
      this._productsService.getReferenceData(Category.ALLOPART),
      this._productsService.getDataTypes(),
      this._variantLevelService.getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      ),
      this._insuredTypeService.getPredefinedAttributes(this.productClass),
      this._productsService.getReferenceData(Category.POLICYHOLDERTYPE),
      this._productsService.getReferenceData(Category.FILETYPE),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.allowedPartiesList = response[0];
          this.dataTypes = response[1];
          this.insuredObjectsList = response[2].insuredObjects;
          this.supportedInsuredType =
            response[3].productClass.supportedInsuredType;
          this.policyHolderTypeOptions = response[4];
          this.fileTypeList = response[5];
          const values = this.supportedInsuredType.find(
            (x) => x.values
          )?.values;
          if (values != undefined) {
            this.insuredList = values;
          }
          this.addDisableToDropDowns();

          const attributes = values?.find(
            (x) => x.predefinedAttr
          )?.predefinedAttr;
          this.preDefinedAttributesList = [];
          if (attributes != undefined) {
            attributes.forEach((item: any) => {
              const data = {
                msgId: item.msgId,
                description: item.description,
              };
              this.preDefinedAttributesList?.push(data);
            });
          }
          if (!isEmpty(this.insuredObjectsList)) {
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

  private addDisableToDropDowns(): void {
    this.insuredList?.map((item) => {
      item.isCurrentVersion = true;
      item.disabled = false;
    });
    this.insuredObjectsList?.map((item) => {
      const insured = this.insuredList?.find(
        (ins) => ins.msgId === item?.type?.value
      );
      if (insured) {
        insured.isCurrentVersion = item.isCurrentVersion;
        insured.disabled = !item.isCurrentVersion;
      }
    });
  }

  private async _prefillForm() {
    const insuredObjects = await this._getInsuredObjects();
    const policyHolderType = await this._getPolicyHolderType();
    this.typeSelectionForm.patchValue({
      objectType: insuredObjects,
      objectTypeChipControl: insuredObjects,
      policyHolderType: policyHolderType,
    });
    this._updateSelectAllFlag();
    this._getDetails();
  }

  private _getPolicyHolderType() {
    return this.policyHolderTypeOptions.find(
      (pol) => pol.code === this.insuredObjectsList?.[0].policyHolderType?.value
    )?.description;
  }

  private _getInsuredObjects() {
    const insuredObjs = this.insuredObjectsList?.map((ins) => {
      return {
        msgId: ins.type.value,
        description: this.insuredList.find(
          (insuredObj) => insuredObj.msgId === ins.type.value
        )?.description,
        predefinedAttr:
          this.insuredList?.filter(
            (lst) => lst.msgId.trim() === ins.type.value.trim()
          )[0]?.predefinedAttr ?? [],
        isCurrentVersion: ins.isCurrentVersion,
        disabled: !ins.isCurrentVersion,
      };
    });
    return insuredObjs;
  }

  private _updateSelectAllFlag() {
    this.insuredObjectsList?.forEach((obj) =>
      this.insuredList.forEach((ins) => {
        if (
          ins.description.trim() === obj.type.value.trim() &&
          ins.predefinedAttr?.length === obj.lobSpecificAttributes.length
        ) {
          this.selectAllFlags[ins.description] = {
            ...this.selectAllFlags[ins.description],
            selectAllPredefinedAttributes: true,
          };
        }
      })
    );
    this.insuredObjectsList?.forEach((obj) => {
      // For individual
      if (obj.allowedParties.length === this.allowedPartiesList.length) {
        this.selectAllFlags[obj.type.value] = {
          ...this.selectAllFlags[obj.type.value],
          selectAllAllowedParties: true,
        };
      }
    });
  }

  private _getDetails() {
    if (this.insuredObjectsList)
      for (let i = 0; i < this.insuredObjectsList?.length; i++) {
        const isCurrentVersion =
          this.insuredObjectsList[i].isCurrentVersion ?? true;
        const staVal =
          this._productContextService.isProductDisabled() || !isCurrentVersion;
        if (!isCurrentVersion) {
          this.disableClrSelection = true;
        }
        this.objectFormArray.push(
          this._insuredObjectsList(this.insuredObjectsList[i])
        );
        const objectId =
          this.objectFormArray.controls[i]?.get('objectId')?.value;
        const pDetails: any[] = [];
        const preDefineAttr = this.typeSelectionForm
          ?.get('objectType')
          ?.value.find((val: any) => val.msgId === objectId).predefinedAttr;
        this.insuredObjectsList[i].lobSpecificAttributes.forEach((attr) => {
          const pValue = {
            id: attr.attrName,
            description: attr.description,
            category: preDefineAttr.find(
              (att: any) => att.description === attr.attrName
            )?.category,
          };
          pDetails.push(pValue);

          this.requiredAttributesList[objectId] = [
            ...(this.requiredAttributesList[objectId] ?? []),
            {
              label: attr.description,
              value: attr.description,
              checked: attr.required,
            },
          ];

          this.noDuplicatesList[objectId] = [
            ...(this.noDuplicatesList[objectId] ?? []),
            {
              label: attr.description,
              value: attr.description,
              checked: attr.doNotAllowDuplicate,
            },
          ];
        });
        const preDefinedAttributeControl = this._fb.control(
          {
            value: pDetails,
            disabled: staVal,
          },
          [this.predefinedAttrDuplicateValidator(i)]
        );
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'predefinedAttribute',
          preDefinedAttributeControl
        );
        const predefinedTypeChipControl = this._fb.control({
          value: pDetails,
          disabled: staVal,
        });
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'predefinedTypeChipControl',
          predefinedTypeChipControl
        );

        const requiredAttribute = this._fb.control(
          {
            value: this.requiredAttributesList[objectId],
            disabled: staVal,
          },
          []
        );
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'requiredAttribute',
          requiredAttribute
        );

        const doNotAllowDuplicateAttribute = this._fb.control(
          {
            value: this.noDuplicatesList[objectId],
            disabled: staVal,
          },
          []
        );
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'doNotAllowDuplicateAttribute',
          doNotAllowDuplicateAttribute
        );

        const allowedPartiesData = this._getAllowedParties(
          this.insuredObjectsList[i]
        );
        const allowedParties = this._fb.group({
          insured: this._fb.control({ value: '', disabled: staVal }, []),
          insuredChipControl: this._fb.control(
            { value: '', disabled: staVal },
            []
          ),
          minAge: this._fb.control({ value: '', disabled: staVal }, []),
          maxAge: this._fb.control({ value: '', disabled: staVal }, []),
        });
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'allowedParties',
          allowedParties
        );
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('insured')
          ?.patchValue(allowedPartiesData);
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('insuredChipControl')
          ?.patchValue(allowedPartiesData);
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('minAge')
          ?.patchValue(
            this.insuredObjectsList[i]?.allowedParties?.find(
              (x) => x.partyMinAge
            )?.partyMinAge
          );
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('maxAge')
          ?.patchValue(
            this.insuredObjectsList[i]?.allowedParties?.find(
              (x) => x.partyMaxAge
            )?.partyMaxAge
          );

        const customAttributes = this._fb.group({
          attributes: this._fb.array([]),
        });
        (this.objectFormArray.controls[i] as FormGroup)?.addControl(
          'customAttributesForm',
          customAttributes
        );

        for (
          let j = 0;
          j < this.insuredObjectsList[i].customAttributes?.length;
          j++
        ) {
          const attributes = this.insuredObjectsList[i].customAttributes[j];
          const isCurrentVersion =
            this.insuredObjectsList[i].customAttributes[j].isCurrentVersion ??
            true;
          const disableEditFlag =
            this._productContextService.isProductDisabled() ||
            !isCurrentVersion;
          this.addAttribute(i, disableEditFlag);
          const controls = this.getAttributesFormArray(i).controls[j];
          const required = controls?.get('required');
          const allowDuplication = controls?.get('allowDuplication');
          const name = controls?.get('name');
          const dataType = controls?.get('dataType');
          const defaultValue = controls?.get('defaultValue');
          required?.patchValue(attributes?.required);
          allowDuplication?.patchValue(attributes?.doNotAllowDuplicate);
          name?.patchValue(attributes?.attrName);
          dataType?.patchValue(attributes?.type);
          defaultValue?.patchValue(attributes?.defaultValue);
          if (disableEditFlag) {
            required?.disable();
            allowDuplication?.disable();
            name?.disable();
            dataType?.disable();
            defaultValue?.disable();
          }
          if (attributes?.type === 'DROPDOWN') {
            const attributesFormArray = this.getAttributesFormArray(i);

            if (attributesFormArray && attributesFormArray.controls[j]) {
              const attributeFormGroup = attributesFormArray.controls[
                j
              ] as FormGroup;
              const answersFormArray = attributeFormGroup.get(
                'answers'
              ) as FormArray;
              answersFormArray.clear();

              if (attributes.answers && Array.isArray(attributes.answers)) {
                attributes.answers.forEach((answer) => {
                  const answerFormGroup = this._fb.group({
                    answerValue: [
                      {
                        value: answer.answerValue,
                        disabled: disableEditFlag || this.disableEdit,
                      },
                    ],
                    answerDescription: [
                      {
                        value: answer.answerDescription,
                        disabled: disableEditFlag || this.disableEdit,
                      },
                    ],
                  });

                  answersFormArray.push(answerFormGroup);
                });
              }
            }
          }

          if (attributes?.type === 'FILE') {
            this.getAttributesFormArray(i)
              .controls[j].get('maxOccurence')
              ?.patchValue(attributes?.maxOccurence);
            const selectedFileTypes = this.stringToList(
              attributes?.validationExpression
            );
            this.getAttributesFormArray(i)
              .controls[j].get('fileTypes')
              ?.patchValue(selectedFileTypes);
          } else {
            this.getAttributesFormArray(i)
              .controls[j].get('maxOccurence')
              ?.disable();
            this.getAttributesFormArray(i)
              .controls[j].get('fileTypes')
              ?.disable();
          }
        }
      }
  }

  private _insuredObjectsList(insuredObjectDetails: InsuredObject) {
    const staVal =
      this._productContextService.isProductDisabled() ||
      !insuredObjectDetails.isCurrentVersion;
    return this._fb.group({
      objectId: this._fb.control(
        {
          value: insuredObjectDetails.type.value,
          disabled: staVal,
        },
        []
      ),
      isGroup: this._fb.control({
        value: insuredObjectDetails?.isGroup === true ? true : false,
        disabled: staVal,
      }),
      minQuantity: this._fb.control({
        value:
          insuredObjectDetails.minQuantity === 0
            ? ''
            : insuredObjectDetails.minQuantity,
        disabled: staVal,
      }),
      maxQuantity: this._fb.control({
        value:
          insuredObjectDetails.maxQuantity === 0
            ? ''
            : insuredObjectDetails.maxQuantity,
        disabled: staVal,
      }),
      insured: insuredObjectDetails.allowedParties.map((party) => {
        return {
          code: party.partyType.value,
          description: this.allowedPartiesList.find(
            (allo) => allo.code === party.partyType.value
          )?.description,
        };
      }),
    });
  }

  private _getAllowedParties(insuredObjectDetails: InsuredObject) {
    const pDetails: any[] = [];
    insuredObjectDetails.allowedParties.map((party) => {
      const pValue = {
        code: party.partyType.value,
        description: this.allowedPartiesList.find(
          (allo) => allo.code === party.partyType.value
        )?.description,
      };
      pDetails.push(pValue);
    });
    return pDetails;
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({
      stepCount: 1,
      isRoute: true,
      routeOrFunction: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
    });
  }

  private _toggleInsuredGroups(
    value: MasterData,
    operation: string,
    isSelectAll?: boolean
  ): void {
    if (value) {
      if (!isSelectAll) {
        const objectExists = this.objectFormArray?.value?.findIndex(
          (formValueObj: { [key: string]: unknown }) =>
            formValueObj['objectId'] === value.description
        );
        if (this.disableClrSelection && operation === 'add') {
          this.objectFormArray.push(
            this._fb.group(
              this._initInsuredObjectGroup(value, this.objectFormArray.length)
            )
          );
        } else {
          if (operation === 'add' && objectExists <= -1) {
            this.objectFormArray.push(
              this._fb.group(
                this._initInsuredObjectGroup(value, this.objectFormArray.length)
              )
            );
          } else {
            objectExists >= -1
              ? this.objectFormArray.removeAt(objectExists)
              : null;
          }
        }
      } else {
        if (operation === 'add') {
          this.selectedObjectTypes.forEach((obj) => {
            if (obj.isCurrentVersion) {
              const objectExists = this.objectFormArray?.value?.findIndex(
                (formValueObj: { [key: string]: any }) =>
                  formValueObj['objectId']?.toLocaleLowerCase() ===
                  obj.description?.toLocaleLowerCase()
              );
              if (objectExists <= -1) {
                this.objectFormArray.push(
                  this._fb.group(
                    this._initInsuredObjectGroup(
                      obj,
                      this.objectFormArray.length
                    )
                  )
                );
              }
            }
          });
        } else {
          const itemsToRemove: number[] = [];
          this.objectFormArray.value.map(
            (item: { [x: string]: undefined }, index: number) => {
              if (item['objectId'] !== undefined) {
                itemsToRemove.push(index);
                // this.objectFormArray.removeAt(index);
              }
            }
          );
          itemsToRemove.sort((a, b) => b - a);
          itemsToRemove.map((i) => this.objectFormArray.removeAt(i));
        }
      }
    }
  }

  private _prepareRequestObject(indexNumber: number): InsuredObject {
    const insuredObject: InsuredObject = {
      insuredObjectId: '',
      type: { value: '', category: '', key: '' },
      policyHolderType: { value: '', category: '', key: '' },
      isGroup: false,
      minQuantity: 1,
      maxQuantity: 1,
      allowedParties: [],
      customAttributes: [],
      lobSpecificAttributes: [],
      isCurrentVersion: true,
    };
    const control = this.objectFormArray.controls[indexNumber];
    if (this.insuredList != undefined) {
      insuredObject.type.value =
        this.insuredList.find(
          (ins) => ins.description == control.get('objectId')?.value
        )?.msgId || '';
    }
    const currentInsuredObject = this.insuredObjectsList?.find(
      (ins) => ins.type.value === insuredObject.type.value
    );
    insuredObject.insuredObjectId =
      currentInsuredObject?.insuredObjectId || null;
    insuredObject.isCurrentVersion =
      currentInsuredObject?.isCurrentVersion ?? true;
    insuredObject.type.category = 'INSUREDOBJECT';
    insuredObject.policyHolderType.key = '';
    insuredObject.policyHolderType.value =
      this.policyHolderTypeOptions.find(
        (poc) => poc.description == this.policyHolderType?.value
      )?.code || this.policyHolderType?.value;
    insuredObject.policyHolderType.category = Category.POLICYHOLDERTYPE;
    insuredObject.isGroup = control.get('isGroup')?.value;

    insuredObject.minQuantity =
      !control.get('minQuantity')?.value ||
      control.get('minQuantity')?.value === ''
        ? 0
        : control.get('minQuantity')?.value;
    insuredObject.maxQuantity =
      !control.get('maxQuantity')?.value ||
      control.get('maxQuantity')?.value === ''
        ? 0
        : control.get('maxQuantity')?.value;
    if (
      control.get('predefinedAttribute')?.value != '' &&
      control.get('predefinedAttribute')?.value != null &&
      control.get('predefinedAttribute')?.value != undefined
    ) {
      insuredObject.lobSpecificAttributes = control
        .get('predefinedAttribute')
        ?.value?.map((value: any, index: number) => {
          const attr = control.get('predefinedAttribute')?.value[index];
          const isCurrentVersion =
            this.insuredObjectsList?.[indexNumber]?.lobSpecificAttributes?.[
              index
            ]?.isCurrentVersion ?? true;
          return {
            attrName: attr?.description,
            section: '',
            description: attr?.description,
            type: '',
            required: (<CbCheckboxConfig[]>(
              control.get('requiredAttribute')?.value
            ))?.find((item) => item.value === attr.description)?.checked,
            validationExpression: '',
            doNotAllowDuplicate: (<CbCheckboxConfig[]>(
              control.get('doNotAllowDuplicateAttribute')?.value
            ))?.find((item) => item.value === attr.description)?.checked,
            options: [],
            isCurrentVersion,
            refDataMappingCategory: attr?.category,
            defaultValue: attr?.defaultValue,
          };
        });
    } else {
      insuredObject.lobSpecificAttributes = [];
    }

    const previousVersionCustomAttributes: CustomAttribute[] =
      this.insuredObjectsList?.[indexNumber]?.customAttributes.filter(
        (item) => !item.isCurrentVersion
      ) || [];
    if (!isEmpty(previousVersionCustomAttributes)) {
      insuredObject.customAttributes.push(...previousVersionCustomAttributes);
    }

    const customAttributes = control
      .get('customAttributesForm')
      ?.get('attributes')
      ?.value?.map((value: any, index: number) => {
        const custAttr = control.get('customAttributesForm')?.get('attributes')
          ?.value[index];
        if (custAttr.name) {
          return {
            attrName: custAttr.name,
            description: custAttr.name,
            section: '',
            type: custAttr.dataType,
            required: custAttr.required,
            validationExpression: this.listToString(custAttr.fileTypes),
            maxOccurence:
              typeof custAttr.maxOccurence === 'number'
                ? custAttr.maxOccurence
                : 1,

            options: [],
            insuredTypes: [],
            doNotAllowDuplicate: custAttr.allowDuplication,
            answers: custAttr?.answers,
            isCurrentVersion: true,
            defaultValue: !(
              custAttr.dataType === 'DROPDOWN' || custAttr.dataType === 'FILE'
            )
              ? custAttr.defaultValue
              : '',
          };
        }
        return null;
      })
      .filter((attr: any) => attr !== null);
    insuredObject.customAttributes.push(...customAttributes);

    for (
      let index = 0;
      index < control.get('allowedParties')?.get('insured')?.value?.length;
      index++
    ) {
      insuredObject.allowedParties.push({
        partyId: '',
        partyType: {
          key: '',
          value: control.get('allowedParties')?.get('insured')?.value[index]
            ?.code,
          category: Category.ALLOPART,
        },
        partySubtype: {
          key: '',
          value: '',
          category: Category.ALLOPART,
        },
        partyMinAge:
          control.get('allowedParties')?.get('minAge')?.value == ''
            ? 0
            : control.get('allowedParties')?.get('minAge')?.value ?? 0,
        partyMaxAge:
          control.get('allowedParties')?.get('maxAge')?.value == ''
            ? 0
            : control.get('allowedParties')?.get('maxAge')?.value ?? 0,
        customAttributes: [],
      });
    }

    return insuredObject;
  }

  private _initInsuredObjectGroup(
    value?: MasterData,
    index?: number
  ): InsuredObjectForm {
    const staVal = this._productContextService.isProductDisabled();
    return {
      objectId: this._fb.control(
        { value: value?.code ?? '', disabled: staVal ? true : false },
        []
      ),
      isGroup: this._fb.control({
        value: false,
        disabled: staVal ? true : false,
      }),
      minQuantity: this._fb.control({
        value: '',
        disabled: staVal ? true : false,
      }),
      maxQuantity: this._fb.control({
        value: '',
        disabled: staVal ? true : false,
      }),
      predefinedAttribute: this._fb.control(
        { value: '', disabled: staVal ? true : false },
        [this.predefinedAttrDuplicateValidator(index)]
      ),
      predefinedTypeChipControl: this._fb.control(
        { value: '', disabled: staVal ? true : false },
        []
      ),
      requiredAttribute: this._fb.control({ value: false, disabled: staVal }),
      doNotAllowDuplicateAttribute: this._fb.control({
        value: false,
        disabled: staVal,
      }),
      allowedParties: this._fb.group({
        insured: this._fb.control(
          { value: '', disabled: staVal ? true : false },
          []
        ),
        insuredChipControl: this._fb.control(
          { value: '', disabled: staVal ? true : false },
          []
        ),
        minAge: this._fb.control({
          value: '',
          disabled: staVal ? true : false,
        }),
        maxAge: this._fb.control({
          value: '',
          disabled: staVal ? true : false,
        }),
      }),

      customAttributesForm: this._fb.group({
        attributes: this._fb.array([]),
      }),
    };
  }

  private _initCustomAttribute(index: number): FormGroup {
    const staVal = this._productContextService.isProductDisabled();

    let maxLength = 100;
    const formArray = this.getAttributesFormArray(index);
    const answersArray = this._fb.array<FormGroup>([]);

    if (formArray && formArray.length > index) {
      const dataTypeControl = formArray.at(index).get('dataType');
      const dataTypeValue = dataTypeControl?.value;
      maxLength = dataTypeValue === 'STRING' ? 500 : 100;
    }

    return this._fb.group({
      required: this._fb.control(
        { value: false, disabled: staVal ? true : false },
        []
      ),
      allowDuplication: this._fb.control(
        { value: false, disabled: staVal ? true : false },
        []
      ),
      name: this._fb.control({ value: '', disabled: staVal ? true : false }, [
        Validators.required,
        Validators.maxLength(maxLength),
        this.customAttrDuplicateValidator(index),
      ]),
      dataType: this._fb.control(
        { value: '', disabled: staVal ? true : false },
        [Validators.required]
      ),
      maxOccurence: this._fb.control(
        { value: '', disabled: staVal ? true : false },
        [Validators.min(1), Validators.max(99)]
      ),
      fileTypes: this._fb.control({ value: [], disabled: false }, []),
      answers: answersArray,
      defaultValue: this._fb.control({
        value: '',
        disabled: staVal ? true : false,
      }),
    });
  }

  stringToList(str: string): MasterData[] {
    const listItems: string[] = str.replace(/\./g, '').split(', ');
    const list: MasterData[] = listItems
      ?.map((item) =>
        this.fileTypeList.find(
          (type) => type?.description === item.toLowerCase()
        )
      )
      .filter((item): item is MasterData => !!item);

    return list;
  }

  private _initAnswer(): FormGroup {
    return this._fb.group({
      answerValue: this._fb.control('', Validators.required),
      answerDescription: this._fb.control('', Validators.required),
    });
  }

  removeAnswer(attribute: FormGroup, indexK: number): void {
    this.openDeleteAttributeModal = true;
    this.deleteSelectedAttribute = { attribute, indexK };
  }

  addAnswer(attribute: FormGroup): void {
    const answersArray = attribute.get('answers') as FormArray;
    answersArray.push(this._initAnswer());
  }

  getAnswersControls(attributeIndex: number, formIndex: number): FormArray {
    const attributeGroup = this.getAttributesFormArray(attributeIndex);
    const formGroup = attributeGroup.at(formIndex);
    return formGroup.get('answers') as FormArray;
  }

  getAttribute(index: number, formIndex: number): FormGroup {
    const attributeGroup = this.getAttributesFormArray(index);
    const formGroup = attributeGroup.at(formIndex);
    return formGroup as FormGroup;
  }

  onDataTypeChange(a: AbstractControl) {
    if (a.get('dataType')?.value === 'FILE') {
      a.get('maxOccuence')?.enable();
      a.get('fileTypes')?.enable();
    } else {
      a.get('maxOccuence')?.disable();
      a.get('fileTypes')?.disable();
    }

    if (a.get('dataType')?.value === 'STRING') {
      const nameControl = a.get('name');
      nameControl?.addValidators([
        Validators.required,
        Validators.maxLength(500),
      ]);
      nameControl?.updateValueAndValidity();
    } else {
      const nameControl = a.get('name');
      nameControl?.addValidators([
        Validators.required,
        Validators.maxLength(100),
      ]);
      nameControl?.updateValueAndValidity();
    }
  }

  listToString(list: MasterData[]) {
    const str = list
      ?.map((item: MasterData) => `.${item.description}`)
      .join(', ');
    return str;
  }
  submit(): void {
    this._sharedService.nextButtonClicked.next({
      stepCount: this._productsService.getCoverageFactorsStepCount(),
    });
  }

  _validateMinCount(insuredObject: string, i: number): string | null {
    if (this.objectFormArray != null && this.objectFormArray != undefined) {
      if (
        this.objectFormArray?.controls[i]?.get('minQuantity')?.invalid &&
        (this.objectFormArray?.controls[i]?.get('minQuantity')?.dirty ||
          this.objectFormArray?.controls[i]?.get('minQuantity')?.touched)
      ) {
        if (
          this.objectFormArray?.controls[i]?.get('minQuantity')?.errors?.[
            'required'
          ]
        )
          return 'Required field';
        // if (
        //   this.objectFormArray.controls[i].get('minQuantity')?.invalid &&
        //   this.objectFormArray.controls[i].get('minQuantity')?.errors?.['max']
        // )
        //   return 'Max length is 2';
        if (this.objectFormArray.controls[i].get('minQuantity')?.value < 0) {
          return 'Minimum count should not be less than 0';
        }
      }
    }
    return null;
  }

  _validateMaxCount(insuredObject: string, i: number): string | null {
    if (this.objectFormArray && this.objectFormArray.controls[i]) {
      const maxQuantity =
        this.objectFormArray.controls[i].get('maxQuantity')?.value;
      const minQuantity =
        this.objectFormArray.controls[i].get('minQuantity')?.value;
      const maxQuantityControl =
        this.objectFormArray.controls[i].get('maxQuantity');

      if (
        this.objectFormArray.controls[i].get('maxQuantity')?.dirty ||
        this.objectFormArray.controls[i].get('maxQuantity')?.touched
      ) {
        if (maxQuantityControl?.errors?.['required']) {
          return 'Maximum count required';
        }
      }
      if (
        this.objectFormArray.controls[i].get('minQuantity')?.dirty ||
        this.objectFormArray.controls[i].get('minQuantity')?.touched
      ) {
        if (maxQuantity != null && minQuantity != null) {
          if (minQuantity >= maxQuantity) {
            maxQuantityControl?.setErrors({
              ...maxQuantityControl.errors,
              maxLessThanMin:
                'Maximum count should be greater than the minimum count.',
            });
            return 'Maximum count should be greater than the minimum count.';
          } else {
            if (maxQuantityControl?.errors) {
              const { maxLessThanMin, ...otherErrors } =
                maxQuantityControl.errors;
              if (Object.keys(otherErrors).length === 0) {
                maxQuantityControl.setErrors(null);
              } else {
                maxQuantityControl.setErrors(otherErrors);
              }
            }
          }
        }
      }
    }
    return null;
  }

  _validatePredefinedAttribute(nameControl: any) {
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

  _validateCustAttribute(i: number, j: number): string | null {
    if (this.objectFormArray != null && this.objectFormArray != undefined) {
      const attributesForm: FormArray | null = this.objectFormArray?.controls[
        i
      ]?.get('customAttributesForm.attributes') as FormArray;
      const nameControl: FormControl = attributesForm.controls[j].get(
        'name'
      ) as FormControl;

      const dataTypeControl: FormControl = attributesForm.controls[j].get(
        'dataType'
      ) as FormControl;

      if (nameControl.invalid && (nameControl.dirty || nameControl.touched)) {
        if (nameControl?.errors?.['required']) return 'Required field';
        if (nameControl?.invalid && nameControl?.errors?.['maxlength'])
          return dataTypeControl.value === 'STRING'
            ? 'Data cannot be more than 500 characters'
            : 'Data cannot be more than 100 characters';
        if (nameControl.errors?.['attrDuplicate']) {
          return this.labels?.duplicateCustAttrErrorMessage;
        }
      }
      if (nameControl.errors?.['attrDuplicate']) {
        return this.labels?.duplicateCustAttrErrorMessage;
      }
    }
    return null;
  }

  setPartyType() {
    if (this.insuredObjectsList) {
      for (let i = 0; i < this.objectFormArray.value?.length; i++) {
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('minAge')
          ?.enable();
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('maxAge')
          ?.enable();
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('insured')
          ?.reset();
        (this.objectFormArray.controls[i] as FormGroup)
          ?.get('allowedParties')
          ?.get('insuredChipControl')
          ?.reset();
      }
    }
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  enableDeleteConfirmation(indexI: number, indexJ: number) {
    this.openDeleteModal = true;
    this.deleteSelectedItem = { indexI, indexJ };
  }

  deleteConfirmation() {
    const { indexI, indexJ } = this.deleteSelectedItem;
    this.removeAttribute(indexI, indexJ);
  }

  handleDeleteAttributeModal() {
    this.openDeleteAttributeModal = false;
  }

  deleteAttributeConfirmation() {
    const { attribute, indexK } = this.deleteSelectedAttribute;
    const answersArray = attribute.get('answers') as FormArray;
    if (answersArray && answersArray.length > indexK) {
      answersArray.removeAt(indexK);
    }
    this.openDeleteAttributeModal = false;
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

  duplicatesCheckPredefinedAttr(inputValue: string, index: number): boolean {
    const formGroup = this.objectFormArray?.controls[index];
    const attributesForm: FormArray | null = formGroup?.get(
      'customAttributesForm.attributes'
    ) as FormArray;
    const attributes =
      attributesForm?.controls?.map((control) =>
        control.get('name')?.value.toLowerCase().trim()
      ) || [];

    if (
      this.hasCustAttrDuplicates([inputValue.toLocaleLowerCase()], attributes)
    ) {
      return true;
    }
    return false;
  }

  predefinedAttrDuplicateValidator(index: number = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Check if the control has a value and the form is fully initialized
      if (!control || control.value === null || control.value === '') {
        // Skip validation if the control is empty or not initialized
        return null;
      }
      const invalidItems = control.value.filter(
        (item: { description: string }) =>
          this.duplicatesCheckPredefinedAttr(item.description, index)
      );
      if (invalidItems.length > 0) {
        return { attrDuplicate: true };
      } else {
        return null;
      }
    };
  }

  customAttrDuplicateValidator(index: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Check if the control has a value and the form is fully initialized
      if (!control || control.value === null || control.value === '') {
        // Skip validation if the control is empty or not initialized
        return null;
      }

      // Perform the duplicate check only if the control has a valid value
      if (this.duplicatesCheckCustomAttr(control.value, index)) {
        return { attrDuplicate: true };
      } else {
        return null;
      }
    };
  }

  duplicatesCheckCustomAttr(inputValue: string, index: number): boolean {
    const formGroup = this.objectFormArray?.controls[index];
    const attributesForm: FormArray | null = formGroup?.get(
      'customAttributesForm.attributes'
    ) as FormArray;
    const attributes =
      attributesForm?.controls?.map((control) =>
        control.get('name')?.value.toLowerCase().trim()
      ) || [];
    let predefinedAttrs: string[] = [];
    const predefinedAttributeValues = formGroup?.get(
      'predefinedAttribute'
    )?.value;
    if (
      predefinedAttributeValues != null &&
      predefinedAttributeValues != undefined &&
      predefinedAttributeValues != ''
    ) {
      predefinedAttributeValues?.map((val: any) => {
        predefinedAttrs.push(val.description?.toLowerCase());
      });
    }

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

  //Check custom attributes with predefined attributes
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
}
