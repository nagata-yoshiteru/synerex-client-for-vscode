// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');
const installer = require('./util/installer');
const { sxClient, srvList } = require('./const');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let deactivating = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "synerex-client-for-vscode" is now active!');
	const channel = vscode.window.createOutputChannel("Synerex Client");
	const enableClient = vscode.workspace.getConfiguration(sxClient).get('enableClient');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let startClientCommand = vscode.commands.registerCommand(`${sxClient}.start`, () => startSynerexClient(context, channel));
	let stopClientCommand = vscode.commands.registerCommand(`${sxClient}.stop`, () => deactivate());
	let reinstallServerCommand = vscode.commands.registerCommand(`${sxClient}.reinstall`, () => reinstallServerStart(context, channel));

	srvList.forEach((srv, i) => {
		srv.enabled = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.enabled`);
		srv.enableAutoStart = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.enableAutoStart`);
		vscode.commands.registerCommand(srv.cmd, () => {
			startSrv(context, channel, srv);
		});
		vscode.commands.registerCommand(srv.cmd.replace('.start', '.stop'), () => stopTask(i));
	});

	vscode.tasks.onDidEndTask(e => {
		const { task } = e.execution;
		console.log(task);
		srvList.forEach((srv, i) => {
			if (srv.name === task.name) {
				channel.appendLine('Stopped ' + task.name + '.');
				if (!deactivating) statusBar.setStatus({ label: srv.label, status: srv.stopping ? 'debug-stop' : 'error', list: srvList });
				srv.stopping = false;
				if (srv.reinstalling) {
					setTimeout(() => reinstallServerContinue(context, channel, srv), 1000);
				}
			}
			if ((srv.name + ' Installation') === task.name) {
				if (!installer.isSrvInstalled(context, srv)) {
					installer.installSrvContinue(context, channel, srv);
				} else {
					channel.appendLine('Installed ' + srv.name + '.');
					runBackgroundTask(context, channel, srvList[i], installer.getSrvPath(context, srvList[i]), installer.getSrvDir(context, srvList[i]));
				}
			}
		});
	});

	vscode.workspace.onDidChangeConfiguration(e => {
		srvList.forEach((srv, i) => {
			srv.enabled = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.enabled`);
			srv.enableAutoStart = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.enableAutoStart`);
			if (!srv.enabled) stopTask(i);
			if (e.affectsConfiguration(`${sxClient}.${srv.type}.enabled`) && srv.enableAutoStart) startSrv(context, channel, srv);
		});
		statusBar.showStatus(srvList);
		if (e.affectsConfiguration(`${sxClient}.enableClient`)) {
			const enableClient = vscode.workspace.getConfiguration(sxClient).get('enableClient');
			if (enableClient) startSynerexClient(context, channel);
			else deactivate();
		}
	})

	channel.appendLine('Loaded Synerex Client for VSCode.');

	// const enableAutoStart = vscode.workspace.getConfiguration(sxClient).get('enableAutoStart');
	// console.log(`${sxClient}.enableAutoStart: `, enableAutoStart);

	context.subscriptions.push(startClientCommand);
	context.subscriptions.push(stopClientCommand);
	context.subscriptions.push(reinstallServerCommand);

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
	const enableAutoStart = vscode.workspace.getConfiguration(sxClient).get('enableAutoStart');
	if (enableAutoStart) srvList.forEach(srv => srv.enabled && srv.enableAutoStart && (!srv.task) ? startSrv(context, channel, srv) : {});
}

function reinstallServerStart(context, channel) {
	const selections = [];
	srvList.forEach(srv => vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.path`) === "" && selections.push(srv.name));
	vscode.window
		.showQuickPick(selections)
		.then(srvName => {
			const srv = findSrvByName(srvName);
			vscode.window.showInformationMessage("Reinstalling " + srv.name + " ...");
			srv.reinstalling = true;
			if (srv.task) {
				srv.task.terminate();
				srv.task = null;
				srv.stopping = true;
			} else {
				reinstallServerContinue(context, channel, srv);
			}
		});
}

function reinstallServerContinue(context, channel, srv) {
	const srvDir = installer.getSrvDir(context, srv);
	vscode.workspace.fs.delete(vscode.Uri.file(srvDir), { recursive: true }).then(() => {
		installer.installSrv(context, channel, srvList, srv);
	}, () => { vscode.window.showErrorMessage("Failed to stop " + srv.name + ".") });
}

function startSrv(context, channel, srv) {
	statusBar.setStatus({ label: srv.label, status: 'loading~spin', list: srvList });
	tcpscan.run({ host: 'localhost', port: srv.port }).then(
		() => {
			vscode.window.showWarningMessage(srv.name + ' seems to be already running.');
			channel.appendLine(srv.name + ' seems to be already running.');
			statusBar.setStatus({ label: srv.label, status: 'warning', list: srvList });
		},
		() => {
			const srvPath = vscode.workspace.getConfiguration(sxClient).get(`${srv.type}.path`);
			if (!srvPath || srvPath === '') {
				if (installer.isSrvInstalled(context, srv)) {
					runBackgroundTask(context, channel, srv, installer.getSrvExec(srv), installer.getSrvDir(context, srv));
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
	console.log(context.storageUri.fsPath);
	const newProc = new vscode.ProcessExecution(binaryPath, { cwd: binaryDir });
	newProc.args = [""];
	const newTask = new vscode.Task(
		{ type: `${sxClient}.${srv.type}` },
		vscode.TaskScope.Workspace,
		srv.name,
		'Synerex Client',
		newProc,
	);
	newTask.isBackground = true;
	newTask.presentationOptions = {
		// clear: true,
		echo: false,
		focus: false,
		// reveal: vscode.TaskRevealKind.Never,
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
