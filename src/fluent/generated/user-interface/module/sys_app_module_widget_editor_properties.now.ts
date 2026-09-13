import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-properties-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        link_type: 'DIRECT',
        mobile_title: 'System Properties',
        mobile_view_name: 'Mobile',
        order: 1478,
        override_menu_roles: false,
        query: 'sys_properties_category.do?sys_id=120d01222f6e41e8bf4eaf0c4b73490a',
        require_confirmation: true,
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'System Properties',
        uncancelable: false,
    },
})
