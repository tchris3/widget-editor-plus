import { markdownGroupsSysWsDefinitionProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_ws_definition.now'
import { markdownGroupsSysRestMessageProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_rest_message.now'
import { markdownGroupsSysAppApplicationProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_app_application.now'
import { markdownDisplaySpWidgetProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sp_widget.now'
import { markdownDisplayItemOptionNewProperty } from '../system-property/sys_properties_widget_editor_markdown_display_item_option_new.now'
import { markdownDisplaySpPageProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sp_page.now'
import { markdownDisplaySysScriptProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sys_script.now'
import { markdownDisplaySysScriptClientProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sys_script_client.now'
import { markdownDisplaySysUiActionProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sys_ui_action.now'
import { markdownDisplaySysWsOperationProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sys_ws_operation.now'
import { markdownGroupsSysUiActionProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_ui_action.now'
import { Record } from '@servicenow/sdk/core'
import { markdownFormattingProperty } from '../system-property/sys_properties_widget_editor_markdown_formatting.now'
import { markdownDisplaySpInstanceProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sp_instance.now'
import { markdownDisplaySysDictionaryProperty } from '../system-property/sys_properties_widget_editor_markdown_display_sys_dictionary.now'
import { markdownEscapeUnderscoresProperty } from '../system-property/sys_properties_widget_editor_markdown_escape_underscores.now'
import { markdownMaxListLevelsProperty } from '../system-property/sys_properties_widget_editor_markdown_max_list_levels.now'
import { widgetEditorPlusPropertiesCategory } from '../system-property-category/sys_properties_category_widget_editor_plus.now'
import { updateSetMarkdownDisplayProperty } from '../system-property/sys_properties_widget_editor_markdown_display.now'
import { markdownDisplayKbKnowledgeProperty } from '../system-property/sys_properties_widget_editor_markdown_display_kb_knowledge.now'
import { markdownGroupsCatalogUiPolicyProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_catalog_ui_policy.now'
import { markdownGroupsItemOptionNewProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_item_option_new.now'
import { markdownGroupsKbKnowledgeProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_kb_knowledge.now'
import { markdownGroupsScCatItemProducerProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sc_cat_item_producer.now'
import { markdownGroupsSpColumnProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_column.now'
import { markdownGroupsSpContainerProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_container.now'
import { markdownGroupsSpPageProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_page.now'
import { markdownGroupsSpRowProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_row.now'
import { markdownGroupsSpThemeProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_theme.now'
import { markdownGroupsSpWidgetProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sp_widget.now'
import { markdownGroupsSysSecurityAclProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_security_acl.now'
import { markdownGroupsSysUiPolicyProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_ui_policy.now'
import { markdownGroupsSysUserGroupProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_user_group.now'

Record({
    $id: Now.ID['widget-editor-markdown-indicators-property-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownFormattingProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4740,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sp_instance-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySpInstanceProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4780,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sys_dictionary-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySysDictionaryProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4770,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-max-list-levels-property-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownMaxListLevelsProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4760,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-escape-underscores-property-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownEscapeUnderscoresProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4750,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-property-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: updateSetMarkdownDisplayProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4800,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-kb_knowledge-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplayKbKnowledgeProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 4900,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-catalog_ui_policy-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsCatalogUiPolicyProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5000,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-item_option_new-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsItemOptionNewProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5100,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-kb_knowledge-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsKbKnowledgeProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5200,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sc_cat_item_producer-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsScCatItemProducerProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5300,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_column-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpColumnProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5400,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_container-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpContainerProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5500,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_page-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpPageProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5600,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_row-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpRowProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5700,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_theme-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpThemeProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5800,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sp_widget-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSpWidgetProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 5900,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_security_acl-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysSecurityAclProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6000,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_ui_policy-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysUiPolicyProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6100,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_user_group-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysUserGroupProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6200,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_ui_action-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysUiActionProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6400,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_ws_definition-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysWsDefinitionProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6500,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_rest_message-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysRestMessageProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6600,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-groups-sys_app_application-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownGroupsSysAppApplicationProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6700,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sp_widget-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySpWidgetProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6800,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sp_page-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySpPageProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 6900,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sys_script-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySysScriptProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 7000,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sys_script_client-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySysScriptClientProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 7100,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sys_ui_action-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySysUiActionProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 7200,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-sys_ws_operation-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplaySysWsOperationProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 7300,
    },
})

Record({
    $id: Now.ID['widget-editor-markdown-display-item_option_new-category'],
    table: 'sys_properties_category_m2m',
    data: {
        property: markdownDisplayItemOptionNewProperty,
        category: widgetEditorPlusPropertiesCategory,
        order: 7400,
    },
})
