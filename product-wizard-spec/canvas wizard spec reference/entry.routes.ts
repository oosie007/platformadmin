import { Route } from '@angular/router';

export const remoteRoutes: Route[] = [
  // {
  //   path: '',
  //   loadComponent: () => import('../products/products.component').then(mod => mod.ProductsComponent)
  // },
  {
    path: '',
    loadComponent: () =>
      import('../products-v2/products-v2.component').then(
        (mod) => mod.ProductsV2Component
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import(
        '../products/home/stepped-progression/stepped-progression.component'
      ).then((mod) => mod.SteppedProgressionComponent),
    children: [
      {
        path: 'create',
        loadComponent: () =>
          import(
            '../products/home/create-product/create-product.component'
          ).then((mod) => mod.CreateProductComponent),
      },
    ],
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        '../products/home/stepped-progression/stepped-progression.component'
      ).then((mod) => mod.SteppedProgressionComponent),
    children: [
      {
        path: 'update',
        loadComponent: () =>
          import(
            '../products/home/productOverview/product-overview.component'
          ).then((mod) => mod.ProductOverviewComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            '../products/home/create-product/create-product.component'
          ).then((mod) => mod.CreateProductComponent),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('../products/home/availability/availability.component').then(
            (mod) => mod.AvailabilityComponent
          ),
      },
      {
        path: 'policyconfiguration',
        loadComponent: () =>
          import(
            '../products/home/policy-configuration/policy-configuration.component'
          ).then((mod) => mod.PolicyConfigurationComponent),
      },
      {
        path: 'stateconfiguration',
        loadComponent: () =>
          import(
            '../products/home/state-configuration/state-configuration.component'
          ).then((mod) => mod.StateConfigurationComponent),
      },
      {
        path: 'product-attributes',
        loadComponent: () =>
          import(
            '../products/home/product-attributes/product-attributes.component'
          ).then((mod) => mod.ProductAttributesComponent),
      },
      {
        path: 'availability/create',
        loadComponent: () =>
          import(
            '../products/home/availability/create-availability/create-availability.component'
          ).then((mod) => mod.CreateAvailabilityComponent),
      },
      {
        path: 'availability/edit',
        loadComponent: () =>
          import(
            '../products/home/availability/edit-availability/edit-availability.component'
          ).then((mod) => mod.EditAvailabilityComponent),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import(
                '../products/home/availability/edit-availability/edit-availability.component'
              ).then((mod) => mod.EditAvailabilityComponent),
          },
        ],
      },
      {
        path: 'coherentmapping',
        loadComponent: () =>
          import(
            '../products/home/coherentMapping/coherent-mapping.component'
          ).then((mod) => mod.CoherentMappingComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('../documents-v2/documents-v2.component').then(
            (mod) => mod.DocumentsV2Component
          ),
      },
      {
        path: 'coveragevariant',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/coverage-variant.component'
          ).then((mod) => mod.CoverageVariantComponent),
      },
      {
        path: 'coveragevariant/createcoveragevariant',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/create-coverage-variant/create-coverage-variant.component'
          ).then((mod) => mod.CreateCoverageVariantComponent),
      },
      {
        path: 'coveragevariant/linkCoverageVariant',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/link-coverage-variant/link-coverage-variant.component'
          ).then((mod) => mod.LinkCoverageVariantComponent),
      },
      {
        path: 'coveragevariant/coveragevariantlevels',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/coverage-variant-level/coverage-variant-level.component'
          ).then((mod) => mod.CoverageVariantLevelComponent),
      },
      {
        path: 'coveragevariant/exclusions',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/exclusion/exclusion.component'
          ).then((mod) => mod.ExclusionComponent),
      },
      {
        path: 'coveragevariant/inclusions',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/inclusion/inclusion.component'
          ).then((mod) => mod.InclusionComponent),
      },
      {
        path: 'coveragevariant/insuredType',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/insured-type-selection/insured-type-selection.component'
          ).then((mod) => mod.InsuredTypeSelectionComponent),
      },
      {
        path: 'coveragevariant/insuredObject',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/insured-object/insured-object.component'
          ).then((mod) => mod.InsuredObjectComponent),
      },
      {
        path: 'coveragevariant/insuredCombination',
        loadComponent: () =>
          import(
            '../products/home/insured-combination/insured-combination.component'
          ).then((mod) => mod.InsuredCombinationComponent),
      },
      {
        path: 'coveragevariant/insuredObjectCombination',
        loadComponent: () =>
          import(
            '../products/home/insured-object-combination/insured-object-combination.component'
          ).then((mod) => mod.InsuredObjectCombinationComponent),
      },
      {
        path: 'coveragevariant/miVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/mi-variant-level/mi-variant-level.component'
          ).then((mod) => mod.MiVariantLevelComponent),
      },
      {
        path: 'coveragevariant/spouseVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/spouse-variant-level/spouse-variant-level.component'
          ).then((mod) => mod.SpouseVariantLevelComponent),
      },
      {
        path: 'coveragevariant/childVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/child-variant-level/child-variant-level.component'
          ).then((mod) => mod.ChildVariantLevelComponent),
      },
      {
        path: 'coveragevariant/adultVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/adult-variant-level/adult-variant-level.component'
          ).then((mod) => mod.AdultVariantLevelComponent),
      },
      {
        path: 'coveragevariant/objectVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/object-variant-level/object-variant-level.component'
          ).then((mod) => mod.ObjectVariantLevelComponent),
      },
      {
        path: 'coveragevariant/eventVariantLevel',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/event-variant-level/event-variant-level.component'
          ).then((mod) => mod.EventVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/update&type=maininsured',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/mi-variant-level/mi-variant-level.component'
          ).then((mod) => mod.MiVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/update&type=spouse',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/spouse-variant-level/spouse-variant-level.component'
          ).then((mod) => mod.SpouseVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/update&type=child',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/child-variant-level/child-variant-level.component'
          ).then((mod) => mod.ChildVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/update&type=adult',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/adult-variant-level/adult-variant-level.component'
          ).then((mod) => mod.AdultVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/update',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/object-variant-level/object-variant-level.component'
          ).then((mod) => mod.ObjectVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/event',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/event-variant-level/event-variant-level.component'
          ).then((mod) => mod.EventVariantLevelComponent),
      },
      {
        path: 'coveragevariants/:coverageVariantId/variantLevels/:cvLevelId/edit',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/coverage-variant-level/coverage-variant-level.component'
          ).then((mod) => mod.CoverageVariantLevelComponent),
      },
      {
        path: 'coveragevariant/edit',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/edit-coverage-variant/edit-coverage-variant.component'
          ).then((mod) => mod.EditCoverageVariantComponent),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import(
                '../products/home/coverageVariant/edit-coverage-variant/edit-coverage-variant.component'
              ).then((mod) => mod.EditCoverageVariantComponent),
          },
        ],
      },
      {
        path: 'coveragevariant/coverage-code',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/link-standard-coverage/link-standard-coverage.component'
          ).then((mod) => mod.LinkStandardCoverageComponent),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import(
                '../products/home/coverageVariant/link-standard-coverage/link-standard-coverage.component'
              ).then((mod) => mod.LinkStandardCoverageComponent),
          },
        ],
      },
      {
        path: 'coveragevariant/coverageFactors',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/coverage-factors/coverage-factors.component'
          ).then((mod) => mod.CoverageFactorsComponent),
      },
      {
        path: 'coveragevariant/sub-coverage',
        loadComponent: () =>
          import('../products/home/subCoverage/subcoverage.component').then(
            (mod) => mod.SubcoverageComponent
          ),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import('../products/home/subCoverage/subcoverage.component').then(
                (mod) => mod.SubcoverageComponent
              ),
          },
        ],
      },
      {
        path: 'coveragevariant/coverage-variant-level-overview',
        loadComponent: () =>
          import(
            '../products/home/coverageVariant/coverage-variant-levels-overview/coverage-variant-levels-overview.component'
          ).then((mod) => mod.CoverageVariantLevelsOverviewComponent),
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('../products/home/questions/questions.component').then(
            (mod) => mod.QuestionsComponent
          ),
      },
      {
        path: 'questions/overview',
        loadComponent: () =>
          import(
            '../products/home/questions/questionOverview/question-overview.component'
          ).then((mod) => mod.QuestionOverviewComponent),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import(
                '../products/home/questions/questionOverview/question-overview.component'
              ).then((mod) => mod.QuestionOverviewComponent),
          },
        ],
      },
      {
        path: 'questions/createQuestion',
        loadComponent: () =>
          import(
            '../products/home/questions/createQuestion/create-question.component'
          ).then((mod) => mod.CreateQuestionComponent),
      },
      {
        path: 'questions/edit',
        loadComponent: () =>
          import(
            '../products/home/questions/edit-question/edit-question.component'
          ).then((mod) => mod.EditQuestionComponent),
        children: [
          {
            path: ':id',
            loadComponent: () =>
              import(
                '../products/home/questions/edit-question/edit-question.component'
              ).then((mod) => mod.EditQuestionComponent),
          },
        ],
      },
      {
        path: 'ratingfactor-old',
        loadComponent: () =>
          import(
            '../products/home/ratingFactors/rating-factors.component'
          ).then((mod) => mod.RatingFactorsComponent),
      },
      {
        path: 'ratingfactorlib',
        loadComponent: () =>
          import(
            '../products/home/rating-factor-library/rating-factor-library.component'
          ).then((mod) => mod.RatingFactorLibraryComponent),
      },

      {
        path: 'questionmapping',
        loadComponent: () =>
          import(
            '../products/home/coherentMapping/coherent-mapping.component'
          ).then((mod) => mod.CoherentMappingComponent),
      },
      {
        path: 'ratingfactor',
        loadComponent: () =>
          import('../products/home/rating-factor/rating-factor.component').then(
            (mod) => mod.RatingFactorComponent
          ),
      },
      {
        path: 'premium-allocation',
        loadComponent: () =>
          import(
            '../products/home/premium-allocation/premium-allocation.component'
          ).then((mod) => mod.PremiumAllocationComponent),
      },
      {
        path: 'insured',
        loadComponent: () =>
          import('../products/home/insured/insured.component').then(
            (mod) => mod.InsuredComponent
          ),
      },
    ],
  }
];
