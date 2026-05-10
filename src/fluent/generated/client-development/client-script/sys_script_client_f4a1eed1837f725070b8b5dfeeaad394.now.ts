import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['f4a1eed1837f725070b8b5dfeeaad394'],
    type: 'onLoad',
    table: 'sys_script_fix',
    script: Now.include('./sys_script_client_f4a1eed1837f725070b8b5dfeeaad394.client.js'),
    name: 'Monaco Editor+',
    description: 'Loads enhancements for Monaco Editor.',
})
