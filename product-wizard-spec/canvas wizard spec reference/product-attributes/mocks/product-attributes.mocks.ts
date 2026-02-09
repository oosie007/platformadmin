export const productAttributesConfigMock = {
    "commands": {
        "createProduct": {
        "commandName": "HttpCommand",
        "parameter": {
            "url": "https://systemx-api-dev.aksnau2dbsn0014701int01.chubbdigital.com/v1/AdminAPI/products",
            "method": "POST"
        }
        }
    },
    "urls": {
        "getReferenceData": "/canvas/api/catalyst/reference-data/categories"
    },
    "productAttributes": {
        "disableFeature": false,
        "columns": [
        {
            "fieldName": "attrName",
            "caption": "Name",
            "isSortable": true
        },
        {
            "fieldName": "type",
            "caption": "Data type",
            "isSortable": true
        },
        {
            "fieldName": "doNotAllowDuplicate",
            "caption": "Duplication",
            "isSortable": true,
            "cellComponent": "toggleCell",
            "additionalProperties": {
            "toggleTheme": "black",
            "readOnlyRule": {
                "operator": "or",
                "rules": [
                {
                    "field": "productStatus",
                    "operator": "equalTo",
                    "values": ["FINAL"]
                },
                {
                    "field": "lockStatus",
                    "operator": "equalTo",
                    "values": [true]
                },
                {
                    "field": "isCurrentVersion",
                    "operator": "equalTo",
                    "values": [false]
                }
                ]
            }
            },
            "actions": [
            {
                "label": "onToggleClick",
                "commandToExecute": {
                "commandName": "updateAttributeCommand"
                }
            }
            ]
        },
        {
            "fieldName": "required",
            "caption": "Required",
            "isSortable": true,
            "cellComponent": "toggleCell",
            "additionalProperties": {
            "toggleTheme": "black",
            "readOnlyRule": {
                "operator": "or",
                "rules": [
                {
                    "field": "productStatus",
                    "operator": "equalTo",
                    "values": ["FINAL"]
                },
                {
                    "field": "lockStatus",
                    "operator": "equalTo",
                    "values": [true]
                },
                {
                    "field": "isCurrentVersion",
                    "operator": "equalTo",
                    "values": [false]
                }
                ]
            }
            },
            "actions": [
            {
                "label": "onToggleClick",
                "commandToExecute": {
                "commandName": "updateAttributeCommand"
                }
            }
            ]
        },
        {
            "fieldName": "action",
            "caption": "",
            "cellComponent": "tableActions",
            "actions": [
            {
                "label": "Edit",
                "icon": "pi pi-pencil",
                "commandToExecute": {
                "commandName": "editProductAttribute"
                },
                "rule": {
                "field": "isCurrentVersion",
                "operator": "equalTo",
                "values": [true]
                }
            },
            {
                "label": "Delete",
                "icon": "pi pi-trash",
                "commandToExecute": {
                "commandName": "deleteProductAttribute"
                },
                "rule": {
                "field": "isCurrentVersion",
                "operator": "equalTo",
                "values": [true]
                }
            }
            ]
        }
        ],
        "schema": {
        "title": "",
        "type": "object",
        "validateForm": true,
        "required": ["name", "type"],
        "properties": {
            "attrId": {
            "title": "Id",
            "type": "string",
            "widget": {
                "formlyConfig": {
                "hide": "true"
                }
            }
            },
            "attrName": {
            "title": "Attribute name",
            "type": "string",
            "widget": {
                "formlyConfig": {
                "props": {
                    "type": "text",
                    "required": true,
                    "characterCountText": "Character count:",
                    "placeholder": "Enter the attribute name",
                    "pattern": "^(?! )[a-zA-Z0-9 ]+(?<! )$"
                },
                "validation": {
                    "messages": {
                    "pattern": "Invalid input. Please enter alphanumeric characters only. Ensure there are no spaces at the beginning or end of the input."
                    }
                }
                }
            }
            },
            "required": {
            "colorTheme": "black",
            "showIcons": true,
            "widget": {
                "formlyConfig": {
                "type": "toggle",
                "defaultValue": false,
                "props": {
                    "toggleOffText": "Required",
                    "toggleOnText": "Required"
                }
                }
            }
            },
            "doNotAllowDuplicate": {
            "colorTheme": "black",
            "showIcons": true,
            "widget": {
                "formlyConfig": {
                "type": "toggle",
                "defaultValue": false,
                "props": {
                    "toggleOffText": "Do not allow duplication",
                    "toggleOnText": "Do not allow duplication"
                }
                }
            }
            },
            "type": {
            "title": "Data type",
            "type": "string",
            "widget": {
                "formlyConfig": {
                "type": "dropdown",
                "props": {
                    "required": true,
                    "options": [],
                    "placeholder": "Select the data type"
                }
                }
            }
            },
            "answers": {
            "type": "array",
            "title": "",
            "widget": {
                "formlyConfig": {
                "props": {
                    "disabled": false,
                    "additionalProperties": {
                    "ignoreWrapper": true
                    }
                },
                "hide": true
                }
            },
            "items": {
                "type": "object",
                "required": ["answerValue", "answerDescription"],
                "properties": {
                "answerValue": {
                    "type": "string",
                    "title": "Answer value"
                },
                "answerDescription": {
                    "type": "string",
                    "title": "Answer description"
                }
                }
            }
            }
        }
        },
        "labels": {
        "title": "Product attributes overview",
        "searchPlaceholder": "Search product attributes...",
        "searchPredefinePlaceholder": "Search predefine product attributes...",
        "createAttributeBtnLabel": "Create",
        "existingAttributeBtnLabel": "Add existing attribute",
        "createDrawerTitle": "Create product attribute",
        "editDrawerTitle": "Edit product attribute",
        "submitBtnLabel": "Save changes",
        "cancelBtnLabel": "Cancel",
        "nextBtnLabel": "Next",
        "backBtnLabel": "Back",
        "predefineAttributeDiscardLabel": "Discard & exit",
        "predefineAttributeAddLabel": "Add attributes"
        },
        "messages": {
        "save": {
            "success": {
            "severity": "success",
            "message": "Product attribute created successfully.",
            "duration": 5000
            },
            "error": {
            "severity": "error",
            "message": "Unable to create product attribute.",
            "duration": 5000
            }
        },
        "edit": {
            "success": {
            "severity": "success",
            "message": "Product attribute updated successfully.",
            "duration": 5000
            },
            "error": {
            "severity": "error",
            "message": "Unable to update product attribute.",
            "duration": 5000
            }
        },
        "delete": {
            "success": {
            "severity": "success",
            "message": "Product attribute deleted successfully.",
            "duration": 5000
            },
            "error": {
            "severity": "error",
            "message": "Unable to delete product attribute.",
            "duration": 5000
            }
        },
        "fetch": {
            "error": {
            "severity": "error",
            "message": "Unable to fetch product attributes.",
            "duration": 5000
            }
        },
        "attributeExistsError": "Attribute already exists in product."
        },
        "listOptions": {
        "showPaginator": true,
        "defaultSortField": "creditCardKey",
        "showRowSelector": true,
        "rowToggler": true,
        "frozenColWidthInRem": 4,
        "defaultSortOrder": -1,
        "rowsPerPageOptions": [10, 20, 30, 50, 100],
        "columns": [
            {
            "fieldName": "attrName",
            "caption": "Attribute name",
            "isSortable": true
            },
            {
            "fieldName": "type",
            "caption": "Data Type",
            "isSortable": false,
            "cellComponent": "dropdownCell",
            "additionalProperties": {
                "listMappingKey": "attributeList",
                "optionLabelKey": "description",
                "optionValueKey": "description",
                "listPlaceholder": "Attribute list",
                "readOnlyKeyMapping": "isPlanDropdownReadOnly",
                "required": true
            }
            },
            {
            "fieldName": "doNotAllowDuplicate",
            "caption": "Duplication",
            "isSortable": true,
            "cellComponent": "toggleCell",
            "additionalProperties": {
                "toggleTheme": "black",
                "readOnlyRule": {
                "operator": "or",
                "rules": [
                    {
                    "field": "productStatus",
                    "operator": "equalTo",
                    "values": ["FINAL"]
                    },
                    {
                    "field": "lockStatus",
                    "operator": "equalTo",
                    "values": [true]
                    }
                ]
                }
            }
            },
            {
            "fieldName": "required",
            "caption": "Required",
            "isSortable": true,
            "cellComponent": "toggleCell",
            "additionalProperties": {
                "toggleTheme": "black",
                "readOnlyRule": {
                "operator": "or",
                "rules": [
                    {
                    "field": "productStatus",
                    "operator": "equalTo",
                    "values": ["FINAL"]
                    },
                    {
                    "field": "lockStatus",
                    "operator": "equalTo",
                    "values": [true]
                    }
                ]
                }
            }
            }
        ],
        "isLazyLoaded": false
        }
    }
  }
  
  export const mockAttribute = {
    attrName: 'Test Attribute',
    type: 'DROPDOWN',
    required: true,
    doNotAllowDuplicate: true,
    isCurrentVersion: true
  };