import { UIKitNgxFormlyFormJsonSchema } from '@chubb/ui-forms';

export const exclusionSchema: UIKitNgxFormlyFormJsonSchema = {
  title: '',
  type: 'object',
  properties: {
    name: {
      title: 'Exclusion name',
      type: 'string',
      description: 'Enter Exclusion Name',
      widget: {
        formlyConfig: {
          props: {
            type: 'text',
            required: true,
            characterCountText: 'Remaining Characters',
            maxCharCount: 100,
            maxLength: 100,
            pattern: '^(?!\\s)[A-Za-z0-9\\-\\s]*$',
          },
          validation: {
            messages: {
              pattern: 'Invalid exclusion name. Only letters, \'\' and \'-\' are allowed.',
            },
          },
        },
      },
    },
    description: {
      title: 'Exclusion description',
      type: 'string',
      widget: {
        formlyConfig: {
          key: 'description',
          type: 'textarea',
          props: {
            required: false,
            layout: 'row',
            characterCountText: 'Remaining Characters',
            maxCharCount: 1000,
            maxLength: 1000,
          },
        },
      },
    },
  }
}