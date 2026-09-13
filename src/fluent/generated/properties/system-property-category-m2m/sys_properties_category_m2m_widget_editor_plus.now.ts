import { Record } from '@servicenow/sdk/core'
import { widgetEditorPlusPropertiesCategory } from '../system-property-category/sys_properties_category_widget_editor_plus.now'
import { recordLimitProperty } from '../system-property/sys_properties_ad6ba1d936344db993031b6e49532e2b.now'
import { widgetFieldsProperty } from '../system-property/sys_properties_7e8518328358031070b8b5dfeeaad3e7.now'
import { widgetDeprecatedProperty } from '../system-property/sys_properties_c29658b28358031070b8b5dfeeaad368.now'
import { widgetRelatedListExclusionsProperty } from '../system-property/sys_properties_abbb004383d4831070b8b5dfeeaad365.now'
import { cssVariablesProperty } from '../system-property/sys_properties_ad059fa1832fb61070b8b5dfeeaad32d.now'
import { scssVariablesProperty } from '../system-property/sys_properties_76c6cf9d8373b25070b8b5dfeeaad332.now'
import { exportBlocklistTablesProperty } from '../system-property/sys_properties_2a53a6eee23c02acb367213f0fe8354b.now'
import { exportBlocklistPrefixesProperty } from '../system-property/sys_properties_e26f703f034ce59c0206c4d0d01dc9ea.now'
import { tableConfigSpPageProperty } from '../system-property/sys_properties_f91740c6c1e13b438184f89dcda190f3.now'
import { tableConfigSpWidgetProperty } from '../system-property/sys_properties_ddc826d817f6a12c269d286eed1516a0.now'
import { tableConfigScCatItemProducerProperty } from '../system-property/sys_properties_da811618df6a0d5638a57943ad21bbfe.now'
import { tableConfigSyseventEmailActionProperty } from '../system-property/sys_properties_8a5c13b3b97552475d762496f01876c2.now'
import { tableConfigSpAngularProviderProperty } from '../system-property/sys_properties_widget_editor_table_config_sp_angular_provider.now'
import { tableConfigSysSecurityAclProperty } from '../system-property/sys_properties_widget_editor_table_config_sys_security_acl.now'
import { tableConfigSysUiActionProperty } from '../system-property/sys_properties_widget_editor_table_config_sys_ui_action.now'

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-record-limit'],
    table: 'sys_properties_category_m2m',
    data: {
        property: recordLimitProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 100,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-widget-fields'],
    table: 'sys_properties_category_m2m',
    data: {
        property: widgetFieldsProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 200,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-widget-deprecated'],
    table: 'sys_properties_category_m2m',
    data: {
        property: widgetDeprecatedProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 300,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-widget-related-list-exclusions'],
    table: 'sys_properties_category_m2m',
    data: {
        property: widgetRelatedListExclusionsProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 400,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-css-variables'],
    table: 'sys_properties_category_m2m',
    data: {
        property: cssVariablesProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 500,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-scss-variables'],
    table: 'sys_properties_category_m2m',
    data: {
        property: scssVariablesProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 600,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-export-blocklist-tables'],
    table: 'sys_properties_category_m2m',
    data: {
        property: exportBlocklistTablesProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 700,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-export-blocklist-prefixes'],
    table: 'sys_properties_category_m2m',
    data: {
        property: exportBlocklistPrefixesProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 800,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sp-page'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSpPageProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 900,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sp-widget'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSpWidgetProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1000,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sc-cat-item-producer'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigScCatItemProducerProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1100,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sysevent-email-action'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSyseventEmailActionProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1200,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sp-angular-provider'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSpAngularProviderProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1300,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sys-security-acl'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSysSecurityAclProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1400,
    },
})

Record({
    $id: Now.ID['widget-editor-plus-category-m2m-table-config-sys-ui-action'],
    table: 'sys_properties_category_m2m',
    data: {
        property: tableConfigSysUiActionProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 1500,
    },
})
