import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CommandsBarComponent,
  LayoutService,
  TableComponent,
} from '@canvas/components';
import {
  ColumnOptions,
  CommandDefinition,
  TableColumnDefinition,
  TableOptions,
} from '@canvas/components/types';
import { TableService } from '@canvas/services';
import {
  CbButtonModule,
  CbColorTheme,
  CbSearchInputModule,
} from '@chubb/ui-components';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { MasterData } from '../../types/product';
import { Questionsdata } from '../../types/question';

@Component({
  selector: 'canvas-questions',
  standalone: true,
  imports: [
    CommonModule,
    CommandsBarComponent,
    TableComponent,
    CbButtonModule,
    CbSearchInputModule,
    AutoCompleteModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './rating-factor-library.component.html',
  styleUrls: ['./rating-factor-library.component.scss'],
})
export class RatingFactorLibraryComponent implements OnInit {
  checkboxcolortheme = CbColorTheme.DEFAULT;
  productId?: string;
  productVersionId?: string;
  protected options!: TableOptions;
  columnDefinitions!: TableColumnDefinition[];
  searchedQuestions: Questionsdata;
  colorTheme: CbColorTheme = CbColorTheme.DEFAULT;
  globalRatingFactorsList: MasterData[];
  columns: ColumnOptions[] = [
    {
      fieldName: 'description',
      caption: 'Rating Factor',
      isSortable: true,
    },
  ];

  constructor(
    private _layoutService: LayoutService,
    private router: Router,

    private _sharedService: SharedService,
    private readonly _tableService: TableService,
    private productService: ProductsService
  ) {
    this._updateLayout();
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

    this.options = <TableOptions>{
      showPaginator: true,
      rowsPerPageOptions: [5, 10, 15, 20, 25],
      columns: this.columns,
      customSort: (event) =>
        this._tableService.nativeSortWithFavoritesPriority(event),
    };
  }

  actions: CommandDefinition[] = [];

  private _updateLayout() {
    this._layoutService.headerStyle$.next('layout__header--product');
    this._layoutService.captionStyle$.next('layout__caption--product');
    this._layoutService.updateBreadcrumbs([
      { label: 'Products', routerLink: '/products' },
      { label: 'Rating factor library' },
    ]);
  }

  ngOnInit(): void {
    this.productService.getProductRatingFactors().subscribe((res) => {
      this.globalRatingFactorsList = res;
    });
  }

  previous(): void {}
}
