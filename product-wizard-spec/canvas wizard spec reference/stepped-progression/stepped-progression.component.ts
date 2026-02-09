import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutService } from '@canvas/components';
import {
  StepConfiguration,
  SteppedProgressionLabels,
  StepProgressionConfiguration,
  Steps,
} from '@canvas/components/types';
import { AppContextService } from '@canvas/services';
import {
  CbButtonModule,
  CbInlineAlertModule,
  CbProgressTrackerDirective,
  CbProgressTrackerModule,
  CbProgressTrackerOrientation,
  CbSubProgressTrackerDirective,
} from '@chubb/ui-components';
import { isEmpty } from 'lodash-es';
import { Subscription } from 'rxjs';
import { ShowCoverageVariantSubStepsPipe } from '../../pipes/show-coverage-variant-sub-steps.pipe';
import { AvailabilityService } from '../../services/availability.service';
import { ProductContextService } from '../../services/product-context.service';
import { ProductsService } from '../../services/products.service';
import { SharedService } from '../../services/shared.service';
import { CountryCodes } from '../../types/constants';

/**
 * SteppedProgression Component
 */
@Component({
  selector: 'canvas-stepped-progression',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    RouterModule,
    CbProgressTrackerModule,
    CbButtonModule,
    CbInlineAlertModule,
    ReactiveFormsModule,
    FormsModule,
    ShowCoverageVariantSubStepsPipe,
  ],
  templateUrl: './stepped-progression.component.html',
  styleUrl: './stepped-progression.component.scss',
})
export class SteppedProgressionComponent implements OnInit, OnDestroy {
  labels!: SteppedProgressionLabels;
  /**
   * Orientation of the Progress Tracker
   */
  @Input() orientation: CbProgressTrackerOrientation =
    CbProgressTrackerOrientation.VERTICAL;

  /**
   * CbProgressTracker
   */
  @ViewChild(CbProgressTrackerDirective)
  cbProgressTracker!: CbProgressTrackerDirective;

  /**
   * CbSubProgressTracker
   */
  @ViewChild(CbSubProgressTrackerDirective)
  cbSubProgressTracker!: CbSubProgressTrackerDirective;

  config!: StepProgressionConfiguration;

  /**
   * Array of objects that contains step labels
   */
  steps!: Steps[];

  /**
   * Variable for current step
   */
  currentStep = 0;

  /**
   * Variable for current sub step
   */
  currentSubStep = 0;

  PRODUCTS = 'products';
  COVERAGE_VARIANTS = 'Coverage variants';
  COVERAGE_VARIANT_DETAILS = 'Coverage variant details';
  STATE_CONFIGURATION = 'State configuration';
  COVERAGE_FACTORS = 'Coverage factors';
  isCoverageVariantsClicked = false;
  isCoverageVariantDetailsClicked = false;

  routeOrFunction!: string;
  isRoute = false;

  nextButtonSubScription: Subscription;
  previousButtonSubScription: Subscription;

  selectedProductId: string | null;
  coverageVariantId: string | null;

  constructor(
    private readonly _appContext: AppContextService,
    private _activatedRoute: ActivatedRoute,
    private _productService: ProductsService,
    private _sharedService: SharedService,
    private _router: Router,
    private readonly _layoutService: LayoutService,
    private _availabilityService: AvailabilityService,
    private _productContextService: ProductContextService
  ) {
    this.config = <StepProgressionConfiguration>(
      this._appContext.get('pages.product.stepper-configuration')
    );
    this.labels = <SteppedProgressionLabels>(
      this._appContext.get('pages.product.stepper-configuration.labels')
    );
    this.steps = this.config.steps;
  }

  ngOnInit(): void {
    if (localStorage.getItem('productId')) {
      const productId = localStorage.getItem('productId') ?? '';
      this._productContextService.selectedProductId$.next(productId);
    }
    this._productContextService.selectedProductId$.subscribe((productId) => {
      if (!isEmpty(productId)) {
        this.selectedProductId = productId;
        if (this.cbProgressTracker && this.selectedProductId) {
          this.cbProgressTracker.stepper.linear = false;
        }
      }
    });
    this._productContextService.coverageVariantId$.subscribe(
      (coverageVariantId) => {
        if (!isEmpty(coverageVariantId)) {
          this.isCoverageVariantsClicked = false;
        }

        this.coverageVariantId = coverageVariantId;
      }
    );
    this.nextButtonSubScription = this._sharedService
      .getNextButtonClicked()
      .subscribe((res: unknown) => {
        const stepConfig = res as StepConfiguration;
        this.isRouteCheck(stepConfig);
        for (let i = 0; i < stepConfig.stepCount; i++) {
          this.cbProgressTracker.next();
        }
      });
    this.previousButtonSubScription = this._sharedService
      .getPreviousButtonClicked()
      .subscribe((res: unknown) => {
        const stepConfig = res as StepConfiguration;
        this.isRouteCheck(stepConfig);
        for (let i = 0; i < stepConfig.stepCount; i++) {
          this.cbProgressTracker.previous();
        }
      });

    this._layoutService.updateBanner('', []);
  }

