// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const taskList = [
    { attr: 'Synerex', name: 'Synerex Server', label: 'SxSrv', status: 'loading', item: null, cmd: 'synerexClient.startSynerex', stopping: false },
    { attr: 'Node', name: 'Node Server', label: 'NodeSrv', status: 'loading', item: null, cmd: 'synerexClient.startNode', stopping: false },
];
let synerexTask = null;
let nodeTask = null;

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
		startSynerexClient(channel);
	});

	let startSynerexCommand = vscode.commands.registerCommand('synerexClient.startSynerex', () => {
		startSynerexServer(channel);
	});

	let startNodeCommand = vscode.commands.registerCommand('synerexClient.startNode', () => {
		startNodeServer(channel);
	});

	vscode.commands.registerCommand('synerexClient.stopSynerex', () => {
		if (synerexTask) synerexTask.terminate();
		synerexTask = null;
		taskList[0].stopping = true;
	});

	vscode.commands.registerCommand('synerexClient.stopNode', () => {
		if (nodeTask) nodeTask.terminate();
		nodeTask = null;
		taskList[1].stopping = true;
	});
	
	vscode.tasks.onDidEndTask( e => {
		const { task } = e.execution;
		channel.appendLine('Stopped ' + task.name + '.');
		taskList.forEach( v => {
			if (v.name === task.name) {
				channel.appendLine('Stopped ' + task.name + '.');
				statusBar.setStatus({ attr: v.attr, status: v.stopping ? 'debug-stop' : 'error', list: taskList });
				v.stopping = false;
			}
		});
	});

	channel.appendLine('Loaded Synerex Client for VSCode.');

	const launchOnWindowOpen = vscode.workspace.getConfiguration('synerexClient').get('launchOnWindowOpen');
	console.log('synerexClient.launchOnWindowOpen: ', launchOnWindowOpen);

	context.subscriptions.push(startClientCommand);
	
	if(launchOnWindowOpen) startSynerexClient(channel);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function startSynerexClient(channel) {
	vscode.window.showInformationMessage('Started Synerex Client!');
	startSynerexServer(channel);
	startNodeServer(channel);
}

function startSynerexServer(channel) {
	statusBar.setStatus({ attr: 'Synerex', status: 'loading', list: taskList });
	tcpscan.run({'host': 'localhost', 'port': 10000}).then(
		() => {
			vscode.window.showWarningMessage('Synerex Server seems to be already running.');
			channel.appendLine('Synerex Server seems to be already running.');
			statusBar.setStatus({ attr: 'Synerex', status: 'warning', list: taskList });
		},
		() => {
			const synerexServerPath = vscode.workspace.getConfiguration('synerexClient').get('synerexServer');
			const newTask = new vscode.Task(
				{type: 'synerexClient.synerexServer'},
				vscode.TaskScope.Workspace,
				"Synerex Server",
				"Synerex Client Extension",
				new vscode.ShellExecution(synerexServerPath)
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
					synerexTask = task;
					channel.appendLine('Started Synerex Server.');
					statusBar.setStatus({ attr: 'Synerex', status: 'debug-start', list: taskList });
				},
				err => {
					channel.appendLine('Cannot start Synerex Server.');
					console.error(err);
					statusBar.setStatus({ attr: 'Synerex', status: 'debug-stop', list: taskList });
				}
			);
		}
	);
}

function startNodeServer(channel) {
	statusBar.setStatus({ attr: 'Node', status: 'loading', list: taskList });
	tcpscan.run({'host': 'localhost', 'port': 9990}).then(
		() => {
			vscode.window.showWarningMessage('Node Server seems to be already running.');
			channel.appendLine('Node Server seems to be already running.');
			statusBar.setStatus({ attr: 'Node', status: 'warning', list: taskList });
		},
		() => {
			const nodeServerPath = vscode.workspace.getConfiguration('synerexClient').get('nodeServer');
			const newTask = new vscode.Task(
				{type: 'synerexClient.nodeServer'},
				vscode.TaskScope.Workspace,
				"Node Server",
				"Synerex Client Extension",
				new vscode.ShellExecution(nodeServerPath)
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
					nodeTask = task;
					channel.appendLine('Started Node Server.');
					statusBar.setStatus({ attr: 'Node', status: 'debug-start', list: taskList });
				},
				err => {
					channel.appendLine('Cannot start Node Server.');
					console.error(err);
					statusBar.setStatus({ attr: 'Node', status: 'debug-stop', list: taskList });
				}
			);
		}
	);
}

module.exports = {
	activate,
	deactivate
}
