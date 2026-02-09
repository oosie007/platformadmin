/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, Validators } from '@angular/forms';
import { CommandsModule, StudioCommands } from '@canvas/commands';
import {
  LayoutComponent,
  LayoutService,
  SearchFilterComponent,
  SidebarFormComponent,
  TableComponent,
} from '@canvas/components';
import { ColumnOptions, TableOptions } from '@canvas/components/types';
import { AppContextService, TableService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbModalModule,
  CbSearchInputModule,
  CbTooltipModule,
} from '@chubb/ui-components';
import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { cloneDeep, isEmpty } from 'lodash-es';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { forkJoin, map } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { UtilityService } from '../../../services/utility.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { MasterData } from '../../types/master-data';
import { Statuskeys } from '../../types/product';
import {
  AttributeValue,
  ProductAttribute,
  ProductAttributeLabels,
  ProductAttributeMessages,
} from './model/product-attribute';
import { CoverageVariantsService } from '../../services/coverage-variants.service';

@Component({
  selector: 'canvas-product-attributes',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    SearchFilterComponent,
    TableComponent,
    CommandsModule,
    CbButtonModule,
    CbSearchInputModule,
    AutoCompleteModule,
    CbIconModule,
    SidebarFormComponent,
    FormsModule,
    CbModalModule,
    CbTooltipModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './product-attributes.component.html',
  styleUrls: ['./product-attributes.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProductAttributesComponent implements OnInit {
  attributes!: ProductAttribute[];
  attributesCopy!: ProductAttribute[];
  searchedProductAttributes: ProductAttribute[];
  filteredProductAttributes: ProductAttribute[];
  productId!: string;
  productVersionId!: string;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  options: TableOptions;
  attributeModel: ProductAttribute;
  attributeSchema: UIKitNgxFormlyFormJsonSchema;
  attributeColumns: ColumnOptions[];
  labels: ProductAttributeLabels;
  messages: ProductAttributeMessages;
  showDrawer = false;
  isFinalStatus = false;
  isEdit = false;
  disableFeature = false;
  searchVal = '';
  openModal = false;
  openDeleteModal = false;
  selectedAttribute: ProductAttribute;

  showExistingAttributeList: boolean;
  listOptions!: TableOptions;
  fetchTableData = false;
  /**
   * Array to store region  data
   */
  regionSelectedData: MasterData[] = [];
  existingAttributeList: any[];
  selectedPredefineAttributeList: ProductAttribute[] = [];
  openDiscardModal = false;
  searchedPredefineProductAttributes: any;
  copyPredefineAttributeList: AttributeValue[] = [];
  productClasslist: string;
  cbToolTipColorTheme = CbColorTheme.DEFAULT;
  constructor(
    private readonly _layoutService: LayoutService,
    private readonly _sharedService: SharedService,
    private readonly _tableService: TableService,
    private readonly _commands: StudioCommands,
    private readonly _productContextService: ProductContextService,
    private readonly _productService: ProductsService,
    private readonly _appContextService: AppContextService,
    private _utilityService: UtilityService,
    protected readonly _coverageVariantService: CoverageVariantsService
  ) {
    this.productId = localStorage.getItem('productId') || '';
    this.productVersionId = localStorage.getItem('productVersionId') || '';
    this.attributeSchema = <UIKitNgxFormlyFormJsonSchema>(
      this._appContextService.get('pages.product.productAttributes.schema')
    );
    this.attributeColumns = <ColumnOptions[]>(
      this._appContextService.get('pages.product.productAttributes.columns')
    );
    this.labels = <ProductAttributeLabels>(
      this._appContextService.get('pages.product.productAttributes.labels')
    );
    this.messages = <ProductAttributeMessages>(
      this._appContextService.get('pages.product.productAttributes.messages')
    );

    this.listOptions = <TableOptions>(
      this._appContextService.get('pages.product.productAttributes.listOptions')
    );

    this.disableFeature = <boolean>(
      this._appContextService.get(
        'pages.product.productAttributes.disableFeature'
      )
    );

    this._generateOptions();

    this._commands.add('editProductAttribute', {
      commandName: 'editProductAttribute',
      canExecute: () => true,
      execute: (value: { item: ProductAttribute }) => {
        this.selectedAttribute = value.item;
        this._setEditAttribute(value.item);
        return Promise.resolve(true);
      },
    });

    this._commands.add('deleteProductAttribute', {
      commandName: 'deleteProductAttribute',
      canExecute: () => true,
      execute: (value: { item: ProductAttribute }) => {
        this.selectedAttribute = value.item;
        this.openDeleteModal = true;
        return Promise.resolve(true);
      },
    });

    this._commands.add('updateAttributeCommand', {
      commandName: 'updateAttributeCommand',
      canExecute: (parameter) => {
        return !isEmpty(parameter);
      },
      execute: (
        value: { rowIndex: number; toggleValue: boolean },
        parameter: {
          component: { item: ProductAttribute; column: { fieldName: string } };
        }
      ) => {
        this._handleToggleChange(value, parameter.component);
        return Promise.resolve(true);
      },
    });

    if (this._productContextService.isProductDisabled()) {
      this.isFinalStatus = true;
    }
  }

  ngOnInit(): void {
    this.getCoverageVariants(this.productId, this.productVersionId);
    this._updateDataTypes();
    this._updateLayout();
    this._updateAttributeName();
  }

  private _generateOptions() {
    const columns = cloneDeep(this.attributeColumns);
    const disableEdit = this._productContextService.isProductDisabled();
    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [15, 30, 50, 100],
      columns: disableEdit
        ? columns.map((combo) => {
            if (combo.fieldName === 'action') {
              combo.actions = combo.actions?.map((act) => {
                act = {
                  ...act,
                  disabled: act.label === 'Delete',
                  label: act.label === 'Edit' ? 'View' : act.label,
                  icon: act.label === 'Edit' ? 'pi pi-eye' : act.icon,
                };
                return act;
              });
            }
            return combo;
          })
        : columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
  }

  searchProductAttribute(event: any) {
    const query = event.query?.toLowerCase() || '';
    if (query.length === 0) {
      this.attributes = cloneDeep(this.attributesCopy);
      return;
    } else if (query.length < 3) {
      this.attributes = cloneDeep(this.attributesCopy);
      return;
    } else {
      const filtered: ProductAttribute[] = [];
      for (let i = 0; i < this.attributesCopy.length; i++) {
        const name = this.attributesCopy[i].attrName?.toLowerCase() || '';
        const type = this.attributesCopy[i].type?.toLowerCase() || '';
        if (name.includes(query) || type.includes(query)) {
          filtered.push(this.attributesCopy[i]);
        }
      }
      this.attributes = cloneDeep(filtered);
    }
  }

  searchPredefineProductAttribute(event: any) {
    const query = event.query?.toLowerCase() || '';
    if (query.length === 0) {
      this.existingAttributeList = cloneDeep(this.copyPredefineAttributeList);
      return;
    } else if (query.length < 3) {
      this.existingAttributeList = cloneDeep(this.copyPredefineAttributeList);
      return;
    } else {
      const filtered: AttributeValue[] = [];
      for (let i = 0; i < this.copyPredefineAttributeList.length; i++) {
        const description =
          this.copyPredefineAttributeList[
            i
          ].attributeDescription?.toLowerCase() || '';
        const type =
          this.copyPredefineAttributeList[i].datatype?.toLowerCase() || '';
        const category =
          this.copyPredefineAttributeList[i].category?.toLowerCase() || '';
        if (
          description.includes(query) ||
          type.includes(query) ||
          category.includes(query)
        ) {
          filtered.push(this.copyPredefineAttributeList[i]);
        }
      }
      this.existingAttributeList = cloneDeep(filtered);
    }
  }

  onSearchClear(event: any) {
    this.attributes = cloneDeep(this.attributesCopy);
    this.existingAttributeList = cloneDeep(this.copyPredefineAttributeList);
  }

  getCoverageVariants(_productId?: string, _productVersionId?: string): void {
    this._coverageVariantService
      .getCoverageVariants(_productId, _productVersionId)
      .subscribe({
        next: (data) => {
          const coverageVariants = data.map((data) => data.productClass);
          const productClass = [
            ...new Set(coverageVariants.map((val) => val?.value)),
          ];
          const productClassString = productClass.join(',');
          this.productClasslist = productClassString;
          this._getProductAttributes();
        },
        error: (e) => {
          this._layoutService.showMessage(e);
        },
      });
  }

  getAttributeList(productClass: string) {
    this._utilityService.getPredefinedAttributeList(productClass).subscribe({
      next: (response) => {
        if (response.length > 0) {
          let predefineAttrValues: AttributeValue[] = response
            .map((item) => item.predefinedAttrValues)
            .flat();

          predefineAttrValues = Array.from(
            new Map(
              predefineAttrValues.map((attr) => [attr.attributeId, attr])
            ).values()
          );

          const existingAttributeList: any = predefineAttrValues;
          if (!this.attributes) {
            this.attributes = [];
          }
          const attribute = existingAttributeList.filter(
            (existingAttr: any) =>
              !this.attributes.some(
                (attr) => attr.attrName === existingAttr.attributeDescription
              )
          );
          this.existingAttributeList = attribute;
          this.copyPredefineAttributeList = this.existingAttributeList;
        }
      },
      error: (err) => {
        this._layoutService.showMessage(err);
      },
    });
  }

  onRowSelected(event: any) {
    this.selectedPredefineAttributeList = event;
  }

  addPredefineAttribute() {
    const attribute: any = [];
    const eventAttrNames = new Set(
      this.selectedPredefineAttributeList.map((item: any) => item.attributeId)
    );
    const selectedTableRowData = this.existingAttributeList.filter(
      (existingItem) => eventAttrNames.has(existingItem.attributeId)
    );
    selectedTableRowData.forEach((item: any) => {
      const newAttribute = {
        attrName: item.attributeDescription || '',
        required: item.required || false,
        doNotAllowDuplicate: item.doNotAllowDuplicate || false,
        type: item.datatype || '',
        description: item.attributeDescription || '',
        isCurrentVersion: true,
        refDataMappingCategory: item.category,
      };

      attribute.push(newAttribute);
    });

    const payload = {
      requestId: uuidv4(),
      customAttributes: attribute,
    };
    let hasEmptyType = false;

    attribute.forEach((att: any) => {
      if (att.type === '') {
        hasEmptyType = true;
      }
    });

    if (hasEmptyType) {
      this._layoutService.showMessage({
        severity: 'error',
        message: 'Select a data type for the chosen attribute.',
      });
    } else if (this.selectedPredefineAttributeList.length) {
      this._productService
        .savePredefineProductAttribute(
          this.productId,
          this.productVersionId,
          payload
        )
        .subscribe({
          next: () => {
            this._layoutService.showMessage(this.messages?.save?.success);
            this._getProductAttributes();
            this.showExistingAttributeList = false;
          },
          error: () => {
            this._layoutService.showMessage(this.messages?.save?.error);
          },
        });
    }
  }

  confirmDiscardAttributeAndExit() {
    this.openDiscardModal = true;
  }

  discardAttributeAndExit() {
    this.showExistingAttributeList = false;
    this.openDiscardModal = false;
  }

  onCreateAttribute(): void {
    this.showExistingAttributeList = false;
    this.isEdit = false;
    const attributeNameField =
      this.attributeSchema?.properties?.['attrName']?.widget?.formlyConfig;
    if (attributeNameField && attributeNameField.props) {
      attributeNameField.props.disabled = false;
    }
    const answersConfig =
      this.attributeSchema.properties?.['answers']?.widget?.formlyConfig;
    if (answersConfig) {
      answersConfig.hide = true;
    }
    this.attributeModel = {
      attrName: '',
      required: false,
      doNotAllowDuplicate: false,
      type: '',
      policyAssociation: '',
      isCurrentVersion: true,
    };
    this.toggleDrawer(true);
  }

  saveProductAttribute(data: ProductAttribute): void {
    const payload = {
      requestId: uuidv4(),
      customAttributes: { ...data },
    };
    const existingAttr = this.attributes.find(
      (attr) =>
        attr.description?.toLocaleLowerCase() ===
        data.attrName?.toLocaleLowerCase()
    );
    if (existingAttr && !this.isEdit) {
      this._layoutService.showMessage({
        severity: 'error',
        message: `Attribute '${data.attrName}' already exist in product.`,
        duration: 5000,
      });
    } else {
      if (!this.isEdit) {
        this._productService
          .saveProductAttribute(this.productId, this.productVersionId, payload)
          .subscribe({
            next: () => {
              this._layoutService.showMessage(this.messages?.save?.success);
              this._getProductAttributes();
            },
            error: (e) => {
              if (!isEmpty(e?.error?.errors?.['PMERR000084'])) {
                const message =
                  e.error.errors['PMERR000084']?.[0] ??
                  this.messages.attributeExistsError;
                this._layoutService.showMessage({
                  severity: 'error',
                  message,
                });
              } else {
                this._layoutService.showMessage(this.messages?.save?.error);
              }
            },
          });
      } else {
        payload.customAttributes.attrName = this.selectedAttribute.attrName;
        this._productService
          .editProductAttribute(
            this.productId,
            this.productVersionId,
            payload,
            data.attrId || ''
          )
          .subscribe({
            next: () => {
              this._layoutService.showMessage(this.messages?.edit?.success);
              this._getProductAttributes();
            },
            error: () => {
              this._layoutService.showMessage(this.messages?.edit?.error);
            },
          });
      }
    }
  }

  next(): void {
    this._sharedService.nextButtonClicked.next({ stepCount: 1 });
  }
  previous(): void {
    this._sharedService.previousButtonClicked.next({ stepCount: 1 });
  }

  toggleDrawer(event: boolean): void {
    this.showDrawer = event;
  }

  private _deleteProductAttribute(value: ProductAttribute): void {
    this._productService
      .deleteProductAttribute(
        this.productId,
        this.productVersionId,
        value?.attrId || ''
      )
      .subscribe({
        next: () => {
          this._layoutService.showMessage(this.messages?.delete?.success);
          this._getProductAttributes();
        },
        error: (e) => {
          if (!isEmpty(e?.error?.errors?.['PMERR000407'])) {
            this.openModal = true;
          } else {
            this._layoutService.showMessage(this.messages?.delete?.error);
          }
        },
      });
    this.openDeleteModal = false;
  }

  private _handleToggleChange(
    data: { rowIndex: number; toggleValue: boolean },
    row: { item: ProductAttribute; column: { fieldName: string } }
  ): void {
    this._productService
      .editProductAttribute(
        this.productId,
        this.productVersionId,
        { requestId: uuidv4(), customAttributes: row?.item },
        row?.item?.attrId || ''
      )
      .subscribe({
        next: () => {
          this._layoutService.showMessage(this.messages?.edit?.success);
        },
        error: () => {
          if (this.attributes[data.rowIndex]) {
            (<boolean>(
              this.attributes[data.rowIndex][
                row?.column?.fieldName as keyof ProductAttribute
              ]
            )) = !data.toggleValue;
          }
          this._layoutService.showMessage(this.messages?.edit?.error);
        },
      });
  }

  private _getProductAttributes(): void {
    this._productService
      .fetchProductAttributes(this.productId, this.productVersionId)
      .subscribe({
        next: (data) => {
          this.attributes = data.map((item) => {
            return {
              ...item,
              isCurrentVersion: item.isCurrentVersion,
              lockStatus: this.disableFeature
                ? true
                : this._productContextService.isReadonlyProduct(),
              productStatus: this.disableFeature
                ? Statuskeys.FINAL
                : this._productContextService
                    ._getProductContext()
                    ?.status?.toString(),
            };
          });
          this.attributesCopy = cloneDeep(this.attributes);
        },
        error: () => {
          this._layoutService.showMessage(this.messages?.fetch?.error);
        },
      });
  }

  private _setEditAttribute(value: ProductAttribute): void {
    this.isEdit = true;
    const answersConfig =
      this.attributeSchema.properties?.['answers']?.widget?.formlyConfig;
    if (answersConfig && value.type === 'DROPDOWN') {
      answersConfig.hide = false;
    } else {
      if (answersConfig) {
        answersConfig.hide = true;
      }
    }
    this.attributeModel = { ...value };
    const attributeNameField =
      this.attributeSchema?.properties?.['attrName']?.widget?.formlyConfig;
    if (attributeNameField && attributeNameField.props) {
      attributeNameField.props.disabled = true;
    }
    this.toggleDrawer(true);
  }

  private _updateDataTypes(): void {
    const dataTypeField =
      this.attributeSchema?.properties?.['type']?.widget?.formlyConfig;
    if (!isEmpty(dataTypeField)) {
      dataTypeField.hooks = {
        onInit: (field: FormlyFieldConfig) => {
          if (!field.props) {
            field.props = {};
          }
          field.props.options = this._productService.getDataTypes().pipe(
            map((items) => {
              return items.map((type) => {
                return {
                  label: type.description,
                  value: type.code,
                };
              });
            })
          );
        },
      };
    }
  }

  private _updateAttributeName(): void {
    const attributeNameField =
      this.attributeSchema?.properties?.['attrName']?.widget?.formlyConfig;

    if (!isEmpty(attributeNameField)) {
      attributeNameField.hooks = {
        onInit: (field: FormlyFieldConfig) => {
          const maxLengths = {
            STRING: 500,
            DEFAULT: 100,
          };

          field.form?.get('type')?.valueChanges.subscribe((value: string) => {
            const newMaxLength =
              value === 'STRING' ? maxLengths.STRING : maxLengths.DEFAULT;

            field.props = {
              ...field.props,
              maxLength: newMaxLength,
            };
            field.form
              ?.get('attrName')
              ?.setValidators([
                Validators.required,
                Validators.maxLength(newMaxLength),
              ]);

            field.form?.get('attrName')?.updateValueAndValidity();
            field.form?.get('attrName')?.markAllAsTouched();

            const answersConfig =
              this.attributeSchema.properties?.['answers']?.widget
                ?.formlyConfig;
            if (answersConfig) {
              answersConfig.hide = value !== 'DROPDOWN';
            }
            this.attributeSchema = { ...this.attributeSchema };

            const defaultValueConfig =
              this.attributeSchema.properties?.['defaultValue']?.widget
                ?.formlyConfig;
            if (defaultValueConfig) {
              if (value === 'DROPDOWN' || value === 'FILE') {
                defaultValueConfig.hide = true;
              } else {
                defaultValueConfig.hide = false;
              }
            }
          });
        },
      };
    }
  }

  private _updateLayout(): void {
    this._layoutService.updateBreadcrumbs([
      { label: 'Home', routerLink: 'home' },
      { label: 'Products', routerLink: '/products' },
      {
        label: `${this.productId}`,
        routerLink: `/products/${this.productId}/update`,
      },
      {
        label: 'Product attributes',
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }

  handleModal() {
    this.openModal = !this.openModal;
  }

  onConfirm() {
    this.openModal = false;
  }

  handleDeleteModal() {
    this.openDeleteModal = false;
  }

  onDeleteAttribute() {
    this._deleteProductAttribute(this.selectedAttribute);
  }

  onExistingAttribute() {
    this.showExistingAttributeList = true;
    this.getAttributeList(this.productClasslist);
  }

  handleDiscardModal() {
    this.openDiscardModal = false;
  }
}