  isRouteCheck(res: StepConfiguration) {
    this.isRoute = res.isRoute ?? false;
    if (this.isRoute) {
      this.routeOrFunction = res.routeOrFunction ?? '';
    }
  }

  ngOnDestroy(): void {
    this.nextButtonSubScription.unsubscribe();
    this.previousButtonSubScription.unsubscribe();
    this._availabilityService.removeAvailability();
    this._productContextService.removeLocalStorage();
  }

  onClickEvent($event: any): void {
    if (!isEmpty(this.selectedProductId)) {
      if (
        $event.target.textContent.trim() === this.STATE_CONFIGURATION &&
        this._productService.getSelectedCountry() !== CountryCodes.US
      ) {
        if (this.cbProgressTracker?.stepper?.selectedIndex) {
          this.cbProgressTracker.stepper.selectedIndex = this.currentStep;
        }
        this._layoutService.showMessage({
          severity: 'info',
          message: this.labels.stateError,
        });
        return;
      }

      if (
        $event.target.textContent.trim() === this.COVERAGE_FACTORS &&
        !this._productService.isInsuredIndividual()
      ) {
        const subProgressTracker =
          this.cbProgressTracker.cbSubProgressTrackers.get(1);
        if (
          subProgressTracker &&
          subProgressTracker.stepper &&
          typeof subProgressTracker.stepper.selectedIndex !== 'undefined'
        ) {
          subProgressTracker.stepper.selectedIndex = this.currentSubStep;
        }
        this._layoutService.showMessage({
          severity: 'info',
          message: this.labels.coverageFactorError,
        });
        return;
      }
      this.isCoverageVariantsClicked =
        $event.target.textContent.trim() === this.COVERAGE_VARIANTS;
      this.isCoverageVariantDetailsClicked =
        $event.target.textContent.trim() === this.COVERAGE_VARIANT_DETAILS;
      if (this.isCoverageVariantsClicked) {
        for (let i = this.currentSubStep; i > 0; i--) {
          this.cbProgressTracker.previous();
        }
        this.coverageVariantId = '';
        this._router.navigate([
          `/products/${this.selectedProductId}/coveragevariant`,
        ]);
      }
      if (this.isCoverageVariantDetailsClicked) {
        for (let i = this.currentSubStep; i > 0; i--) {
          this.cbProgressTracker.previous();
        }
        this._router.navigate([
          `/products/${this.selectedProductId}/coveragevariant/edit`,
          this.coverageVariantId,
        ]);
      }
    }
  }

  /**
   * Function to show aler banner based on conditions
   * @param $event number
   */
  onSelectedStepChange($event: number): void {
    if (
      $event == 3 &&
      this._productService.getSelectedCountry() !== CountryCodes.US
    ) {
      return;
    }
    this.currentStep = $event;
    this.navigateToRoute();
  }

  /**
   * Function to show aler banner based on conditions
   * @param $event number
   */
  onSelectedSubStepChange($event: number): void {
    if ($event == 2 && !this._productService.isInsuredIndividual()) {
      this.isRoute = false;
      return;
    }
    this.currentSubStep = $event;
    this.navigateToRoute();
  }

  navigateToRoute(): void {
    let routeOrFunction = this.PRODUCTS;
    if (this.steps[this.currentStep]) {
      if (
        this.steps[this.currentStep].subSteps &&
        this.steps[this.currentStep].subSteps?.[this.currentSubStep]
      ) {
        routeOrFunction =
          this.steps[this.currentStep].subSteps?.[this.currentSubStep]
            .routeOrFunction ?? this.PRODUCTS;
      } else {
        routeOrFunction =
          this.steps[this.currentStep].routeOrFunction ?? this.PRODUCTS;
      }
    }
    if (this.isRoute && routeOrFunction != this.PRODUCTS) {
      routeOrFunction = this.routeOrFunction;
    }
    if (
      !(
        this.currentStep == 4 &&
        this.currentSubStep == 0 &&
        !this._productService.isInsuredIndividual() &&
        !this.isRoute
      )
    ) {
      this._router.navigate([routeOrFunction], {
        relativeTo: this._activatedRoute,
      });
    }
  }
}
