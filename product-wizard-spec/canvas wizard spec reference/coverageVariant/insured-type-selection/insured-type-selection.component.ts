import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutComponent, LayoutService } from '@canvas/components';
import {
  CbButtonModule,
  CbColorTheme,
  CbIconModule,
  CbIconSize,
  CbModalModule,
} from '@chubb/ui-components';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';
import { ProductsService } from '../../../services/products.service';
import { VariantLevelService } from '../../../services/variant-level.service';
import { CoverageVariant } from '../../../types/coverage';
import { PolicyType } from '../../../types/policy-configuration';
import { InsuredEventComponent } from '../insured-event/insured-event.component';
import { InsuredObjectComponent } from '../insured-object/insured-object.component';
import { InsuredTypeComponent } from '../insured-type/insured-type.component';

interface TabItem {
  id: string;
  description: string;
  isActive: boolean;
  iconKey: string;
  isDisabled: boolean;
}

@UntilDestroy()
@Component({
  selector: 'canvas-insured-type-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    CbButtonModule,
    ReactiveFormsModule,
    CbIconModule,
    CbModalModule,
    InsuredTypeComponent,
    InsuredObjectComponent,
    InsuredEventComponent,
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './insured-type-selection.component.html',
  styleUrls: ['./insured-type-selection.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InsuredTypeSelectionComponent implements OnInit {
  cbColorTheme = CbColorTheme;
  cbIconSize = CbIconSize;
  productId: string;
  openModal: boolean;
  isDisabled = true;
  clickedTab: TabItem;
  selectedTab: TabItem;
  tabItems: TabItem[] = [
    {
      id: 'individualInsured',
      description: 'Insured individual',
      isActive: true,
      iconKey: 'brand-people-group',
      isDisabled: false,
    },
    {
      id: 'insuredObject',
      description: 'Insured object',
      isActive: false,
      iconKey: 'brand-package',
      isDisabled: false,
    },
    {
      id: 'insuredEvent',
      description: 'Insured event',
      isActive: false,
      iconKey: 'brand-business-lines',
      isDisabled: true,
    },
  ];
  productVersionId: string;
  coverageVariantId: string;
  coverageVariantDetails: CoverageVariant;
  coverageVariantName: string;
  isMicroInsurence: boolean = false;

  constructor(
    private _layoutService: LayoutService,
    private _variantLevelService: VariantLevelService,
    private _productService: ProductsService
  ) {
    this.productId = localStorage?.getItem('productId') || '';
    this.productVersionId = localStorage?.getItem('productVersionId') || '';
    this.coverageVariantId = localStorage?.getItem('coverageVariantId') || '';
    this.coverageVariantName =
      localStorage?.getItem('coverageVariantName') || '';
    this._updateLayout();
  }

  ngOnInit(): void {
    this._variantLevelService
      .getCoverageVariantDetails(
        this.productId,
        this.productVersionId,
        this.coverageVariantId
      )
      .subscribe({
        next: (response) => {
          this.coverageVariantDetails = response;
          if (
            this.coverageVariantDetails.insuredObjects &&
            this.coverageVariantDetails.insuredObjects?.length > 0
          ) {
            this.tabItems.map((ins) => {
              if (ins.id == 'insuredObject') {
                ins.isActive = true;
              }
              if (ins.id == 'individualInsured') {
                ins.isActive = false;
              }
              if (ins.id == 'insuredEvent') {
                ins.isActive = false;
              }

              if (ins.id !== 'individualInsured') {
                this._productService.setInsuredIndividual(false);
              }
            });
          }

          if (
            this.coverageVariantDetails.insuredEvents &&
            this.coverageVariantDetails.insuredEvents?.length > 0
          ) {
            this.tabItems.map((ins) => {
              if (ins.id == 'insuredObject') {
                ins.isActive = false;
              }
              if (ins.id == 'individualInsured') {
                ins.isActive = false;
              }
              if (ins.id == 'insuredEvent') {
                ins.isActive = true;
              }

              if (ins.id !== 'individualInsured') {
                this._productService.setInsuredIndividual(false);
              }
            });
          }
          this.selectedTab =
            this.tabItems.find((item) => item.isActive) || this.tabItems[0];
        },
      });

    this._productService
      .getProduct(this.productId, this.productVersionId)
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        const productDetails = data;
        const policyType = productDetails.lifeCycle?.newPolicy.policyType;
        this.isMicroInsurence = policyType === PolicyType.microInsurance;

        this.setTabDisabled(
          this.tabItems,
          'insuredEvent',
          !this.isMicroInsurence
        );

        if (this.isMicroInsurence) {
          this.setTabActive(this.tabItems, 'insuredEvent');
        }

        this.selectedTab =
          this.tabItems.find((item) => item.isActive) || this.tabItems[0];
      });
  }

  setTabActive(tabItems: TabItem[], activeTabId: string) {
    tabItems.forEach((tab) => {
      tab.isActive = tab.id === activeTabId;
    });
  }

  setTabDisabled(tabItems: TabItem[], tabId: string, isDisabled: boolean) {
    const tab = tabItems.find((t) => t.id === tabId);
    if (tab) tab.isDisabled = isDisabled;
  }

  handleModal() {
    this.openModal = !this.openModal;
  }

  onTabClick(clickedItem: TabItem): void {
    this.clickedTab = clickedItem;
    this.openModal = true;
  }

  onConfirm(): void {
    this.selectedTab = cloneDeep(this.clickedTab);
    this.tabItems.forEach((item) => {
      if (item.id === this.selectedTab.id) {
        item.isActive = true;
      } else {
        item.isActive = false;
      }
    });
    this.openModal = false;
  }

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
        label: `${this.coverageVariantName}`,
        routerLink: `/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`,
      },
      {
        label: 'Insured type',
        routerLink: `/products/${this.productId}/coveragevariant/insuredType`,
        active: true,
      },
    ]);
    this._layoutService.caption$.next('');
  }
}
