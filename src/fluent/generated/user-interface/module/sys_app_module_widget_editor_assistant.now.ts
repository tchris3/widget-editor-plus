import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-assistant-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        link_type: 'DIRECT',
        mobile_title: 'Widget Editor+ Assistant',
        mobile_view_name: 'Mobile',
        order: 1480,
        override_menu_roles: false,
        query: 'ui_page.do?sys_id=584ed242cd934914bffa4b0bb3fb2974',
        require_confirmation: true,
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'Widget Editor+ Assistant',
        uncancelable: false,
    },
})
