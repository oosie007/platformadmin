/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { isNullOrUndefined } from 'is-what';
import { InsuredType } from '../types/coverage-variant-level';
import { MasterData } from '../types/product';
import { Category, MsgIds } from '../types/ref-data';
import { SubCoverage } from '../types/sub-coverage';

@Injectable({
  providedIn: 'root',
})
export class SubCoverageLevelService {
  constructor(private _fb: FormBuilder) {}

  createLimitsForm(fields: string[]): FormGroup {
    const group: any = {};
    if (fields.includes('maxLimitType')) {
      group.maxLimitType = new FormControl('', Validators.required);
    }
    if (fields.includes('amountValue')) {
      group.amountValue = new FormControl('', [Validators.required, Validators.maxLength(50)]);
    }
    if (fields.includes('percentOf')) {
      group.percentOf = new FormControl('', [Validators.maxLength(50)]);
    }
    if (fields.includes('aggregateLimitType')){
      group.aggregateLimitType = new FormControl('');
    }
    if (fields.includes('aggregateamountValue')){
      group.aggregateamountValue = new FormControl('');
    }
    if (fields.includes('aggregratePercentOf')){
      group.aggregratePercentOf = new FormControl('', [Validators.maxLength(50)]);
    }
    if (fields.includes('aggregateMaxPercentOf')){
      group.aggregateMaxPercentOf = new FormControl('');
    }
    return new FormGroup(group);
  }

  limitsForm(): FormGroup {
    return this._fb.group({
      maxLimitType: this._fb.control('', [Validators.required]),
      amountValue: this._fb.control('', [
        Validators.required,
        Validators.maxLength(50),
      ]),
      percentOf: this._fb.control('', [Validators.maxLength(50)]),
      aggregateLimitType:this._fb.control('',[]),
      aggregateamountValue:this._fb.control('',[]),
      aggregratePercentOf:this._fb.control('',[Validators.maxLength(50)]),
      aggregateMaxPercentOf:this._fb.control('',[])
      
    });
  }
  
  initDeductibles(): FormGroup {
    return this._fb.group({
      deductibleType: this._fb.control('', []),
      valueType: this._fb.control('', []),
      amountValue: this._fb.control('', [Validators.maxLength(50)]),
      percentOf: this._fb.control('', [Validators.maxLength(50)]),
    });
  }

  initAdditionalFields(): FormGroup {
    return this._fb.group({
      minLimitType: this._fb.control('', []),
      amountValue: this._fb.control('', [Validators.maxLength(50)]),
      percentOf: this._fb.control('', [Validators.maxLength(50)]),
      durationType: this._fb.control('', []),
      durationValue: this._fb.control('', [Validators.maxLength(50)]),
      limitScope: this._fb.control('', []),
      scopeValue: this._fb.control('', [Validators.maxLength(50)]),
      waitingPeriod: this._fb.control('', []),
      waitingPeriodValue: this._fb.control('', [Validators.maxLength(50)]),
    });
  }

  initSubCoverage(): FormGroup {
    return this._fb.group({
      limitsForm: this.limitsForm(),
      selectSubCoverage: this._fb.control('', [Validators.required]),
      additionalFieldsForm: this.initAdditionalFields(),
      deductiblesForm: this.initDeductibles(),
    });
  }

