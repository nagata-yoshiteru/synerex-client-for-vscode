// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');
const installer = require('./util/installer');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const taskList = [
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

	let startSynerexCommand = vscode.commands.registerCommand('synerexClient.startSynerex', () => {
		startSynerexServer(context, channel);
	});

	let startNodeCommand = vscode.commands.registerCommand('synerexClient.startNode', () => {
		startNodeServer(context, channel);
	});

	vscode.commands.registerCommand('synerexClient.stopSynerex', () => stopTask(0));
	vscode.commands.registerCommand('synerexClient.stopNode', () => stopTask(1));

	vscode.tasks.onDidEndTask(e => {
		const { task } = e.execution;
		taskList.forEach((v, i) => {
			if (v.name === task.name) {
				channel.appendLine('Stopped ' + task.name + '.');
				statusBar.setStatus({ attr: v.attr, status: v.stopping ? 'debug-stop' : 'error', list: taskList });
				v.stopping = false;
			}
			if ((v.name + ' Installation') === task.name) {
				channel.appendLine('Installed ' + v.name + '.');
				runBackgroundTask(context, channel, taskList[i], installer.getSrvPath(context, taskList[i]));
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
function deactivate() { }

function startSynerexClient(context, channel) {
	vscode.window.showInformationMessage('Started Synerex Client!');
	startSynerexServer(context, channel);
	startNodeServer(context, channel);
}

function startSynerexServer(context, channel) {
	statusBar.setStatus({ attr: 'Synerex', status: 'loading', list: taskList });
	tcpscan.run({ 'host': 'localhost', 'port': 10000 }).then(
		() => {
			vscode.window.showWarningMessage('Synerex Server seems to be already running.');
			channel.appendLine('Synerex Server seems to be already running.');
			statusBar.setStatus({ attr: 'Synerex', status: 'warning', list: taskList });
		},
		() => {
			const synerexServerPath = vscode.workspace.getConfiguration('synerexClient').get('synerexServer');
			if (!synerexServerPath) {
				if (installer.isSrvInstalled(context, taskList[0])) {
					runBackgroundTask(context, channel, taskList[0], installer.getSrvPath(context, taskList[0]));
				} else {
					statusBar.setStatus({ attr: 'Synerex', status: 'info', list: taskList });
					installer.installSrv(context, channel, taskList, taskList[0]);
				}
			} else {
				runBackgroundTask(context, channel, taskList[0], synerexServerPath);
			}
		}
	);
}

function startNodeServer(context, channel) {
	statusBar.setStatus({ attr: 'Node', status: 'loading', list: taskList });
	tcpscan.run({ 'host': 'localhost', 'port': 9990 }).then(
		() => {
			vscode.window.showWarningMessage('Node Server seems to be already running.');
			channel.appendLine('Node Server seems to be already running.');
			statusBar.setStatus({ attr: 'Node', status: 'warning', list: taskList });
		},
		() => {
			const nodeServerPath = vscode.workspace.getConfiguration('synerexClient').get('nodeServer');
			if (!nodeServerPath) {
				if (installer.isSrvInstalled(context, taskList[1])) {
					runBackgroundTask(context, channel, taskList[1], installer.getSrvPath(context, taskList[1]));
				} else {
					statusBar.setStatus({ attr: 'Node', status: 'info', list: taskList });
					installer.installSrv(context, channel, taskList, taskList[1]);
				}
			} else {
				runBackgroundTask(context, channel, taskList[1], nodeServerPath);
			}
		}
	);
}

function runBackgroundTask(context, channel, taskInfo, binaryPath) {
	const newTask = new vscode.Task(
		{ type: taskInfo.type },
		vscode.TaskScope.Workspace,
		taskInfo.name,
		"Synerex Client Extension",
		new vscode.ShellExecution(binaryPath)
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
			taskInfo.task = task;
			channel.appendLine('Started ' + taskInfo.name + '.');
			statusBar.setStatus({ attr: taskInfo.attr, status: 'debug-start', list: taskList });
		},
		err => {
			channel.appendLine('Cannot start ' + taskInfo.name + '.');
			console.error(err);
			statusBar.setStatus({ attr: taskInfo.attr, status: 'debug-stop', list: taskList });
		}
	);
}

function stopTask(no) {
	if (taskList[no].task) taskList[no].task.terminate();
	taskList[no].task = null;
	taskList[no].stopping = true;
}

module.exports = {
	activate,
	deactivate
}
