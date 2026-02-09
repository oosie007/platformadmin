import { ColumnOptions } from '@canvas/components/types';

export const CoverageVariantColumns: ColumnOptions[] = [
  {
    fieldName: 'coverageVariantId',
    caption: 'Coverage variant ID',
    isSortable: true,
  },
  {
    fieldName: 'name',
    caption: 'Coverage variant name',
    isSortable: true,
  },
  {
    fieldName: 'relatedCoverageVariantIds',
    caption: 'Prerequisite variants',
    isSortable: true,
  },
  {
    fieldName: 'coverageCode',
    caption: 'Standard coverage code',
    isSortable: true,
  },
  {
    fieldName: 'updatedBy.name',
    cellComponent: 'tableActions',
    caption: '',
    actionsSpanText: '',
    width: '50px',
    actions: [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        commandToExecute: {
          commandName: 'editCoverageVariant',
          parameter: {
            routeOrFunction: 'coveragevariant/edit',
            type: 'route',
          },
        },
      },
      {
        label: 'Clone',
        icon: 'pi pi-clone',
        commandToExecute: {
          commandName: 'cloneCoverageVariant',
          parameter: {
            routeOrFunction: 'coveragevariant/clone',
            type: 'route',
          },
        },
        rule: {
          field: 'isCurrentVersion',
          operator: 'equalTo',
          values: [true],
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        commandToExecute: {
          commandName: 'deleteCoverageVariant',
          parameter: {
            routeOrFunction: 'coveragevariant/sub-coverage',
            type: 'route',
          },
        },
        rule: {
          field: 'isCurrentVersion',
          operator: 'equalTo',
          values: [true],
        },
      },
      // {
      //   label: 'Update allocation (%)',
      //   icon: 'pi pi-pencil',
      //   commandToExecute: {
      //     commandName: 'updateCoverageVariant',
      //     parameter: {
      //       routeOrFunction: 'coveragevariant/update',
      //       type: 'route',
      //     },
      //   },
      // }
    ],
  },
];