  /**
   *
   * @param data : Reactive forms data.
   * @param activeInsuredType : Current page Insured type
   * @param isCloned : It will return true if we change 'Copy data from' other than current page.
   * @param currentCoverLevelId : It will contain Coverage Level Id (coverageVariantLevelId)
   * @returns : It will return final request body as per sub coverage object.
   */
  prepareSubCoverageLevel(
    data: any,
    activeInsuredType: InsuredType,
    isCloned?: boolean,
    currentCoverLevelId?: string
  ) {
    const coverageVariantLevels: any = isCloned
      ? data
      : data.filter((item: FormGroup) => item?.pristine === false);
    if (coverageVariantLevels.length > 0) {
      const reqBody: any = [];
      coverageVariantLevels.forEach((item: any) => {
        const {
          additionalFieldsForm,
          deductiblesForm,
          selectSubCoverage,
          subCoverageLevelId,
          limitsForm,
        } = item?.controls;
        console.log(limitsForm);
        const reqItem = {
          subCoverLevelId: subCoverageLevelId?.value ?? null,
          description: selectSubCoverage?.value,
          coverLevelId: currentCoverLevelId,
          insuredType: activeInsuredType,
          limit: {
            minType: additionalFieldsForm.get('minLimitType')?.value,
            minAmount:
              Number(additionalFieldsForm.get('amountValue')?.value) ?? 0,
            maxType: limitsForm.get('maxLimitType')?.value,
            maxAmount:
              limitsForm.get('maxLimitType')?.value === 'Percentage'
                ? Number(limitsForm.get('percentOf')?.value) ?? 0
                : Number(limitsForm.get('amountValue')?.value) ?? 0,
            aggregateLimitType:limitsForm.get('aggregateLimitType')?.value,
            aggregateamountValue:limitsForm.get('aggregateLimitType')?.value === 'PERCENTAGE'
            ? Number(limitsForm.get('aggregateMaxPercentOf')?.value) ?? 0
            : Number(limitsForm.get('aggregateamountValue')?.value) ?? 0,
            aggregratePercentOf:limitsForm.get('aggregratePercentOf')?.value,
            scope: additionalFieldsForm.get('limitScope')?.value,
            scopeValue: additionalFieldsForm.get('scopeValue')?.value,
            // duration: additionalFieldsForm.get('durationType')?.value,
            waitingPeriod: additionalFieldsForm.get('waitingPeriod')?.value,
            waitingPeriodValue:
              additionalFieldsForm.get('waitingPeriodValue')?.value,
            basecoverLevelId: '', // Need to get confirmation
            options: [],
          },
          deductible: {
            deductibleType: deductiblesForm.get('deductibleType')?.value ?? '',
            type: deductiblesForm.get('valueType')?.value,
            amount:
              deductiblesForm.get('valueType')?.value === 'Percentage'
                ? Number(deductiblesForm.get('percentOf')?.value) ?? 0
                : Number(deductiblesForm.get('amountValue')?.value) ?? 0,
            baseCoverLevelId: '', // Need to get confirmation
            options: [],
          },
          duration: {
            type: additionalFieldsForm.get('durationType')?.value ?? '',
            quantity: additionalFieldsForm.get('durationValue')?.value,
          },
          ruleSet: [],
          requestId: crypto.randomUUID(),
        };
        reqBody.push(reqItem);
      });

      return reqBody;
    }
  }

  /**
   *
   * @param insuredTypesList: It will contain the list of insured types.
   * @param type : It will contain the active page insured type.
   * @returns : Here entire object will return based on active type.
   */
  getInsuredType(insuredTypesList: MasterData[], type: string): InsuredType {
    const insuredTypes = insuredTypesList
      .filter((ele) => ele.code === type)
      ?.map((ele: MasterData) => {
        return {
          value: ele.code || type,
          category:
            ele.code === MsgIds.MAIN_INS ||
            type === MsgIds.SPOUSE ||
            type === MsgIds.MAIN_INS ||
            ele.code === MsgIds.SPOUSE
              ? Category.INSURED
              : Category.DEPENDENTTYPE,
        };
      })[0];

    return insuredTypes;
  }

  /**
   *
   * @param subCoverageList : It will contain list of sub coverages.
   * @param subCoverageControlsList : it will contain  sub coverages controls list.
   * @returns It will return new list after adding selected property to list based on conditions.
   */
  updateSubCoverageListStatus(
    subCoverageList: SubCoverage[],
    subCoverageControlsList: any
  ) {
    const selectedSubCoverages: any = [];
    subCoverageControlsList &&
      subCoverageControlsList?.forEach((selectedItems: any) => {
        const id = selectedItems?.controls?.selectSubCoverage?.value;
        if (id?.length !== '' && !selectedSubCoverages.includes(id)) {
          selectedSubCoverages.push(id);
        }
      });
    if (selectedSubCoverages?.length > 0) {
      subCoverageList.map((item) => {
        if (selectedSubCoverages.includes(item.subCoverId)) {
          item.selected = true;
        } else {
          item.selected = false;
        }
      });
    }
    return subCoverageList;
  }

