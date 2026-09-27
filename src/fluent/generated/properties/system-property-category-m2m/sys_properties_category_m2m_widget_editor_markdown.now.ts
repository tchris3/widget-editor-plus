import { markdownGroupsSysUiActionProperty } from '../system-property/sys_properties_widget_editor_markdown_groups_sys_ui_action.now'
import { Record } from '@servicenow/sdk/core'
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
