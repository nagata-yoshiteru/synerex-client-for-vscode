const vscode = require('vscode');

function setStatus({attr, status, list}){
    list.forEach( v => {
        if (v.attr === attr) v.status = status;
    });
    showStatus(list);
}

function showStatus(list) {
    list.forEach( v => {
        if (v.item) v.item.dispose();
        v.item = vscode.window.createStatusBarItem();
        v.item.command = (v.status === 'play' || v.status === 'debug-start') ? v.cmd.replace('start', 'stop') : v.cmd;
        v.item.text = v.label + '$(' + v.status + ')';
        v.item.show();
    });
}

module.exports = {
	setStatus,
	// showStatus,
}
