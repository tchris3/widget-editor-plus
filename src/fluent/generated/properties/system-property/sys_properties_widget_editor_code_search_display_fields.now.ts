import { Property } from '@servicenow/sdk/core'

export const codeSearchDisplayFieldsSpPageProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-page'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_page',
    value: 'title',
    description: 'Comma-separated sp_page fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSpWidgetProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-widget'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_widget',
    value: 'id',
    description: 'Comma-separated sp_widget fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsScCatItemProducerProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sc-cat-item-producer'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sc_cat_item_producer',
    value: 'table_name,category',
    description: 'Comma-separated sc_cat_item_producer fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSyseventEmailActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysevent-email-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysevent_email_action',
    value: 'collection,category',
    description: 'Comma-separated sysevent_email_action fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSpAngularProviderProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-angular-provider'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_angular_provider',
    value: 'type',
    description: 'Comma-separated sp_angular_provider fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysSecurityAclProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-security-acl'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_security_acl',
    value: 'type,operation',
    description: 'Comma-separated sys_security_acl fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_action',
    value: 'table',
    description: 'Comma-separated sys_ui_action fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsCatalogScriptClientProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-catalog-script-client'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.catalog_script_client',
    value: 'cat_item,type',
    description: 'Comma-separated catalog_script_client fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsCatalogUiPolicyProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-catalog-ui-policy'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.catalog_ui_policy',
    value: 'catalog_item',
    description: 'Comma-separated catalog_ui_policy fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsCatalogUiPolicyActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-catalog-ui-policy-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.catalog_ui_policy_action',
    value: 'catalog_item,ui_policy,variable',
    description: 'Comma-separated catalog_ui_policy_action fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsItemOptionNewProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-item-option-new'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.item_option_new',
    value: 'cat_item,type',
    description: 'Comma-separated item_option_new fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSpNgTemplateProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-ng-template'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_ng_template',
    value: 'sp_widget',
    description: 'Comma-separated sp_ng_template fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysScriptProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-script'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_script',
    value: 'collection,when',
    description: 'Comma-separated sys_script fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysScriptClientProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-script-client'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_script_client',
    value: 'table,type',
    description: 'Comma-separated sys_script_client fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSyseventEmailTemplateProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysevent-email-template'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysevent_email_template',
    value: 'sys_scope',
    description: 'Comma-separated sysevent_email_template fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSyseventInEmailActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysevent-in-email-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysevent_in_email_action',
    value: 'target_table,type',
    description: 'Comma-separated sysevent_in_email_action fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysTransformMapProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-transform-map'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_transform_map',
    value: 'source_table,target_table',
    description: 'Comma-separated sys_transform_map fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysProcessorProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-processor'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_processor',
    value: 'type,path',
    description: 'Comma-separated sys_processor fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysRelationshipProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-relationship'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_relationship',
    value: 'applies_to,queries_from',
    description: 'Comma-separated sys_relationship fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysautoScriptProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysauto-script'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysauto_script',
    value: 'sys_scope,run_type',
    description: 'Comma-separated sysauto_script fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSyseventScriptActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysevent-script-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysevent_script_action',
    value: 'event_name',
    description: 'Comma-separated sysevent_script_action fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysScriptIncludeProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-script-include'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_script_include',
    value: 'sys_scope',
    description: 'Comma-separated sys_script_include fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiMacroProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-macro'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_macro',
    value: 'sys_scope',
    description: 'Comma-separated sys_ui_macro fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiPageProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-page'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_page',
    value: 'sys_scope,category',
    description: 'Comma-separated sys_ui_page fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiPolicyProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-policy'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_policy',
    value: 'table',
    description: 'Comma-separated sys_ui_policy fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiScriptProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-script'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_script',
    value: 'sys_scope,ui_type',
    description: 'Comma-separated sys_ui_script fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiStyleProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-style'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_style',
    value: 'table,element',
    description: 'Comma-separated sys_ui_style fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysScriptEmailProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-script-email'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_script_email',
    value: 'sys_scope',
    description: 'Comma-separated sys_script_email fields to display in Code Search+ result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})
