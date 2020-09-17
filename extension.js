// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');
const installer = require('./util/installer');
const { srvList } = require('./const');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let deactivating = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "synerex-client-for-vscode" is now active!');
	const channel = vscode.window.createOutputChannel("Synerex Client");
	const enableClient = vscode.workspace.getConfiguration('synerexClient').get('enableClient');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let startClientCommand = vscode.commands.registerCommand('synerexClient.start', () => startSynerexClient(context, channel));
	let stopClientCommand = vscode.commands.registerCommand('synerexClient.stop', () => deactivate());
	let updateServerCommand = vscode.commands.registerCommand('synerexClient.update', () => updateServerStart(context, channel));

	srvList.forEach((srv, i) => {
		srv.enabled = vscode.workspace.getConfiguration('synerexClient').get(srv.type.replace('synerexClient.','') + 'Enabled');
		vscode.commands.registerCommand(srv.cmd, () => {
			startSrv(context, channel, srv);
		});
		vscode.commands.registerCommand(srv.cmd.replace('.start', '.stop'), () => stopTask(i));
	});

	vscode.tasks.onDidEndTask(e => {
		const { task } = e.execution;
		console.log(task);
		srvList.forEach((v, i) => {
			if (v.name === task.name) {
				channel.appendLine('Stopped ' + task.name + '.');
				if (!deactivating) statusBar.setStatus({ label: v.label, status: v.stopping ? 'debug-stop' : 'error', list: srvList });
				v.stopping = false;
				if (v.updating) {
					setTimeout(() => updateServerContinue(context, channel, v), 1000);
				}
			}
			if ((v.name + ' Installation') === task.name) {
				channel.appendLine('Installed ' + v.name + '.');
				runBackgroundTask(context, channel, srvList[i], installer.getSrvPath(context, srvList[i]), installer.getSrvDir(context, srvList[i]));
			}
		});
	});

	vscode.workspace.onDidChangeConfiguration(e => {
		srvList.forEach((srv, i) => {
			srv.enabled = vscode.workspace.getConfiguration('synerexClient').get(srv.type.replace('synerexClient.','') + 'Enabled');
			if (!srv.enabled) stopTask(i);
		});
		statusBar.showStatus(srvList);
		if (e.affectsConfiguration('synerexClient.enableClient')) {
			const enableClient = vscode.workspace.getConfiguration('synerexClient').get('enableClient');
			if (enableClient) startSynerexClient(context, channel);
			else deactivate();
		}
	})

	channel.appendLine('Loaded Synerex Client for VSCode.');

	const enableAutoStart = vscode.workspace.getConfiguration('synerexClient').get('enableAutoStart');
	console.log('synerexClient.enableAutoStart: ', enableAutoStart);

	context.subscriptions.push(startClientCommand);
	context.subscriptions.push(stopClientCommand);
	context.subscriptions.push(updateServerCommand);

	if (enableClient) startSynerexClient(context, channel);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	deactivating = true;
	statusBar.clearStatus(srvList);
	srvList.forEach((_, i) => stopTask(i));
	vscode.window.showInformationMessage('Stopped Synerex Client.');
}

function startSynerexClient(context, channel) {
	deactivating = false;
	statusBar.showStatus(srvList);
	vscode.window.showInformationMessage('Launched Synerex Client!');
	const enableAutoStart = vscode.workspace.getConfiguration('synerexClient').get('enableAutoStart');
	if (enableAutoStart) srvList.forEach(srv => srv.enabled && (!srv.task) ? startSrv(context, channel, srv) : {});
}

function updateServerStart(context, channel) {
	const selections = srvList.map(srv => srv.name);
	vscode.window
		.showQuickPick(selections)
		.then(srvName => {
			const srv = findSrvByName(srvName);
			vscode.window.showInformationMessage("Updating " + srv.name + " ...");
			srv.updating = true;
			if (srv.task) {
				srv.task.terminate();
				srv.task = null;
				srv.stopping = true;
			} else {
				updateServerContinue(context, channel, srv);
			}
		});
}

function updateServerContinue(context, channel, srv) {
	const srvDir = installer.getSrvDir(context, srv);
	vscode.workspace.fs.delete(vscode.Uri.file(srvDir), { recursive: true }).then(() => {
		installer.installSrv(context, channel, srvList, srv);
	}, () => { vscode.window.showErrorMessage("Failed to stop " + srv.name + ".") });
}

function startSrv(context, channel, srv) {
	statusBar.setStatus({ label: srv.label, status: 'loading', list: srvList });
	tcpscan.run({ host: 'localhost', port: srv.port }).then(
		() => {
			vscode.window.showWarningMessage(srv.name + ' seems to be already running.');
			channel.appendLine(srv.name + ' seems to be already running.');
			statusBar.setStatus({ label: srv.label, status: 'warning', list: srvList });
		},
		() => {
			const srvPath = vscode.workspace.getConfiguration('synerexClient').get(srv.type.replace('synerexClient.',''));
			if (!srvPath || srvPath === '') {
				if (installer.isSrvInstalled(context, srv)) {
					runBackgroundTask(context, channel, srv, installer.getSrvPath(context, srv), installer.getSrvDir(context, srv));
				} else {
					statusBar.setStatus({ label: srv.label, status: 'info', list: srvList });
					installer.installSrv(context, channel, srvList, srv);
				}
			} else {
				runBackgroundTask(context, channel, srv, srvPath, path.dirname(srvPath));
			}
		}
	);
}

function runBackgroundTask(context, channel, srv, binaryPath, binaryDir) {
	const newTask = new vscode.Task(
		{ type: srv.type },
		vscode.TaskScope.Workspace,
		srv.name,
		'Synerex Client',
		new vscode.ShellExecution(binaryPath, { cwd: binaryDir })
	);
	newTask.isBackground = true;
	newTask.presentationOptions = {
		clear: true,
		echo: false,
		focus: false,
		reveal: vscode.TaskRevealKind.Never,
	}
	vscode.tasks.executeTask(newTask).then(
		task => {
			srv.task = task;
			channel.appendLine('Started ' + srv.name + '.');
			statusBar.setStatus({ label: srv.label, status: 'debug-start', list: srvList });
		},
		err => {
			channel.appendLine('Cannot start ' + srv.name + '.');
			console.error(err);
			statusBar.setStatus({ label: srv.label, status: 'debug-stop', list: srvList });
		}
	);
}

function stopTask(no) {
	if (srvList[no].task) srvList[no].task.terminate();
	srvList[no].task = null;
	srvList[no].stopping = true;
}

function findSrvByName(srvName) {
	for (let i = 0; i < srvList.length; i++) {
		if (srvList[i].name === srvName) return srvList[i];
	}
	return null;
}

module.exports = {
	activate,
	deactivate
}