  /**
   *
   * @param data: It will contain json object
   * @param coverageVariantLevelId : It is used to filter data based on active coverageVariantLevels id
   * @returns : It will return all the matched records based on same json.
   */
  filterCoverLevelId(data: any, coverageVariantLevelId: string) {
    if (data?.subCoverages && data?.subCoverages?.length > 0) {
      data?.subCoverages?.map((subCoverage: any) => {
        const subCoverageLevels: any[] = [];
        subCoverage?.subCoverageLevels.forEach((item: any) => {
          if (item?.coverLevelId === coverageVariantLevelId) {
            subCoverageLevels.push(item);
          }
        });
        subCoverage.subCoverageLevels = subCoverageLevels;
      });
      return data;
    } else {
      return;
    }
  }

  updateSubCoverageList(
    rootData: any,
    formData: SubCoverage[],
    activeInsuredType: InsuredType,
    currentCoverLevelId: string
  ) {
    const subCoverages = rootData?.subCoverages;
    if (formData && formData.length > 0) {
      formData.forEach((row: any) => {
        subCoverages.map((subCoverage: any) => {
          if (subCoverage?.subCoverId === row?.description) {
            const updatedData = subCoverage?.subCoverageLevels.filter(
              (subCoverageLevel: any, index: number) => {
                const { coverLevelId, subCoverLevelId, insuredType } =
                  subCoverageLevel;
                const { value } = insuredType;
                if (
                  coverLevelId === currentCoverLevelId &&
                  subCoverLevelId &&
                  insuredType?.value === activeInsuredType?.value &&
                  subCoverageLevel?.description === row?.description
                ) {
                  subCoverage.subCoverageLevels[index] = row;
                  subCoverage.subCoverageLevels[index].subCoverLevelId =
                    subCoverageLevel?.subCoverLevelId;
                  return true;
                }
                return false;
              }
            );

            if (updatedData.length <= 0) {
              subCoverage.subCoverageLevels.push(row);
            }
          }
        });
      });
    }
    return subCoverages;
  }

  removeRecord(rootData: any, subCoverageLevelId: string) {
    if (rootData?.subCoverages && rootData?.subCoverages?.length > 0) {
      rootData?.subCoverages?.map((subCoverage: any) => {
        subCoverage.subCoverageLevels = subCoverage?.subCoverageLevels.filter(
          (item: any) => item?.subCoverLevelId !== subCoverageLevelId
        );
      });
      return rootData;
    } else {
      return;
    }
  }

  /**
   * Validations
   */

  validateForm(form: any) {
    // Coverages variant level
    this.validations(form);
    const { subCoveragesForm } = form?.controls;

    const { subCoverage } = subCoveragesForm?.controls;
    for (let j = 0; j < subCoverage?.length; j++) {
      const list: any = subCoverage.at(j) as FormGroup;
      // Sub Coverage
      this.validations(list);
    }
  }

