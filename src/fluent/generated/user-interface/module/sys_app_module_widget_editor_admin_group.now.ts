import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-admin-group-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        link_type: 'SEPARATOR',
        mobile_title: 'Admin',
        mobile_view_name: 'Mobile',
        order: 1476,
        override_menu_roles: false,
        require_confirmation: false,
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'Admin',
        uncancelable: false,
    },
})
