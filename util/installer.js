const vscode = require('vscode');
const path = require('path');
const download = require('download-git-repo');

function installSynerexServer (context) {
    const synerexServerPath = path.join(context.extensionPath, "synerex_server/");
    download('synerex/synerex_server', synerexServerPath, {}, err => {
        console.log(err ? 'Error' : 'Success')
    });
}

module.exports = {
	installSynerexServer,
}
