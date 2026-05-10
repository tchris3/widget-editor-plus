import { ClientScript } from '@servicenow/sdk/core'

ClientScript({
    $id: Now.ID['86caa2d583bf725070b8b5dfeeaad3fc'],
    type: 'onLoad',
    table: 'sp_css',
    script: Now.include('./sys_script_client_86caa2d583bf725070b8b5dfeeaad3fc.client.js'),
    name: 'Monaco Editor+',
    description: 'Loads the Monaco Editor as a replacement for the CodeMirror editor.',
})
