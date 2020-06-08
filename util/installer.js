const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const clone = require('git-clone');
const statusBar = require('./statusBar');
const isWin = process.platform === 'win32';

const getSynerexServerPath = (context) => path.join(context.extensionPath, "synerex_server", "synerex-server" + (isWin ? ".exe" : ""));
const getNodeServerPath = (context) => path.join(context.extensionPath, "synerex_nodeserv", "nodeserv" + (isWin ? ".exe" : ""));

function isSynerexServerInstalled (context) {
    const synerexServerPath = getSynerexServerPath(context);
    try {
        fs.statSync(synerexServerPath);
        return true;
    } catch (error) {
        return false;
    }
}

function isNodeServerInstalled (context) {
    const nodeServerPath = getNodeServerPath(context);
    try {
        fs.statSync(nodeServerPath);
        return true;
    } catch (error) {
        return false;
    }
}

function installSynerexServer (context, channel, taskList) {
    vscode.window.showInformationMessage('Downloading and Installing Synerex Server...');
    const synerexServerPath = path.join(context.extensionPath, "synerex_server/");
    statusBar.setStatus({ attr: 'Synerex', status: 'cloud-download', list: taskList });
    clone('https://github.com/synerex/synerex_server', synerexServerPath, {}, err => {
        channel.appendLine(err ? 'Downloading github.com/synerex/synerex_server Error.' : 'Successfully Downloaded github.com/synerex/synerex_server.');
        vscode.tasks.executeTask(new vscode.Task(
            {type: 'install synerex_server'},
            vscode.TaskScope.Global,
            'Synerex Server Installation',
            'Synerex Client',
            new vscode.ShellExecution("cd " + synerexServerPath + "; .\\build.bat")
        )).then( te => {
            statusBar.setStatus({ attr: 'Synerex', status: 'loading', list: taskList });
            channel.appendLine("Installing Synerex Server...");
        }, err => {
            channel.appendLine("Installing Synerex Server Failed.");
        });
    });
}

function installNodeServer (context, channel, taskList) {
    vscode.window.showInformationMessage('Downloading and Installing Node Server...');
    const nodeServerPath = path.join(context.extensionPath, "synerex_nodeserv/");
    statusBar.setStatus({ attr: 'Node', status: 'cloud-download', list: taskList });
    clone('https://github.com/synerex/synerex_nodeserv', nodeServerPath, {}, err => {
        channel.appendLine(err ? 'Downloading github.com/synerex/synerex_nodeserv Error.' : 'Successfully Downloaded github.com/synerex/synerex_nodeserv.');
        vscode.tasks.executeTask(new vscode.Task(
            {type: 'install synerex_nodeserv'},
            vscode.TaskScope.Global,
            'Node Server Installation',
            'Synerex Client',
            new vscode.ShellExecution("cd " + nodeServerPath + "; .\\build.bat")
        )).then( te => {
            statusBar.setStatus({ attr: 'Node', status: 'sync', list: taskList });
            channel.appendLine("Installing Node Server...");
        }, err => {
            channel.appendLine("Installing Node Server Failed.");
        });
    });
}

module.exports = {
    getSynerexServerPath,
    getNodeServerPath,
    isSynerexServerInstalled,
    isNodeServerInstalled,
    installSynerexServer,
    installNodeServer,
}
