const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const clone = require('git-clone');
const statusBar = require('./statusBar');
const isWin = process.platform === 'win32';

const getSrvPath = (context, srv) => path.join(context.extensionPath, srv.repo, srv.binary + (isWin ? ".exe" : ""));
const getSrvDir = (context, srv) => path.join(context.extensionPath, srv.repo);

function isSrvInstalled (context, srv) {
    const srvPath = getSrvPath(context, srv);
    try {
        fs.statSync(srvPath);
        return true;
    } catch (error) {
        return false;
    }
}

function installSrv (context, channel, taskList, srv) {
    vscode.window.showInformationMessage('Downloading and Installing ' + srv.name + '...');
    const srvDir = getSrvDir(context, srv);
    statusBar.setStatus({ attr: srv.attr, status: 'cloud-download', list: taskList });
    clone('https://github.com/synerex/' + srv.repo, srvDir, {}, err => {
        channel.appendLine(err ? 'Downloading github.com/synerex/' + srv.repo + ' Error.' : 'Successfully Downloaded github.com/synerex/' + srv.repo + '.');
        vscode.tasks.executeTask(new vscode.Task(
            {type: 'install ' + srv.repo},
            vscode.TaskScope.Global,
            srv.name + ' Installation',
            'Synerex Client',
            new vscode.ShellExecution(".\\build.bat", { cwd: srvDir })
        )).then( te => {
            statusBar.setStatus({ attr: srv.attr, status: 'loading', list: taskList });
            channel.appendLine('Installing ' + srv.name + '...');
        }, err => {
            channel.appendLine('Installing ' + srv.name + ' Failed.');
        });
    });
}

module.exports = {
    getSrvPath,
    isSrvInstalled,
    installSrv,
}
