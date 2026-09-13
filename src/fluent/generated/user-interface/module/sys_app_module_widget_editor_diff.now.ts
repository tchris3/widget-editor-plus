import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-diff-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        hint: 'Compare side-by-side versions of a record',
        link_type: 'DIRECT',
        mobile_title: 'Compare+',
        mobile_view_name: 'Mobile',
        order: 1473,
        override_menu_roles: true,
        query: 'ui_page.do?sys_id=51ec3d258363b61070b8b5dfeeaad36b',
        require_confirmation: true,
        roles: ['sp_admin'],
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'Compare+',
        uncancelable: false,
    },
})