  /**
   * Form Group validations
   * @param formArray
   */
  validations(list: any): void {
    const { additionalFieldsForm, deductiblesForm, limitsForm } =
      list?.controls;
    if (limitsForm?.controls) {
      const {
        maxLimitType,
        amountValue,
        percentOf,
        aggregateLimitType,
        aggregateamountValue,
        aggregratePercentOf,
        aggregateMaxPercentOf,
      } = limitsForm?.controls;
      const minAmountValue = additionalFieldsForm?.controls['amountValue'];
      const minPercentOf = additionalFieldsForm?.controls['percentOf'];

      if (
        aggregateLimitType?.value != undefined &&
        aggregateLimitType?.value.toLowerCase() === 'percentage'
      ) {
        aggregateamountValue?.get('aggregateamountValue')?.clearValidators();
        this.setControlValidations(aggregateMaxPercentOf);
        if (aggregratePercentOf?.value === '') {
          this.setPercentageValidations(aggregratePercentOf);
        }
        if (
          aggregateMaxPercentOf?.value.length > 3 ||
          aggregateMaxPercentOf?.value > 100
        ) {
          this.setMaxLength(aggregateMaxPercentOf);
        }
      } else if (
        aggregateLimitType?.value != undefined &&
        aggregateLimitType?.value.toLowerCase() === 'amt'
      ) {
        aggregratePercentOf?.get('aggregatePercentOf')?.clearValidators();
        aggregateMaxPercentOf?.get('aggregateMaxPercentOf')?.clearValidators();
        if (Number(aggregateamountValue?.value) < Number(amountValue?.value)) {
          this.setMaxaggregatelimiValidations(aggregateamountValue);
        }
        this.setControlValidations(aggregateamountValue);
      }

      if (maxLimitType?.value === 'Percentage') {
        amountValue?.get('amountValue')?.clearValidators();
        if (Number(percentOf?.value) < Number(minPercentOf?.value)) {
          this.setMaxlimiValidations(percentOf);
        }
        this.setControlValidations(percentOf);
      } else {
        percentOf?.get('percentOf')?.clearValidators();
        if (Number(amountValue?.value) < Number(minAmountValue?.value)) {
          this.setMaxlimiValidations(amountValue);
        }
        this.setControlValidations(amountValue);
      }
    }

    // Additional Fields
    if (additionalFieldsForm?.controls) {
      const {
        minLimitType,
        amountValue,
        percentOf,
        durationType,
        durationValue,
        limitScope,
        scopeValue,
        waitingPeriod,
        waitingPeriodValue,
      } = additionalFieldsForm?.controls;

      // Max limit Type drop down value validations
      if (
        !isNullOrUndefined(minLimitType?.value) &&
        minLimitType?.value !== ''
      ) {
        if (minLimitType?.value === 'Percentage') {
          amountValue?.get('amountValue')?.clearValidators();
          this.setControlValidations(percentOf);
        } else {
          percentOf?.get('percentOf')?.clearValidators();
          this.setControlValidations(amountValue);
        }
      }

      // Duration type drop down value validations
      if (
        !isNullOrUndefined(durationType?.value) &&
        durationType?.value !== ''
      ) {
        this.setControlValidations(durationValue);
      }

      // Limit scope drop down value validations
      if (!isNullOrUndefined(limitScope?.value) && limitScope?.value !== '') {
        this.setControlValidations(scopeValue);
      }

      // Waiting period drop down value validations
      if (
        !isNullOrUndefined(waitingPeriod?.value) &&
        waitingPeriod?.value !== ''
      ) {
        this.setControlValidations(waitingPeriodValue);
      }
    }
    // Deductibles Group
    if (deductiblesForm?.controls) {
      const { amountValue, deductibleType, percentOf, valueType } =
        deductiblesForm?.controls;

      if (
        !isNullOrUndefined(deductibleType?.value) &&
        deductibleType?.value !== ''
      ) {
        if (!isNullOrUndefined(valueType?.value) && valueType?.value !== '') {
          if (valueType?.value === 'Percentage') {
            amountValue?.get('amountValue')?.clearValidators();
            this.setControlValidations(percentOf);
          } else {
            percentOf?.get('percentOf')?.clearValidators();
            this.setControlValidations(amountValue);
          }
        } else {
          valueType?.markAsDirty();
          valueType.setErrors({ required: true });
        }
      }
    }
  }

  /**
   * setControlValidations will set required / pattern validation based on value.
   * @param c Here c is Form Control
   */
  setControlValidations(c: FormControl) {
    if (!c) return; 
    const value = c?.value;
    c?.markAsDirty();
    if (value?.length <= 0) {
      c.setErrors({ required: true });
    } else if (isNaN(Number(value)) || Number(value) <= 0) {
      c.setErrors({ pattern: true });
    }
  }

  /**
   * setMaxlimiValidations will display error if maxlimit value less than minlimit value.
   * @param c Here c is Form Control
   */
  setMaxlimiValidations(c: FormControl) {
    if (!c) return; 
    c.setErrors({ maxlimit: true });
  }

  setMaxaggregatelimiValidations(c: FormControl) {
    if (!c) return; 
    c.setErrors({ maxaggregatelimit: true });
  }
  setPercentageValidations(c: FormControl) {
    if (!c) return; 
    c.setErrors({ percentagerequired: true });
  }
  setMaxLength(c: FormControl) {
    if (!c) return; 
    c.setErrors({ maxLength: true });
  }
}
