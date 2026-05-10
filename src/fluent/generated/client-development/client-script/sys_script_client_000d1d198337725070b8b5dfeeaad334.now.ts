import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['000d1d198337725070b8b5dfeeaad334'],
    type: 'onLoad',
    table: 'sys_script_include',
    script: Now.include('./sys_script_client_000d1d198337725070b8b5dfeeaad334.client.js'),
    name: 'Monaco Editor+',
    description: 'Loads enhancements for Monaco Editor.',
})
