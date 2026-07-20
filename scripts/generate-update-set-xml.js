const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generateSysId() {
    return crypto.randomBytes(16).toString('hex');
}

function getJavaHashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

const TABLE_TYPE_MAP = {
    'sp_widget': 'Widget',
    'sys_ui_page': 'UI Page',
    'sys_ui_script': 'UI Script',
    'sys_script_include': 'Script Include',
    'sys_script_client': 'Client Script',
    'sys_properties': 'System Property',
    'sys_ui_action': 'UI Action',
    'sys_security_acl': 'Access Control',
    'sys_security_acl_role': 'Access Control Role',
    'sys_app_module': 'Module',
    'sys_module': 'EcmaScript Module',
    'sys_app': 'Application'
};

function main() {
    const rootDir = path.resolve(__dirname, '..');
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const appVersion = pkg.version;
    const appName = 'Widget Editor+';
    const distAppDir = path.join(rootDir, 'dist', 'app');
    const targetDir = path.join(rootDir, 'target');

    if (!fs.existsSync(distAppDir)) {
        console.error(`Error: dist/app directory does not exist. Run 'npm run build' first.`);
        process.exit(1);
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const remoteSysId = generateSysId();
    const updateSetSysId = generateSysId();
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

    let xml = `<?xml version="1.0" encoding="UTF-8"?><unload unload_date="${formattedDate}">\n`;
    
    // sys_remote_update_set header
    xml += `<sys_remote_update_set action="INSERT_OR_UPDATE">\n`;
    xml += `<application display_value="Global">global</application>\n`;
    xml += `<application_name>Global</application_name>\n`;
    xml += `<application_scope>global</application_scope>\n`;
    xml += `<application_version/>\n`;
    xml += `<collisions/>\n`;
    xml += `<commit_date/>\n`;
    xml += `<deleted/>\n`;
    xml += `<description> </description>\n`;
    xml += `<inserted/>\n`;
    xml += `<name>${appName} (${appVersion})</name>\n`;
    xml += `<origin_sys_id/>\n`;
    xml += `<parent display_value=""/>\n`;
    xml += `<release_date/>\n`;
    xml += `<remote_base_update_set display_value=""/>\n`;
    xml += `<remote_parent_id/>\n`;
    xml += `<remote_sys_id>${remoteSysId}</remote_sys_id>\n`;
    xml += `<state>loaded</state>\n`;
    xml += `<summary/>\n`;
    xml += `<sys_class_name>sys_remote_update_set</sys_class_name>\n`;
    xml += `<sys_created_by>admin</sys_created_by>\n`;
    xml += `<sys_created_on>${formattedDate}</sys_created_on>\n`;
    xml += `<sys_id>${updateSetSysId}</sys_id>\n`;
    xml += `<sys_mod_count>0</sys_mod_count>\n`;
    xml += `<sys_updated_by>admin</sys_updated_by>\n`;
    xml += `<sys_updated_on>${formattedDate}</sys_updated_on>\n`;
    xml += `<update_set display_value=""/>\n`;
    xml += `<update_source display_value=""/>\n`;
    xml += `<updated/>\n`;
    xml += `</sys_remote_update_set>\n`;

    function walk(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                if (!file.includes('author_elective_update')) {
                    results = results.concat(walk(file));
                }
            } else if (file.endsWith('.xml')) {
                results.push(file);
            }
        });
        return results;
    }

    const xmlFiles = walk(distAppDir);
    console.log(`Generating Update Set XML from ${xmlFiles.length} dist records...`);

    xmlFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8').trim();
        
        const updateNameMatch = content.match(/<sys_update_name>(.*?)<\/sys_update_name>/);
        const sysNameMatch = content.match(/<sys_name>(.*?)<\/sys_name>/) || content.match(/<name>(.*?)<\/name>/);
        const tableMatch = content.match(/<record_update table="([^"]+)">/);

        const table = tableMatch ? tableMatch[1] : '';
        const updateName = updateNameMatch ? updateNameMatch[1] : path.basename(file, '.xml');
        const targetName = sysNameMatch ? sysNameMatch[1] : updateName;
        const type = TABLE_TYPE_MAP[table] || table || 'Custom Record';

        const entrySysId = generateSysId();
        const payloadHash = getJavaHashCode(content);

        xml += `<sys_update_xml action="INSERT_OR_UPDATE">\n`;
        xml += `<action>INSERT_OR_UPDATE</action>\n`;
        xml += `<application display_value="Widget Editor+">d65bb60783e7321070b8b5dfeeaad3b2</application>\n`;
        xml += `<category>customer</category>\n`;
        xml += `<comments/>\n`;
        xml += `<name>${updateName}</name>\n`;
        xml += `<payload>${escapeXml(content)}</payload>\n`;
        xml += `<payload_hash>${payloadHash}</payload_hash>\n`;
        xml += `<remote_update_set display_value="${appName} (${appVersion})">${updateSetSysId}</remote_update_set>\n`;
        xml += `<replace_on_upgrade>false</replace_on_upgrade>\n`;
        xml += `<sys_created_by>admin</sys_created_by>\n`;
        xml += `<sys_created_on>${formattedDate}</sys_created_on>\n`;
        xml += `<sys_id>${entrySysId}</sys_id>\n`;
        xml += `<sys_mod_count>0</sys_mod_count>\n`;
        xml += `<sys_recorded_at>19f7fb59e130000001</sys_recorded_at>\n`;
        xml += `<sys_updated_by>admin</sys_updated_by>\n`;
        xml += `<sys_updated_on>${formattedDate}</sys_updated_on>\n`;
        xml += `<table/>\n`;
        xml += `<target_name>${escapeXml(targetName)}</target_name>\n`;
        xml += `<type>${type}</type>\n`;
        xml += `<update_domain>global</update_domain>\n`;
        xml += `<update_guid/>\n`;
        xml += `<update_guid_history/>\n`;
        xml += `</sys_update_xml>\n`;
    });

    xml += `</unload>\n`;

    const outputFileName = `sys_remote_update_set_widget_editor_plus_${appVersion.replace(/\./g, '_')}.xml`;
    const outputPath = path.join(targetDir, outputFileName);
    fs.writeFileSync(outputPath, xml);

    console.log(`Update Set XML created successfully: ${outputPath}`);
}

main();
