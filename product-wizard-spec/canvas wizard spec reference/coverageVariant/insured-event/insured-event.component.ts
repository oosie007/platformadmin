import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { ChipsModule } from 'primeng/chips';
import {
  MultiSelectChangeEvent,
  MultiSelectModule,
  MultiSelectSelectAllChangeEvent,
} from 'primeng/multiselect';

import { Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import { UtilityService } from '../../../../services/utility.service';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { SharedService } from '../../../services/shared.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant } from '../../../types/coverage';
import {
  InsuredEvent,
  InsuredEventPostRequest,
  PredefinedAttr,
  Value,
} from '../../../types/insured-object';
import { MasterData, ProductRequest } from '../../../types/product';
import { ProductContext } from '../../../types/product-context';
import { Category } from '../../../types/ref-data';
import {
  CustomeAttributes,
  InsuredFormTypes,
  InsuredType,
} from '../insured-type-selection/model/insured-type.model';
import {
  InsuredEventLabels,
  InsuredEventLabelsList,
} from './model/insured-event.model';

@UntilDestroy()
@Component({
  selector: 'canvas-insured-event',
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
  templateUrl: './insured-event.component.html',
  styleUrls: ['./insured-event.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InsuredEventComponent implements OnInit {
  cbIconSize = CbIconSize;
  coverageVariants!: CoverageVariant[];
  coverageVariantId: string;
  productId: string;
  productVersionId: string;
  selectAllInsured = false;
  selectedEventTypes: Value[] = [];
  modalOpen = false;
  open: boolean;
  insuredTypes: InsuredType[] = [];
  customAttributes: CustomeAttributes[] = [];
  insuredFormTypes = InsuredFormTypes;
  insuredEventId!: string;
  preDefinedAttributesList: PredefinedAttr[];
  allowedPartiesList: MasterData[] = [];
  productClass: string;
  dataTypes: MasterData[] = [];
  predefinedAttr: PredefinedAttr[] | undefined;
  insuredEventsList: InsuredEvent[] | undefined;
  productContext: ProductContext;
  country: string;
  policyHolderOptions: MasterData[] = [];
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

  openDeleteModal: boolean;
  deleteSelectedItem: any;
  openDeleteAttributeModal = false;
  deleteSelectedAttribute: any;

  labels!: InsuredEventLabels;
  eventLabels!: InsuredEventLabelsList;

  insuredEventForm: FormGroup;
  insuredEventRefData: MasterData[] = [];
  attributeDataType: MasterData[] = [];
  supportedInsuredType: any[] = [];
  productDetails: ProductRequest;

  get eventType(): FormControl {
    return this.insuredEventForm?.get('eventType') as FormControl;
  }

  get eventFormArray(): FormArray {
    return this.insuredEventForm.get('eventsForm') as FormArray;
  }

  get policyHolderType(): FormControl {
    return this.insuredEventForm?.get('policyHolderType') as FormControl;
  }

  get eventTypeChipControl(): FormControl {
    return this.insuredEventForm?.get('eventTypeChipControl') as FormControl;
  }

  public set changesForCurrVersion(v: boolean) {
    this.currVersChange = v;
  }

  constructor(
    private _layoutService: LayoutService,
    private _sharedService: SharedService,
    private _formBuilder: FormBuilder,
    private _productService: ProductsService,
    private _productContextService: ProductContextService,
    private _appContextService: AppContextService,
    private _utilityService: UtilityService,
    private _variantLevelService: VariantLevelService,
    private _commands: StudioCommands,
    private _router: Router
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this.coverageVariantId = localStorage?.getItem('coverageVariantId') || '';
    this.productClass = localStorage?.getItem('ProductClass') || '';

    this.labels = <InsuredEventLabels>(
      this._appContextService.get('pages.product.insured-event.labels')
    );

    this.eventLabels = <InsuredEventLabelsList>(
      this._appContextService.get('pages.insuredEvent.labels')
    );
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const statusVal = this._productContextService.isProductDisabled();
    this.insuredEventForm = this._formBuilder.group({
      policyHolderType: new FormControl({
        value: '',
        disabled: statusVal ? true : false,
      }),
      eventType: new FormControl({
        value: '',
        disabled: statusVal ? true : false,
      }),
      eventTypeChipControl: new FormControl({
        value: [],
        disabled: statusVal ? true : false,
      }),
      eventsForm: this._formBuilder.array([]),
    });

    if (statusVal) {
      this.insuredEventForm.disable();
      this.disableEdit = true;
    }
    this._productContext();
    this.getReferenceData();
  }

  getReferenceData(): void {
    const dataLoaded = {
      insuredEventRefData: false,
      attributeDataType: false,
      policyHolderOptions: false,
      coverageVariantDetails: false,
      fileTypeList: false,
    };

    this._utilityService
      .fetchAdminDomainData(['INSUREDEVENT'])
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.insuredEventRefData = data || [];
        dataLoaded.insuredEventRefData = true;
        this.checkAndPrefillForm(dataLoaded);
      });

    this._productService
      .getDataTypes()
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.attributeDataType = data || [];
        dataLoaded.attributeDataType = true;
        this.checkAndPrefillForm(dataLoaded);
      });

    this._productService
      .getReferenceData(Category.POLICYHOLDERTYPE)
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.policyHolderOptions = data || [];
        dataLoaded.policyHolderOptions = true;
        this.checkAndPrefillForm(dataLoaded);
      });

    this._productService
      .getReferenceData(Category.FILETYPE)
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        this.fileTypeList = data || [];
        dataLoaded.fileTypeList = true;
        this.checkAndPrefillForm(dataLoaded);
      });

    this._variantLevelService
      .getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.insuredEventsList = response.insuredEvents;
          dataLoaded.coverageVariantDetails = true;
          this.checkAndPrefillForm(dataLoaded);
        },
        error: (err) => {
          this._layoutService.showMessage({
            severity: 'error',
            message: 'error occured. please try again after sometime.',
            duration: 5000,
          });
        },
      });
  }

  private checkAndPrefillForm(dataLoaded: any): void {
    const allDataLoaded = Object.values(dataLoaded).every(
      (loaded) => loaded === true
    );

    if (
      allDataLoaded &&
      this.insuredEventsList &&
      this.insuredEventsList.length > 0
    ) {
      setTimeout(() => {
        this.prefillForm();
      }, 100);
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

  private prefillForm(): void {
    if (!this.insuredEventsList || this.insuredEventsList.length === 0) {
      return;
    }

    const firstEvent = this.insuredEventsList[0];
    if (
      firstEvent.policyHolderType?.value &&
      this.policyHolderOptions.length > 0
    ) {
      const policyHolderOption = this.policyHolderOptions.find(
        (option) => option.code === firstEvent.policyHolderType.value
      );
      if (policyHolderOption) {
        this.policyHolderType.patchValue(policyHolderOption.description);
      }
    }

    if (this.insuredEventRefData.length > 0) {
      const eventTypes = this.insuredEventsList.map((event) => {
        const eventRefData = this.insuredEventRefData.find(
          (ref) => ref.code === event.type.value
        );
        return (
          eventRefData || {
            code: event.type.value,
            description: event.type.value,
            msgId: '',
            category: 'INSUREDEVENT',
          }
        );
      });

      this.eventType.patchValue(eventTypes);
      this.selectedEventTypes = eventTypes as Value[];
      this.eventTypeChipControl.patchValue([...eventTypes]);

      this.updateEventFormArray(eventTypes);

      this.insuredEventsList.forEach((event, index) => {
        const eventFormGroup = this.getEventFormGroup(index);
        if (eventFormGroup) {
          eventFormGroup.patchValue({
            insuredEventId: event.insuredEventId || '',
            minQuantity: event.minQuantity || 0,
            maxQuantity: event.maxQuantity || 0,
          });

          if (event.customAttributes && event.customAttributes.length > 0) {
            this.populateCustomAttributes(index, event.customAttributes);
          }
        }
      });
    }
  }

  private populateCustomAttributes(
    eventIndex: number,
    customAttributes: any[]
  ): void {
    const attributesArray = this.getAttributesFormArray(eventIndex);

    while (attributesArray.length > 0) {
      attributesArray.removeAt(0);
    }

    customAttributes.forEach((attr, attrIndex) => {
      this.addAttribute(
        eventIndex,
        this._productContextService.isProductDisabled()
      );

      const attributeFormGroup = attributesArray.at(attrIndex) as FormGroup;
      if (attributeFormGroup) {
        let fileTypes: MasterData[] = [];
        if (attr.validationExpression) {
          const fileExtensions = attr.validationExpression.split(', ');
          fileTypes = fileExtensions.map((ext: string) => ({
            code: ext.replace('.', ''),
            description: ext,
          }));
        }

        attributeFormGroup.patchValue({
          required: attr.required || false,
          allowDuplication: attr.doNotAllowDuplicate || false,
          name: attr.attrName || attr.description || '',
          dataType: attr.type || '',
          maxOccurence: attr.maxOccurence || 1,
          fileTypes: fileTypes,
          defaultValue: attr.defaultValue || '',
        });

        if (attr.answers && attr.answers.length > 0) {
          const answersArray = attributeFormGroup.get('answers') as FormArray;
          attr.answers.forEach((answer: any) => {
            const answerGroup = this._formBuilder.group({
              answerValue: [answer.answerValue || '', Validators.required],
              answerDescription: [
                answer.answerDescription || '',
                Validators.required,
              ],
            });
            answersArray.push(answerGroup);
          });
        }
      }
    });
  }

  onMultiSelectChange(event: MultiSelectChangeEvent, type: string) {
    if (type === 'eventType') {
      event.value.length === this.insuredEventRefData.length
        ? (this.selectAllInsured = true)
        : (this.selectAllInsured = false);

      if (this.selectAllInsured) {
        this.insuredEventForm
          ?.get('eventTypeChipControl')
          ?.patchValue(this.selectedEventTypes);
      }
      this.insuredEventForm
        ?.get('eventTypeChipControl')
        ?.patchValue(this.selectedEventTypes);
      this.updateEventFormArray(event.value);
      this.eventTypeChipControl.patchValue([...event.value]);
    }
  }

  private createEventFormGroup(): FormGroup {
    const statusVal = this._productContextService.isProductDisabled();
    return this._formBuilder.group({
      insuredEventId: new FormControl({
        value: '',
        disabled: statusVal ? true : false,
      }),
      minQuantity: new FormControl({
        value: '',
        disabled: statusVal ? true : false,
      }),
      maxQuantity: new FormControl({
        value: '',
        disabled: statusVal ? true : false,
      }),
      customAttributesForm: this._formBuilder.group({
        attributes: this._formBuilder.array([]),
      }),
    });
  }

  updateEventFormArray(selectedEventTypes: any[]): void {
    const currentArrayLength = this.eventFormArray.length;
    const newArrayLength = selectedEventTypes.length;

    if (newArrayLength > currentArrayLength) {
      for (let i = currentArrayLength; i < newArrayLength; i++) {
        this.eventFormArray.push(this.createEventFormGroup());
        if (!this.disableDel[i]) {
          this.disableDel[i] = [];
        }
      }
    } else if (newArrayLength < currentArrayLength) {
      for (let i = currentArrayLength - 1; i >= newArrayLength; i--) {
        this.eventFormArray.removeAt(i);
        if (this.disableDel[i]) {
          delete this.disableDel[i];
        }
      }
    }

    this.selectedEventTypes = selectedEventTypes;
  }

  onMultiSelectSelectAllChange(
    event: MultiSelectSelectAllChangeEvent,
    type: string
  ) {
    if (type === 'eventType') {
      this.selectAllInsured = event.checked;
      if (event.checked) {
        this.updateEventFormArray(this.insuredEventRefData);
        this.eventType.patchValue(this.insuredEventRefData);
        this.eventTypeChipControl.patchValue([...this.insuredEventRefData]);
      } else {
        this.updateEventFormArray([]);
        this.eventType.patchValue([]);
        this.eventTypeChipControl.patchValue([]);
      }
    }
  }

  getEventFormGroup(index: number): FormGroup | null {
    if (index >= 0 && index < this.eventFormArray.length) {
      return this.eventFormArray.at(index) as FormGroup;
    }
    return null;
  }

  getAttributesFormArray(index: number): FormArray {
    const eventFormGroup = this.getEventFormGroup(index);
    if (eventFormGroup) {
      return eventFormGroup
        .get('customAttributesForm')
        ?.get('attributes') as FormArray;
    }
    return this._formBuilder.array([]);
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
    this.eventFormArray.markAsDirty();
  }

  onSelectAllFileTypes(
    e: MultiSelectSelectAllChangeEvent,
    a?: AbstractControl
  ) {
    e.checked
      ? a?.get('fileTypes')?.patchValue([...this.fileTypeList])
      : a?.get('fileTypes')?.patchValue([]);
  }

  saveAndExit(moveToNext?: boolean): void {
    this.changesForCurrVersion =
      this.currVersChange || this.eventFormArray.dirty;
    this.insuredEventForm?.markAllAsTouched();
    this.insuredEventForm?.updateValueAndValidity();
    if (this.insuredEventForm.invalid) {
      return;
    } else {
      const saveInsuredCommand = {
        commandName: 'HttpCommand',
        parameter: {
          url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/insuredevents?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
          method: 'POST',
        },
      };

      const toastMessageConfig = {
        success: {
          severity: 'success',
          message: this.eventLabels.insuredSuccessMessage,
          duration: 5000,
        },
        error: {
          severity: 'error',
          message: this.eventLabels.insuredErrorMessage,
          duration: 5000,
        },
        updateSuccess: {
          severity: 'success',
          message: this.eventLabels.insuredUpdateSuccess,
          duration: 5000,
        },
      };
      const insuredEventtList: InsuredEvent[] = [];
      for (let i = 0; i < this.eventFormArray.length; i++) {
        const insuredEvent = this._prepareRequestEvent(i);
        insuredEventtList.push(insuredEvent);
      }
      const payload: InsuredEventPostRequest = {
        insuredEvents: insuredEventtList,
      };

      if (
        this.insuredEventsList != undefined &&
        this.insuredEventsList != null &&
        this.insuredEventsList?.length > 0
      ) {
        const editInsuredCommand = {
          commandName: 'HttpCommand',
          parameter: {
            url: `/canvas/api/catalyst/products/${this.productId}/coveragevariants/${this.coverageVariantId}/insuredevents?versionId=${this.productVersionId}&requestId=${this.productContext.requestId}`,
            method: 'PATCH',
          },
        };
        this._commands
          .execute(editInsuredCommand, payload, {})
          .then((response) => {
            this._layoutService.showMessage(
              toastMessageConfig[
                `${response === false ? 'error' : 'updateSuccess'}`
              ]
            );
            if (moveToNext) {
              this._sharedService.nextButtonClicked.next({
                stepCount: this._productService.getCoverageFactorsStepCount(),
              });
            } else {
              this._router.navigate(['products']);
            }
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
                stepCount: this._productService.getCoverageFactorsStepCount(),
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
  private _prepareRequestEvent(indexNumber: number): InsuredEvent {
    const insuredEvent: InsuredEvent = {
      insuredEventId: '',
      type: { value: '', category: '', key: '' },
      policyHolderType: { value: '', category: '', key: '' },
      minQuantity: 1,
      maxQuantity: 1,
      customAttributes: [],
      isCurrentVersion: true,
    };

    const control = this.eventFormArray.controls[indexNumber];
    
    if (this.selectedEventTypes && this.selectedEventTypes[indexNumber]) {
      const selectedEvent = this.selectedEventTypes[indexNumber] as any;
      insuredEvent.type.value = selectedEvent.code || selectedEvent.msgId || '';
    }
    
    const existingInsuredEvent = this.insuredEventsList?.find(
      (ins) => ins.type.value === insuredEvent.type.value
    );
    
    if (existingInsuredEvent?.insuredEventId) {
      insuredEvent.insuredEventId = existingInsuredEvent.insuredEventId;
    }
    
    insuredEvent.type.category = 'INSUREDEVENT';
    insuredEvent.policyHolderType.key = '';
    insuredEvent.policyHolderType.value =
      this.policyHolderOptions.find(
        (poc) => poc.description == this.policyHolderType?.value
      )?.code || this.policyHolderType?.value;
    insuredEvent.policyHolderType.category = Category.POLICYHOLDERTYPE;
    
    insuredEvent.minQuantity =
      !control.get('minQuantity')?.value ||
      control.get('minQuantity')?.value === ''
        ? 0
        : control.get('minQuantity')?.value;
    insuredEvent.maxQuantity =
      !control.get('maxQuantity')?.value ||
      control.get('maxQuantity')?.value === ''
        ? 0
        : control.get('maxQuantity')?.value;

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
    insuredEvent.customAttributes.push(...customAttributes);

    return insuredEvent;
  }

  saveAndNext(): void {
    if (this._productContextService.isProductDisabled()) {
      this._sharedService.nextButtonClicked.next({
        stepCount: this._productService.getCoverageFactorsStepCount(),
      });
    } else {
      this.saveAndExit(true);
    }
  }

  submit(): void {
    this._sharedService.nextButtonClicked.next({
      stepCount: this._productService.getCoverageFactorsStepCount(),
    });
  }

  previous(): void {
    this._sharedService.previousButtonClicked.next({
      stepCount: 1,
      isRoute: true,
      routeOrFunction: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
    });
  }

  private _initCustomAttribute(index: number): FormGroup {
    const staVal = this._productContextService.isProductDisabled();

    let maxLength = 100;
    const formArray = this.getAttributesFormArray(index);
    const answersArray = this._formBuilder.array<FormGroup>([]);

    if (formArray && formArray.length > index) {
      const dataTypeControl = formArray.at(index).get('dataType');
      const dataTypeValue = dataTypeControl?.value;
      maxLength = dataTypeValue === 'STRING' ? 500 : 100;
    }

    return this._formBuilder.group({
      required: this._formBuilder.control(
        { value: false, disabled: staVal ? true : false },
        []
      ),
      allowDuplication: this._formBuilder.control(
        { value: false, disabled: staVal ? true : false },
        []
      ),
      name: this._formBuilder.control(
        { value: '', disabled: staVal ? true : false },
        [
          Validators.required,
          Validators.maxLength(maxLength),
          this.customAttrDuplicateValidator(index),
        ]
      ),
      dataType: this._formBuilder.control(
        { value: '', disabled: staVal ? true : false },
        [Validators.required]
      ),
      maxOccurence: this._formBuilder.control(
        { value: '', disabled: staVal ? true : false },
        [Validators.min(1), Validators.max(99)]
      ),
      fileTypes: this._formBuilder.control({ value: [], disabled: false }, []),
      answers: answersArray,
      defaultValue: this._formBuilder.control({
        value: '',
        disabled: staVal ? true : false,
      }),
    });
  }

  private _initAnswer(): FormGroup {
    return this._formBuilder.group({
      answerValue: this._formBuilder.control('', Validators.required),
      answerDescription: this._formBuilder.control('', Validators.required),
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

  _validateMinCount(insuredEvent: string, i: number): string | null {
    if (this.eventFormArray != null && this.eventFormArray != undefined) {
      if (
        this.eventFormArray?.controls[i]?.get('minQuantity')?.invalid &&
        (this.eventFormArray?.controls[i]?.get('minQuantity')?.dirty ||
          this.eventFormArray?.controls[i]?.get('minQuantity')?.touched)
      ) {
        if (
          this.eventFormArray?.controls[i]?.get('minQuantity')?.errors?.[
            'required'
          ]
        )
          return this.eventLabels.requiredField;
        if (this.eventFormArray.controls[i].get('minQuantity')?.value < 0) {
          return this.eventLabels.minCountErrMessage;
        }
      }
    }
    return null;
  }

  _validateMaxCount(insuredEvent: string, i: number): string | null {
    if (this.eventFormArray != null && this.eventFormArray != undefined) {
      if (
        this.eventFormArray?.controls[i]?.get('maxQuantity')?.dirty ||
        this.eventFormArray?.controls[i]?.get('maxQuantity')?.touched
      ) {
        if (
          this.eventFormArray?.controls[i]?.get('maxQuantity')?.errors?.[
            'required'
          ]
        )
          return this.eventLabels.requiredMaxField;
        if (
          this.eventFormArray.controls[i].get('minQuantity')?.value >=
          this.eventFormArray.controls[i].get('maxQuantity')?.value
        ) {
          this.eventFormArray.controls[i].get('maxQuantity')?.setErrors({
            minQuantity: this.eventLabels.maxQuantityMinError,
          });
          return this.eventLabels.maxQuantityMinError;
        }
      }
    }
    return null;
  }

  _validateCustAttribute(i: number, j: number): string | null {
    if (this.eventFormArray != null && this.eventFormArray != undefined) {
      const attributesForm: FormArray | null = this.eventFormArray?.controls[
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
            ? this.eventLabels.nameCharLimitError
            : this.eventLabels.nameCharLimitErrorMsg;
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

  customAttrDuplicateValidator(index: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control || control.value === null || control.value === '') {
        return null;
      }

      if (this.duplicatesCheckCustomAttr(control.value, index)) {
        return { attrDuplicate: true };
      } else {
        return null;
      }
    };
  }

  duplicatesCheckCustomAttr(inputValue: string, index: number): boolean {
    const formGroup = this.eventFormArray?.controls[index];
    const attributesForm: FormArray | null = formGroup?.get(
      'customAttributesForm.attributes'
    ) as FormArray;
    const attributes =
      attributesForm?.controls?.map((control) =>
        control.get('name')?.value.toLowerCase().trim()
      ) || [];

    if (this.hasDuplicates(attributes)) {
      return true;
    }
    return false;
  }

  hasDuplicates(array: any[]): boolean {
    const uniqueValues = new Set();

    for (const item of array) {
      if (uniqueValues.has(item)) {
        return true;
      }
      uniqueValues.add(item);
    }

    return false;
  }

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

  onChipRemove(event: any, type: string): void {
    if (type === 'eventType') {
      const removedItem = event.value;
      const updatedEventTypes = this.selectedEventTypes.filter(
        (item) => item.description !== removedItem.description
      );

      this.selectedEventTypes = updatedEventTypes;
      this.eventType.patchValue(updatedEventTypes);
      this.eventTypeChipControl.patchValue([...updatedEventTypes]);

      this.updateEventFormArray(updatedEventTypes);
    }
  }

  clearSelection(type: string): void {
    if (type === 'eventType') {
      this.selectedEventTypes = [];
      this.eventType.patchValue([]);
      this.eventTypeChipControl.patchValue([]);

      this.updateEventFormArray([]);
    }
  }

  listToString(list: MasterData[]) {
    const str = list
      ?.map((item: MasterData) => `.${item.description}`)
      .join(', ');
    return str;
  }
}
