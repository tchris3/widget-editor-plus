import { Property } from '@servicenow/sdk/core'

export const codeSearchDisplayFieldsSpPageProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-page'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_page',
    value: '',
    description: 'Comma-separated sp_page fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSpWidgetProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-widget'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_widget',
    value: '',
    description: 'Comma-separated sp_widget fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsScCatItemProducerProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sc-cat-item-producer'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sc_cat_item_producer',
    value: '',
    description: 'Comma-separated sc_cat_item_producer fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSyseventEmailActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sysevent-email-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sysevent_email_action',
    value: '',
    description: 'Comma-separated sysevent_email_action fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSpAngularProviderProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sp-angular-provider'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sp_angular_provider',
    value: '',
    description: 'Comma-separated sp_angular_provider fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysSecurityAclProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-security-acl'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_security_acl',
    value: 'type,operation',
    description: 'Comma-separated sys_security_acl fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})

export const codeSearchDisplayFieldsSysUiActionProperty = Property({
    $id: Now.ID['widget-editor-code-search-display-fields-sys-ui-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.display_fields.sys_ui_action',
    value: '',
    description: 'Comma-separated sys_ui_action fields to display in Code Search result record headers.',
    ignoreCache: true,
    roles: { read: ['sp_admin'] },
})
