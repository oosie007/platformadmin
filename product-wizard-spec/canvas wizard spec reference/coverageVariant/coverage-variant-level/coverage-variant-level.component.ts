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
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { StudioCommands } from '@canvas/commands';
import { LayoutService, TableComponent } from '@canvas/components';
import { TableOptions } from '@canvas/components/types';
import { TableService } from '@canvas/services';
import { StudioCommandDefinition } from '@canvas/types';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbInputModule,
  CbSelectChoiceModule,
} from '@chubb/ui-components';
import { isNullOrUndefined } from 'is-what';
import { isEmpty } from 'lodash';
import { cloneDeep } from 'lodash-es';
import { combineLatest } from 'rxjs';
import { UtilityService } from '../../../../services/utility.service';
import { inputUnselectPipe } from '../../../pipes/input-unselect.pipe';
import { CoverageVariantService } from '../../../services/coverage-variant.service';
import { InsuredTypeService } from '../../../services/insured-type.service';
import { ProductContextService } from '../../../services/product-context.service';
import { ProductsService } from '../../../services/products.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant, InsuredTypes } from '../../../types/coverage';
import {
  CoverageVariantLevel,
  DependentTypeKeys,
  InsuredTypeKeys,
} from '../../../types/coverage-variant-level';
import { Value } from '../../../types/insured-object';
import { InsuredTypeColumns } from '../../../types/insured-type-columns';
import { MasterData } from '../../../types/product';
import { Category } from '../../../types/ref-data';
@Component({
  selector: 'canvas-coverage-variant-level',
  standalone: true,
  imports: [
    CommonModule,
    CbIconModule,
    CbButtonModule,
    TableComponent,
    FormsModule,
    ReactiveFormsModule,
    CbInputModule,
    CbSelectChoiceModule,
    inputUnselectPipe,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './coverage-variant-level.component.html',
  styleUrls: ['./coverage-variant-level.component.scss'],
})
export class CoverageVariantLevelComponent implements OnInit {
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  cbIconSize = CbIconSize;
  productId: string;
  productVersionId: string;
  coverageVariantId: string;
  coverageVariant: CoverageVariant;
  insureds: InsuredTypes[] = [];
  nextButtonLabel = 'Next';
  aggregateType: MasterData[] = [];
  protected options!: TableOptions;
  coverageVariantLevels: CoverageVariantLevel[];
  insuredTypes: MasterData[];
  insuredObjects: Value[];
  editInsuredTypeCommand!: StudioCommandDefinition;
  limitsForm: FormGroup;
  retrieveDataControl: FormControl;
  coverageList: CoverageVariant[];
  isLimits = false;
  isObject = false;
  maxValue: number;
  maxPercentage: number;
  cvLevelId: string;
  objectTypeToRenderIndex: number;
  selectedObjectTypes: number;
  productClass: string;
  disableEdit = false;
  insuredEvents: MasterData[] = [];
  get aggregateMaxLimitsValue(): string {
    return this.limitsForm.get('cumulativeLimitType')?.value;
  }
  constructor(
    private _router: Router,
    private _coverageVariantService: CoverageVariantService,
    private readonly _tableService: TableService,
    private _layoutService: LayoutService,
    private _variantLevelService: VariantLevelService,
    private _productService: ProductsService,
    private _insuredTypeService: InsuredTypeService,
    private _commandsService: StudioCommands,
    private _fb: FormBuilder,
    private _productContextService: ProductContextService,
    private _route: ActivatedRoute,
    private _utilityService: UtilityService
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
      localStorage.getItem('coverageVariantId') != null ||
      localStorage.getItem('coverageVariantId') != undefined
    ) {
      this.coverageVariantId = localStorage.getItem('coverageVariantId') || '';
    }
    this.productClass = localStorage?.getItem('ProductClass') || '';
    this.disableEdit = _productContextService.isProductDisabled() ?? false;
    const columns = cloneDeep(InsuredTypeColumns);
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [15, 30, 50, 100],
      columns: this.disableEdit
        ? columns.map((col) => {
            if (col.fieldName === '') {
              col.actions = col.actions?.map((act) => {
                act = {
                  ...act,
                  label: act.label === 'Edit' ? 'View' : act.label,
                  icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon,
                };
                return act;
              });
            }
            return col;
          })
        : columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };

    this.editInsuredTypeCommand = <StudioCommandDefinition>{
      commandName: 'NavigateCommand',
    };
    this._commandsService.add('EditInsuredType', {
      commandName: 'EditInsuredType',
      canExecute: () => true,
      execute: (value: any) => {
        if (value.item.category === 'INSUREDOBJECT') {
          this.coverageVariantId = this.coverageVariantId.split(' ')[0];

          if (isEmpty(this.cvLevelId) && !isEmpty(value.item.insuredType)) {
            this._router.navigate(
              [
                `/products/${this.productId}/coveragevariant/objectVariantLevel`,
              ],
              { queryParams: { key: value.item.insuredType } }
            );
          } else {
            this._router.navigate(
              [
                `products/${
                  this.productId
                }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
                  this.cvLevelId
                }/update`,
              ],
              { queryParams: { key: value.item.insuredType } }
            );
          }
        } else if (value.item.category === 'INSUREDEVENT') {
          this.coverageVariantId = this.coverageVariantId.split(' ')[0];

          if (isEmpty(this.cvLevelId) && !isEmpty(value.item.insuredType)) {
            this._router.navigate(
              [`/products/${this.productId}/coveragevariant/eventVariantLevel`],
              { queryParams: { key: value.item.insuredType } }
            );
          } else {
            this._router.navigate(
              [
                `products/${
                  this.productId
                }/coveragevariants/${this.coverageVariantId.trimEnd()}/variantLevels/${
                  this.cvLevelId
                }/event`,
              ],
              { queryParams: { key: value.item.insuredType } }
            );
          }
        } else {
          this.editInsuredType(value);
        }

        return Promise.resolve(true);
      },
    });
  }

  ngOnInit() {
    this._route?.paramMap?.subscribe((params: ParamMap) => {
      this.cvLevelId = params.get('cvLevelId') ?? '';
    });
    this.disableEdit = this._productContextService.isProductDisabled() ?? false;
    this.retrieveDataControl = this._fb.control(
      { value: '', disabled: this.disableEdit ? true : false },
      []
    );
    this.limitsForm = this._fb.group({
      cumulativeLimitType: this._fb.control(
        { value: '', disabled: this.disableEdit ? true : this.disableEdit },
        []
      ),
      cumulativeamountValue: this._fb.control(
        { value: '', disabled: this.disableEdit ? true : this.disableEdit },
        []
      ),
      cumulativePercentage: this._fb.control(
        { value: '', disabled: this.disableEdit ? true : this.disableEdit },
        []
      ),
      cumulativeMaxPercentage: this._fb.control(
        { value: '', disabled: this.disableEdit ? true : this.disableEdit },
        []
      ),
    });
    this.getCoverageVariantDetails();
    this.getCumulativeLimits();
    this._observeAndSetValidators();
    this._updateLayout();
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
        label: 'Coverage variants',
        routerLink: `/products/${this.productId}/coveragevariant`,
      },
      {
        label: `${this.coverageVariantId}`,
        routerLink: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
      },
      {
        label: 'Coverage variant levels',
        routerLink: `/products/${this.productId}/coveragevariant/coveragevariantlevels`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  editInsuredType(value: any) {
    console.log(value);
    switch (value.item.insuredType) {
      case InsuredTypeKeys.MAININSURED:
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/miVariantLevel`,
        ]);
        break;
      case InsuredTypeKeys.SPOUSE:
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/spouseVariantLevel`,
        ]);
        break;
      case DependentTypeKeys.CHILD:
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/childVariantLevel`,
        ]);
        break;
      case DependentTypeKeys.ADULT:
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/adultVariantLevel`,
        ]);
        break;
      default:
        this._router.navigate([
          `/products/${this.productId}/coveragevariant/coverage-variant-level-overview`,
        ]);
    }
  }

  getCoverageVariantLevels() {
    const variantLevels = this._variantLevelService.getCoverageVaraintLevels(
      this.productId,
      this.productVersionId,
      this.coverageVariantId
    );
    return variantLevels;
  }

  getCoverageVariantById() {
    const variantData = this._coverageVariantService.getCoverageVariant(
      this.coverageVariantId,
      this.productId,
      this.productVersionId
    );
    return variantData;
  }

  getCoverageVariants() {
    const coverageVariant = this._coverageVariantService.getCoverageVariants(
      this.productId,
      this.productVersionId
    );
    return coverageVariant;
  }

  getCoverageVariantDetails() {
    combineLatest([
      this.getCoverageVariantLevels(),
      this.getCoverageVariantById(),
      this._productService.getReferenceData(Category.INSURED),
      this._productService.getReferenceData(Category.DEPENDENTTYPE),
      this.getCumulativeLimits(),
      this.getCoverageVariants(),
      this._utilityService.fetchAdminDomainData(['INSUREDEVENT']),
    ]).subscribe({
      next: ([
        variantLevelResponse,
        variantResponse,
        insuredData,
        dependentData,
        cumulativeData,
        coverageVariant,
        insuredEvents,
      ]) => {
        this.coverageVariantLevels = variantLevelResponse;
        this.coverageVariant = variantResponse;
        this.aggregateType = cumulativeData;
        this.coverageList = coverageVariant;
        this.coverageList = this.coverageList.filter(
          (coverageid) => coverageid.coverageVariantId != this.coverageVariantId
        );
        this.insuredTypes = [...insuredData, ...dependentData];
        this.insuredEvents = insuredEvents;

        if (!isEmpty(this.coverageVariant?.insuredObjects)) {
          this._insuredTypeService
            .getPredefinedAttributes(this.productClass)
            .subscribe((res) => {
              this.insuredObjects =
                res.productClass.supportedInsuredType.find((x) => x.values)
                  ?.values || [];
              this.configureCoverageLimits();
            });
        } else {
          this.configureCoverageLimits();
        }
      },
      error: (e) => {
        console.log('Coverage variant level error', e);
      },
    });
  }

  configureCoverageLimits(): void {
    if (
      this.coverageVariantLevels[0]?.insuredLevel?.length > 0 ||
      this.coverageVariantLevels[0]?.insuredObjectLevel?.length > 0
    ) {
      this.disableEdit = this._productContextService.isProductDisabled();
      this.nextButtonLabel = this.disableEdit ? 'Next' : 'Save Changes';
    }
    const coverageVariantLevelId =
      isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
        ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
        : this.cvLevelId;
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? this.coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : this.coverageVariantLevels[0];
    this.selectedObjectTypes = this.coverageVariantLevels.length;
    if (this.selectedObjectTypes === 0) {
      this.objectTypeToRenderIndex = 0;
    } else {
      const indexLength = this.coverageVariantLevels?.find(
        (x) => x.coverageVariantLevelId === coverageVariantLevelId
      );
      this.objectTypeToRenderIndex = Number(
        indexLength?.description.split(' ')[2]
      );
    }

    if (coverageVariantLevel?.aggregateLimitType?.toLowerCase() === 'amt') {
      this.maxValue = coverageVariantLevel?.aggregateMaxValue;
      this.isLimits = false;
    } else if (
      coverageVariantLevel?.aggregateLimitType?.toLowerCase() === 'percentage'
    ) {
      this.maxPercentage = coverageVariantLevel?.aggregateMaxValue;
      this.isLimits = true;
    }
    if (this.coverageVariant) {
      this.getInsuredTypes();

      this.limitsForm.patchValue({
        cumulativeLimitType: coverageVariantLevel?.aggregateLimitType
          ? coverageVariantLevel?.aggregateLimitType
          : this._productContextService._getProductAggregateLimitType(),
        cumulativeamountValue: this.maxValue
          ? this.maxValue
          : this._productContextService._getProductAggregateLimitValue(),
        cumulativePercentage:
          coverageVariantLevel?.aggregateCoverageVariantPercentage
            ? coverageVariantLevel?.aggregateCoverageVariantPercentage
            : this._productContextService._getproductAggregatePercentageType(),
        cumulativeMaxPercentage: this.maxPercentage
          ? this.maxPercentage
          : this._productContextService._getProductAggregateLimitValue(),
      });
    }
  }

  private saveCumulaticeData() {
    const coverageVariantLevelId =
      isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
        ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
        : this.cvLevelId;
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? this.coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : this.coverageVariantLevels[0];

    if (
      coverageVariantLevel != undefined &&
      coverageVariantLevelId != undefined
    ) {
      const patchData = {
        ...coverageVariantLevel,
        coverageVariantLevelId: coverageVariantLevelId,
        aggregateCoverageVariantPercentage:
          this._productContextService._getProductAggregateLimitType()
            ? this._productContextService._getProductAggregateLimitValue()
            : coverageVariantLevel.aggregateCoverageVariantPercentage,
        aggregateLimitType:
          this._productContextService._getProductAggregateLimitType()
            ? this._productContextService._getProductAggregateLimitType()
            : coverageVariantLevel?.aggregateLimitType,
        aggregateMaxValue:
          this._productContextService._getProductAggregateLimitValue()
            ? this._productContextService._getProductAggregateLimitValue()
            : coverageVariantLevel.aggregateMaxValue,
        requestId: crypto.randomUUID(),
        insuredEventLevel: coverageVariantLevel.insuredEventLevel || [],
        insuredLevel: coverageVariantLevel.insuredLevel || [],
        insuredObjectLevel: coverageVariantLevel.insuredObjectLevel || [],
        ruleSet: coverageVariantLevel.ruleSet || [],
      };

      this._variantLevelService
        .patchCoverageVariantLevel(
          this.productId,
          this.productVersionId,
          this.coverageVariantId,
          coverageVariantLevelId,
          patchData
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage({
              severity: 'success',
              message: 'Coverage Variant Level Saved Successfully',
              duration: 5000,
            });
          },
          error: (e) => {
            if (
              (e.error.errors && e.error.errors['PMERR000336']) ||
              (e.error.errors && e.error.errors['PMERR000337'])
            ) {
              this._layoutService.showMessage({
                severity: 'error',
                message: e.error.errors['PMERR000336']
                  ? e.error.errors['PMERR000336']
                  : e.error.errors && e.error.errors['PMERR000337'],
              });
            } else {
              this._layoutService.showMessage({
                severity: 'error',
                message: 'Unable to save data. Please try again later.',
                duration: 5000,
              });
            }
          },
        });
    }
  }

  next(): void {
    if (this.disableEdit) {
      this._router.navigate([
        `/products/${this.productId}/coveragevariant/coverage-variant-level-overview`,
      ]);
      return;
    }
    if (
      this.coverageVariant?.insuredObjects != null &&
      this.coverageVariant?.insuredObjects != undefined &&
      this.coverageVariant?.insuredObjects?.length > 0
    ) {
      this._markAllFieldsDirty(this.limitsForm);
      if (
        this.aggregateMaxLimitsValue != '' &&
        this.aggregateMaxLimitsValue != undefined &&
        this.limitsForm?.invalid
      ) {
        return;
      }

      this.saveCumulaticeData();
    }

    const insType = this.insureds?.find(
      (x) => x.status == 'Incomplete'
    )?.insuredType;

    if (
      !isEmpty(insType) &&
      (this.insureds?.[0]?.category == Category.INSURED ||
        this.insureds?.[0]?.category == Category.DEPENDENTTYPE)
    ) {
      switch (insType) {
        case InsuredTypeKeys.MAININSURED:
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/miVariantLevel`,
          ]);
          break;
        case InsuredTypeKeys.SPOUSE:
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/spouseVariantLevel`,
          ]);
          break;
        case DependentTypeKeys.CHILD:
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/childVariantLevel`,
          ]);
          break;
        case DependentTypeKeys.ADULT:
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/adultVariantLevel`,
          ]);
          break;
        default:
          this._router.navigate([
            `/products/${this.productId}/coveragevariant/coverage-variant-level-overview`,
          ]);
      }
    } else if (
      !isEmpty(insType) &&
      this.insureds?.[0]?.category == 'INSUREDOBJECT'
    ) {
      this._router.navigate(
        [`/products/${this.productId}/coveragevariant/objectVariantLevel`],
        { queryParams: { key: insType } }
      );
    } else if (
      !isEmpty(insType) &&
      this.insureds?.[0]?.category == 'INSUREDEVENT'
    ) {
      this._router.navigate(
        [`/products/${this.productId}/coveragevariant/eventVariantLevel`],
        { queryParams: { key: insType } }
      );
    } else {
      this._router.navigate([
        `/products/${this.productId}/coveragevariant/coverage-variant-level-overview`,
      ]);
    }
  }

  previous(): void {
    this._router.navigate([
      `/products/${this.productId}/coveragevariant/coverage-variant-level-overview`,
    ]);
  }

  saveandExit(): void {
    this.saveCumulaticeData();
  }

  getInsuredTypes() {
    if (this.coverageVariant.insured) {
      for (
        let i = 0;
        i <
        this.coverageVariant.insured?.individual?.insuredTypes[0]
          ?.insuredGroupTypes?.length;
        i++
      ) {
        const insured =
          this.coverageVariant.insured?.individual?.insuredTypes[0]
            ?.insuredGroupTypes[i].individual;
        const insuredLevel =
          !!this.coverageVariantLevels &&
          this.coverageVariantLevels[0]?.insuredLevel;
        this.insureds.push({
          insuredKey: insured.key,
          isCurrentVersion:
            this.coverageVariant.insured?.individual?.insuredTypes[0]
              .isCurrentVersion ?? true,
          insuredType: insured.value,
          insured:
            this.insuredTypes.find((ins) => ins.code == insured.value)
              ?.description || insured.value,
          subCoverage: '-',
          status:
            insuredLevel?.findIndex(
              (x) => x.insuredType?.value == insured?.value
            ) > -1
              ? 'Complete'
              : 'Incomplete',
          actions: '-',
          category: Category.INSURED,
        });
        this.isObject = false;
      }
    }
    if (
      this.coverageVariant?.insuredObjects &&
      this.coverageVariant?.insuredObjects.length > 0
    ) {
      if (
        this.coverageVariant?.coverageVariantLevels != undefined &&
        this.coverageVariant?.coverageVariantLevels?.length > 0
      ) {
        const cvLevelid =
          isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
            ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
            : this.cvLevelId;
        const filteredData = this.coverageVariantLevels.filter(
          (levelId) => levelId.coverageVariantLevelId === cvLevelid
        );
        if (
          filteredData[0].insuredObjectLevel.length ===
          this.coverageVariant.insuredObjects.length
        ) {
          for (let i = 0; i < filteredData[0].insuredObjectLevel?.length; i++) {
            const insuredObject =
              filteredData[0].insuredObjectLevel[i]?.insuredObjectType;
            const insuredObjectLevel =
              !!this.coverageVariantLevels &&
              this.coverageVariantLevels[0]?.insuredObjectLevel;
            this.insureds.push({
              insuredKey: this.coverageVariant.insuredObjects?.find(
                (x) => x.type.value === insuredObject.value
              )?.type?.key,
              insuredType: insuredObject?.value,
              isCurrentVersion: filteredData[0]?.isCurrentVersion ?? true,
              insured:
                this.insuredObjects.find(
                  (ins) => ins.msgId === insuredObject?.value
                )?.description || insuredObject?.value,
              subCoverage: '-',
              status:
                insuredObjectLevel?.findIndex(
                  (obj) => obj.insuredObjectType?.value == insuredObject?.value
                ) > -1
                  ? 'Complete'
                  : 'Incomplete',
              actions: '-',
              category: Category.INSUREDOBJECT,
            });
            this.isObject = true;
          }
        } else {
          for (
            let i = 0;
            i < this.coverageVariant.insuredObjects?.length;
            i++
          ) {
            const insuredObject = this.coverageVariant.insuredObjects[i]?.type;
            const insuredObjectLevel =
              filteredData[0]?.insuredObjectLevel[i]?.insuredObjectType.value;
            const status = this.coverageVariant?.insuredObjects?.filter(
              (x) => x.type.value === insuredObjectLevel
            )[0]
              ? 'Complete'
              : 'Incomplete';

            this.insureds.push({
              insuredKey: this.coverageVariant.insuredObjects?.find(
                (x) => x.type.value === insuredObject.value
              )?.type?.key,
              insuredType: insuredObject?.value,
              isCurrentVersion:
                this.coverageVariant.insuredObjects[i]?.isCurrentVersion ??
                true,
              insured:
                this.insuredObjects.find(
                  (ins) => ins.msgId === insuredObject?.value
                )?.description || insuredObject?.value,
              subCoverage: '-',
              status: status,
              actions: '-',
              category: Category.INSUREDOBJECT,
            });
            this.isObject = true;
          }
        }
        //this.insureds = _.sortBy(this.insureds, ['insuredType']);
      } else {
        for (let i = 0; i < this.coverageVariant.insuredObjects?.length; i++) {
          const insuredObject = this.coverageVariant.insuredObjects[i]?.type;
          const insuredObjectLevel =
            !!this.coverageVariantLevels &&
            this.coverageVariantLevels[0]?.insuredObjectLevel;
          this.insureds.push({
            insuredKey: insuredObject?.key,
            insuredType: insuredObject?.value,
            isCurrentVersion:
              this.coverageVariant.insuredObjects[i]?.isCurrentVersion ?? true,
            insured:
              this.insuredObjects.find(
                (ins) => ins.msgId === insuredObject?.value
              )?.description || insuredObject?.value,
            subCoverage: '-',
            status:
              insuredObjectLevel?.findIndex(
                (obj) => obj.insuredObjectType?.value == insuredObject?.value
              ) > -1
                ? 'Complete'
                : 'Incomplete',
            actions: '-',
            category: Category.INSUREDOBJECT,
          });
          this.isObject = true;
          //this.insureds = _.sortBy(this.insureds, ['insuredType']);
        }
      }
    }
    if (
      this.coverageVariant?.insuredEvents &&
      this.coverageVariant?.insuredEvents.length > 0
    ) {
      if (
        this.coverageVariant?.coverageVariantLevels != undefined &&
        this.coverageVariant?.coverageVariantLevels?.length > 0
      ) {
        const cvLevelid =
          isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
            ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
            : this.cvLevelId;
        const filteredData = this.coverageVariantLevels.filter(
          (levelId) => levelId.coverageVariantLevelId === cvLevelid
        );
        if (
          filteredData[0].insuredEventLevel.length ===
          this.coverageVariant.insuredEvents.length
        ) {
          for (let i = 0; i < filteredData[0].insuredEventLevel?.length; i++) {
            const insuredEvent =
              filteredData[0].insuredEventLevel[i]?.insuredEventType;
            const insuredEventLevel =
              !!this.coverageVariantLevels &&
              this.coverageVariantLevels[0]?.insuredEventLevel;
            this.insureds.push({
              insuredKey: this.coverageVariant.insuredEvents?.find(
                (x) => x.type.value === insuredEvent.value
              )?.type?.key,
              insuredType: insuredEvent?.value,
              isCurrentVersion: filteredData[0]?.isCurrentVersion ?? true,
              insured:
                this.insuredObjects.find(
                  (ins) => ins.msgId === insuredEvent?.value
                )?.description || insuredEvent?.value,
              subCoverage: '-',
              status:
                insuredEventLevel?.findIndex(
                  (obj) => obj.insuredEventType?.value == insuredEvent?.value
                ) > -1
                  ? 'Complete'
                  : 'Incomplete',
              actions: '-',
              category: Category.INSUREDEVENT,
            });
            this.isObject = false;
          }
        } else {
          for (let i = 0; i < this.coverageVariant.insuredEvents?.length; i++) {
            const insuredEvent = this.coverageVariant.insuredEvents[i]?.type;
            const insuredEventLevel =
              filteredData[0]?.insuredEventLevel[i]?.insuredEventType.value;
            const status = this.coverageVariant?.insuredEvents?.filter(
              (x) => x.type.value === insuredEventLevel
            )[0]
              ? 'Complete'
              : 'Incomplete';

            this.insureds.push({
              insuredKey: this.coverageVariant.insuredEvents?.find(
                (x) => x.type.value === insuredEvent.value
              )?.type?.key,
              insuredType: insuredEvent?.value,
              isCurrentVersion:
                this.coverageVariant.insuredEvents[i]?.isCurrentVersion ?? true,
              insured:
                this.insuredEvents.find(
                  (ins) => ins.code === insuredEvent?.value
                )?.description || insuredEvent?.value,
              subCoverage: '-',
              status: status,
              actions: '-',
              category: Category.INSUREDEVENT,
            });
            this.isObject = false;
          }
        }
        //this.insureds = _.sortBy(this.insureds, ['insuredType']);
      } else {
        for (let i = 0; i < this.coverageVariant.insuredEvents?.length; i++) {
          const insuredEvent = this.coverageVariant.insuredEvents[i]?.type;
          const insuredEventLevel =
            !!this.coverageVariantLevels &&
            this.coverageVariantLevels[0]?.insuredEventLevel;
          this.insureds.push({
            insuredKey: insuredEvent?.key,
            insuredType: insuredEvent?.value,
            isCurrentVersion:
              this.coverageVariant.insuredEvents[i]?.isCurrentVersion ?? true,
            insured:
              this.insuredEvents.find((ins) => ins.code === insuredEvent?.value)
                ?.description || insuredEvent?.value,
            subCoverage: '-',
            status:
              insuredEventLevel?.findIndex(
                (obj) => obj.insuredEventType?.value == insuredEvent?.value
              ) > -1
                ? 'Complete'
                : 'Incomplete',
            actions: '-',
            category: Category.INSUREDEVENT,
          });
          this.isObject = false;
          //this.insureds = _.sortBy(this.insureds, ['insuredType']);
        }
      }
    }
  }

  getCumulativeLimits() {
    const cumulativeData = this._productService.getMinMaxLimitTypes();
    return cumulativeData;
  }

  private _prefillForm(selectedOption: MasterData | undefined) {
    const coverageVariantLevelId =
      isNullOrUndefined(this.cvLevelId) || isEmpty(this.cvLevelId)
        ? this.coverageVariantLevels?.[0]?.coverageVariantLevelId
        : this.cvLevelId;
    const coverageVariantLevel = !isEmpty(coverageVariantLevelId)
      ? this.coverageVariantLevels.find(
          (level) => level.coverageVariantLevelId == coverageVariantLevelId
        )
      : this.coverageVariantLevels[0];
    ///To be done once get the API need to check the data
    const filteredVariantLevelData =
      coverageVariantLevel?.insuredObjectLevel?.find(
        (ele) => ele.insuredObjectType.value === selectedOption?.code
      );

    if (
      coverageVariantLevel?.aggregateLimitType.toLowerCase() === 'percentage'
    ) {
      this.isLimits = true;
    } else if (
      coverageVariantLevel?.aggregateLimitType.toLowerCase() === 'amt'
    ) {
      this.isLimits = false;
    }
    this.limitsForm.patchValue({
      maxLimitType: filteredVariantLevelData?.limit.maxType ?? '',
      amountValue: filteredVariantLevelData?.limit.maxAmount ?? '',
      percentOf: filteredVariantLevelData?.limit.maxAmount ?? '',
      cumulativeLimitType: coverageVariantLevel?.aggregateLimitType
        ? coverageVariantLevel?.aggregateLimitType
        : this._productContextService._getProductAggregateLimitType(),
      cumulativeamountValue: this.maxValue
        ? this.maxValue
        : this._productContextService._getProductAggregateLimitValue(),
      cumulativePercentage:
        coverageVariantLevel?.aggregateCoverageVariantPercentage
          ? coverageVariantLevel?.aggregateCoverageVariantPercentage
          : this._productContextService._getproductAggregatePercentageType(),
      cumulativeMaxPercentage: this.maxPercentage
        ? this.maxPercentage
        : this._productContextService._getProductAggregateLimitValue(),
    });
  }

  selectedAmount() {
    const amountVal = this.limitsForm.get('cumulativeamountValue')?.value ?? 0;
    this._productContextService._setProductAggregateLimitValue(amountVal);
  }

  selectedPercentage() {
    const amountVal =
      this.limitsForm.get('cumulativeMaxPercentage')?.value ?? 0;
    this._productContextService._setProductAggregateLimitValue(amountVal);
  }

  onSelectionChange() {
    const selectedVal = this.limitsForm?.get('cumulativeLimitType')?.value;
    this._productContextService._setProductAggregateLimitType(selectedVal);
    if (selectedVal.toLowerCase() === 'percentage') {
      this.isLimits = true;
    } else {
      this.isLimits = false;
    }
    this._observeAndSetValidators();
  }

  selectedvariant() {
    const amountVal = this.limitsForm.get('cumulativePercentage')?.value ?? '';
    this._productContextService._setproductAggregatePercentageType(amountVal);
  }

  private _observeAndSetValidators(): void {
    this.retrieveDataControl.valueChanges.subscribe((val) => {
      this._prefillForm(
        this.aggregateType.find((ele) => ele.description === val.description)
      );
    });
    this.limitsForm
      ?.get('cumulativeLimitType')
      ?.valueChanges.subscribe((val: string) => {
        if (val && val.toLowerCase() === 'amt') {
          this.limitsForm
            ?.get('cumulativeamountValue')
            ?.setValidators([Validators.required, Validators.min(1)]);
          this.limitsForm?.get('cumulativePercentage')?.clearValidators();
          this.limitsForm.get('cumulativePercentage')?.patchValue('');
          this.limitsForm.get('cumulativeamountValue')?.patchValue('');
          this.limitsForm?.get('cumulativeMaxPercentage')?.clearValidators();
          this.limitsForm.get('cumulativeMaxPercentage')?.patchValue('');
          this._markAllFieldsDirty(this.limitsForm);
        } else {
          this.limitsForm?.get('cumulativeamountValue')?.clearValidators();
          this.limitsForm
            ?.get('cumulativeMaxPercentage')
            ?.setValidators([Validators.required, Validators.max(100)]);
          this.limitsForm
            ?.get('cumulativePercentage')
            ?.setValidators([Validators.required]);
          this.limitsForm.get('cumulativeamountValue')?.patchValue('');
          this.limitsForm.get('cumulativeMaxPercentage')?.patchValue('');

          this._markAllFieldsDirty(this.limitsForm);
        }
      });
  }

  get field(): { [key: string]: AbstractControl } {
    return this.limitsForm.controls;
  }

  private _markAllFieldsDirty(form: AbstractControl): void {
    form?.markAsDirty();
    if (form instanceof FormGroup && form.controls) {
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        control?.markAsDirty();
        this._markAllFieldsDirty(control as FormGroup);
      });
    }
    if (form instanceof FormArray) {
      for (let i = 0; i < form.length; i++) {
        Object.keys((form.controls[i] as FormGroup).controls).forEach((key) => {
          const control = form.controls[i].get(key);
          control?.markAsDirty();
        });
      }
    }
  }
}
