import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['0ce26695837f725070b8b5dfeeaad372'],
    type: 'onLoad',
    table: 'sysauto_script',
    script: Now.include('./sys_script_client_0ce26695837f725070b8b5dfeeaad372.client.js'),
    name: 'Monaco Editor+',
    description: 'Loads enhancements for Monaco Editor.',
})
