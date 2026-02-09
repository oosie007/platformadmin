import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation,ChangeDetectorRef, OnInit } from '@angular/core';
import { EntityListConfiguration, FilterFieldFromData, FooterActions } from '@canvas/components/types';
import { LinkCoverageVariantLabels } from './models/coverage-variant.model';
import { AppContextService } from '@canvas/services';
import { EntityListComponent, LayoutService } from '@canvas/components';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ProductContextService } from '../../../services/product-context.service';
import { coverageVariantData } from '../../../types/product-context';
/**
 * linkCoverageComponent contains fetch and update the settings
 *
 * @export
 * @class LinkCoverageVariantComponent
 * @typedef {LinkCoverageVariantComponent}
 */
@Component({
  selector: 'canvas-link-coverage-variant',
  templateUrl: './link-coverage-variant.component.html',
  styleUrl: './link-coverage-variant.component.scss',
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone:true,
  imports: [EntityListComponent]
})
export class LinkCoverageVariantComponent implements OnInit {

    /**
   * it contains configuration details for product attribute
   *
   * @type {!EntityListConfiguration}
   */
    context!: EntityListConfiguration;

    labels!: LinkCoverageVariantLabels;

    fetchTableData = false;
    filterFieldFromData!: FilterFieldFromData[];
    productId:string;
    productVersionId:string;
    coverageVariantId:string;
    productClass:any;
    country:string;
    /**
   * footer actions
   */
  footerActions!: FooterActions;
  currentcoverageVariantData: coverageVariantData={
    country: '',
    coverageVariantId: '',
    coverageVariantName: '',
    standardCoverage: [],
    productClass: '',
    updatedOn: ''
  };
    constructor( private readonly _appContext: AppContextService,
      private _layoutService: LayoutService,
      private cdr: ChangeDetectorRef,
      private _router: ActivatedRoute,
      private route:Router,
      private _productContextService: ProductContextService
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
      this.coverageVariantId=this._productContextService._getCoverageVariantId();
      this._router.queryParams.subscribe(params => 
        {
           this.country = params['country'];
           const productClass = params['productClass'];
         this.productClass=productClass.replace('-', ' ')
        });
      this.context = <EntityListConfiguration>(
        this._appContext.get('pages.linkCoverageVariant.context')
      );
  
      this.labels = <LinkCoverageVariantLabels>(
        this._appContext.get('pages.linkCoverageVariant.labels')
      );
  
      this.filterFieldFromData = <FilterFieldFromData[]>(
        this._appContext.get('pages.linkCoverageVariant.filterFieldFromData')
      );
    
        const entityListConfig=this.context;
         if (entityListConfig.commands?.get) {
          
          entityListConfig.commands.get = {
            commandName: 'GetCoverageDataCommand',
            parameter: {
              url: '/canvas/api/catalyst/CoverageVariantManagement',
              method: 'GET',
              disableCache: true,
              passFilter: true,
              searchFields: [
                "coverageVariantId",
                "coverageVariantName",
                "productClass",
                "country",
                "standardCoverageCode",
                "updatedBy",
                "updatedOn"
              ],
              params: {
                  requestId: uuidv4(),
                  pageIndex: 1,
                  pageSize: 500,
                  sortOrder: "ASC"
              }
              ,
              headers:{
                filter:JSON.stringify({"productClass":[this.productClass], "country":[this.country]})
              },
              isCountry:true,
            },
          };
        }
        this.context=entityListConfig;
   
    }
     /* function to update the layout */
  private _updateLayout() {
    this._layoutService.updateBanner('', []);
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
        label: 'Coverage variant details',
       active:true,
      },
    ]);
    this._layoutService.caption$.next('');
  }
  ngOnInit(): void {
    this.footerActions = {
      showSaveButtonOnFooter: true,
      saveButtonText:'Select variant'
    };
    this.cdr.detectChanges();
    this._updateLayout();
  }
  cancel(){
    const coverageVariantData={
      country: '',
      coverageVariantId: '',
      coverageVariantName: '',
      standardCoverage: [],
      productClass: '',
      updatedOn: ''
    };
    this._productContextService._setCoverageVariantData(
      coverageVariantData
    );
  }
  saveTableData(){
this.linkVariant();
  }
  linkVariant(){
    if(this.coverageVariantId!=null && this.coverageVariantId!=''){
      this.route.navigate([`/products/${this.productId}/coveragevariant/edit/${this.coverageVariantId}`]);
    }
    else{
      this.route.navigate([`/products/${this.productId}/coveragevariant/createcoveragevariant`]);
    }
  
  }

  onSelected(data:any){
    const coverageVariantData =data;
    if(this.currentcoverageVariantData!=null && this.currentcoverageVariantData.coverageVariantId!=coverageVariantData.coverageVariantId){
      this.currentcoverageVariantData=coverageVariantData;
    }
    else{
      this.currentcoverageVariantData={
        country: '',
        coverageVariantId: '',
        coverageVariantName: '',
        standardCoverage: [],
        productClass: '',
        updatedOn: ''
      };
    }
    this._productContextService._setCoverageVariantData(
      this.currentcoverageVariantData
    );
  
  }
}
