// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');
const installer = require('./util/installer');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const srvList = [
	{
		attr: 'Synerex',
		name: 'Synerex Server',
		label: 'SxSrv',
		status: 'loading',
		item: null,
		cmd: 'synerexClient.startSynerex',
		stopping: false,
		task: null,
		type: 'synerexClient.synerexServer',
		repo: 'synerex_server',
		binary: 'synerex-server',
		port: 10000,
	},
	{
		attr: 'Node',
		name: 'Node Server',
		label: 'NodeSrv',
		status: 'loading',
		item: null,
		cmd: 'synerexClient.startNode',
		stopping: false,
		task: null,
		type: 'synerexClient.nodeServer',
		repo: 'synerex_nodeserv',
		binary: 'nodeserv',
		port: 9990,
	},
	{
		attr: 'ProxyPrv',
		name: 'Proxy Provider',
		label: 'ProxyPrv',
		status: 'loading',
		item: null,
		cmd: 'synerexClient.startProxyPrv',
		stopping: false,
		task: null,
		type: 'synerexClient.proxyProvider',
		repo: 'provider_proxy',
		binary: 'proxy',
		port: 18000,
	},
];

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "synerex-client-for-vscode" is now active!');
	const channel = vscode.window.createOutputChannel("Synerex Client");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let startClientCommand = vscode.commands.registerCommand('synerexClient.start', () => {
		// The code you place here will be executed every time your command is executed
		startSynerexClient(context, channel);
	});

	srvList.forEach((srv, i) => {
		vscode.commands.registerCommand(srv.cmd, () => {
			startSrv(context, channel, srv);
		});
		vscode.commands.registerCommand(srv.cmd.replace('.start', '.stop'), () => stopTask(i));
	});

	vscode.tasks.onDidEndTask(e => {
		const { task } = e.execution;
		srvList.forEach((v, i) => {
			if (v.name === task.name) {
				channel.appendLine('Stopped ' + task.name + '.');
				statusBar.setStatus({ attr: v.attr, status: v.stopping ? 'debug-stop' : 'error', list: srvList });
				v.stopping = false;
			}
			if ((v.name + ' Installation') === task.name) {
				channel.appendLine('Installed ' + v.name + '.');
				runBackgroundTask(context, channel, srvList[i], installer.getSrvPath(context, srvList[i]), installer.getSrvDir(context, srvList[i]));
			}
		});
	});

	channel.appendLine('Loaded Synerex Client for VSCode.');

	const launchOnWindowOpen = vscode.workspace.getConfiguration('synerexClient').get('launchOnWindowOpen');
	console.log('synerexClient.launchOnWindowOpen: ', launchOnWindowOpen);

	context.subscriptions.push(startClientCommand);

	if (launchOnWindowOpen) startSynerexClient(context, channel);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	srvList.forEach((_, i) => stopTask(i));
}

function startSynerexClient(context, channel) {
	vscode.window.showInformationMessage('Started Synerex Client!');
	srvList.forEach(srv => startSrv(context, channel, srv));
}

function startSrv(context, channel, srv) {
	statusBar.setStatus({ attr: srv.attr, status: 'loading', list: srvList });
	tcpscan.run({ host: 'localhost', port: srv.port }).then(
		() => {
			vscode.window.showWarningMessage(srv.name + ' seems to be already running.');
			channel.appendLine(srv.name + ' seems to be already running.');
			statusBar.setStatus({ attr: srv.attr, status: 'warning', list: srvList });
		},
		() => {
			const srvPath = vscode.workspace.getConfiguration('synerexClient').get(srv.type.replace('synerexClient.',''));
			if (!srvPath || srvPath === '') {
				if (installer.isSrvInstalled(context, srv)) {
					runBackgroundTask(context, channel, srv, installer.getSrvPath(context, srv), installer.getSrvDir(context, srv));
				} else {
					statusBar.setStatus({ attr: srv.attr, status: 'info', list: srvList });
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
		// echo: false,
		focus: false,
		// reveal: vscode.TaskRevealKind.Never,
	}
	vscode.tasks.executeTask(newTask).then(
		task => {
			srv.task = task;
			channel.appendLine('Started ' + srv.name + '.');
			statusBar.setStatus({ attr: srv.attr, status: 'debug-start', list: srvList });
		},
		err => {
			channel.appendLine('Cannot start ' + srv.name + '.');
			console.error(err);
			statusBar.setStatus({ attr: srv.attr, status: 'debug-stop', list: srvList });
		}
	);
}

function stopTask(no) {
	if (srvList[no].task) srvList[no].task.terminate();
	srvList[no].task = null;
	srvList[no].stopping = true;
}

module.exports = {
	activate,
	deactivate
}
