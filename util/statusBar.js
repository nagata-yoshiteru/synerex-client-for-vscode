const vscode = require('vscode');

const statusList = [
    { attr: 'Synerex', label: 'SxSrv', status: 'loading', item: null, cmd: 'synerexClient.startSynerex' },
    { attr: 'Node', label: 'NodeSrv', status: 'loading', item: null, cmd: 'synerexClient.startNode' },
];

function setStatus({attr, status}){
    statusList.forEach( v => {
        if (v.attr === attr) v.status = status;
    });
    showStatus();
}

function showStatus() {
    statusList.forEach( v => {
        if (v.item) v.item.dispose();
        v.item = vscode.window.createStatusBarItem();
        v.item.command = (v.status === 'play' || v.status === 'debug-start') ? v.cmd.replace('start', 'stop') : v.cmd;
        v.item.text = v.label + '$(' + v.status + ')';
        v.item.show();
    });
}

module.exports = {
	setStatus,
	showStatus
}
