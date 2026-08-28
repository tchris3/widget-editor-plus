import { Record } from '@servicenow/sdk/core'

export const widgetEditorPlusPropertiesCategory = Record({
    $id: Now.ID['widget-editor-plus-properties-category'],
    table: 'sys_properties_category',
    data: {
        name: 'Widget Editor+',
    },
})
