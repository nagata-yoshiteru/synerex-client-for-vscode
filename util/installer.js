const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const clone = require('git-clone');
const statusBar = require('./statusBar');
const isWin = process.platform === 'win32';
const { sxClient } = require('../const');

const getSrvPath = (context, srv) => path.join(context.storageUri.fsPath, srv.repo, srv.binary + (isWin ? ".exe" : ""));
const getSrvExec = (srv) => "." + (isWin ? "\\" : "/") + srv.binary + (isWin ? ".exe" : "");
const getSrvDir = (context, srv) => path.join(context.storageUri.fsPath, srv.repo);

function isSrvInstalled(context, srv) {
    const srvPath = getSrvPath(context, srv);
    try {
        fs.statSync(srvPath);
        return true;
    } catch (error) {
        return false;
    }
}

function installSrv(context, channel, taskList, srv) {
    vscode.window.showInformationMessage('Downloading and Installing ' + srv.name + '...');
    const srvDir = getSrvDir(context, srv);
    statusBar.setStatus({ label: srv.label, status: 'cloud-download', list: taskList });
    clone('https://github.com/synerex/' + srv.repo, srvDir, {}, err => {
        channel.appendLine(err ? 'Downloading github.com/synerex/' + srv.repo + ' Error.' : 'Successfully Downloaded github.com/synerex/' + srv.repo + '.');
        const srvVersion = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.version`);
        vscode.tasks.executeTask(new vscode.Task(
            { type: 'install ' + srv.repo },
            vscode.TaskScope.Workspace,
            srv.name + ' Installation',
            'Synerex Client',
            new vscode.ShellExecution(`git checkout ${srvVersion === "" ? "$(git describe --tags --abbrev=0)" : srvVersion}`, { cwd: srvDir })
        )).then(() => {
            statusBar.setStatus({ label: srv.label, status: 'loading', list: taskList });
            channel.appendLine('Installing ' + srv.name + '...');
        }, () => {
            channel.appendLine('Installing ' + srv.name + ' Failed. (Git)');
        });
    });
}

function installSrvContinue (context, channel, srv) {
    const srvDir = getSrvDir(context, srv);
    vscode.tasks.executeTask(new vscode.Task(
        { type: 'install ' + srv.repo },
        vscode.TaskScope.Workspace,
        srv.name + ' Installation',
        'Synerex Client',
        new vscode.ShellExecution(isWin ? ".\\build.bat" : "make", { cwd: srvDir })
    )).then(() => {

    }, () => {
        channel.appendLine('Installing ' + srv.name + ' Failed. (Build)');
    });
}

module.exports = {
    getSrvPath,
    getSrvDir,
    getSrvExec,
    isSrvInstalled,
    installSrv,
    installSrvContinue,
}
