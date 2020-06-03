// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const tcpscan = require('simple-tcpscan');
const statusBar = require('./util/statusBar');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let synerexHandle = null;
let nodeHandle = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "synerex-client-for-vscode" is now active!');
	const channel = vscode.window.createOutputChannel("Synerex Server");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let startClientCommand = vscode.commands.registerCommand('synerexClient.start', function () {
		// The code you place here will be executed every time your command is executed
		startSynerexClient(channel);
	});

	let startSynerexCommand = vscode.commands.registerCommand('synerexClient.startSynerex', function () {
		startSynerexServer(channel);
	});

	let startNodeCommand = vscode.commands.registerCommand('synerexClient.startNode', function () {
		startNodeServer(channel);
	});

	let stopSynerexCommand = vscode.commands.registerCommand('synerexClient.stopSynerex', function () {
		const tasks = vscode.tasks.taskExecutions;
		tasks.forEach( v => {
			console.log(v);
			if (v.task.name === "Synerex Server"){
				v.terminate();
				statusBar.setStatus({ attr: 'Synerex', status: 'debug-stop' });
			}
		});
	});

	let stopNodeCommand = vscode.commands.registerCommand('synerexClient.stopNode', function () {
		const tasks = vscode.tasks.taskExecutions;
		tasks.forEach( v => {
			console.log(v);
			if (v.task.name === "Node Server"){
				v.terminate();
				statusBar.setStatus({ attr: 'Node', status: 'debug-stop' });
			}
		});
	});
	// let continuouslySynerexServerCommand = vscode.commands.registerCommand('extension.sayHello', () => {
	// 	window.showInformationMessage('Hello World!');
	// });

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
	statusBar.showStatus();
	startSynerexServer(channel);
	startNodeServer(channel);
}

function startSynerexServer(channel) {
	tcpscan.run({'host': 'localhost', 'port': 10000}).then(
		() => {
			vscode.window.showWarningMessage('Synerex Server seems to be already running.');
			channel.appendLine('Synerex Server seems to be already running.');
			statusBar.setStatus({ attr: 'Synerex', status: 'warning' });
		},
		() => {
			const synerexServerPath = vscode.workspace.getConfiguration('synerexClient').get('synerexServer');
			synerexHandle = vscode.tasks.executeTask(new vscode.Task(
				{type: 'synerexClient.synerexServer'},
				vscode.TaskScope.Workspace,
				"Synerex Server",
				"Synerex Client Extension",
				new vscode.ShellExecution(synerexServerPath)
			));
			channel.appendLine('Started Synerex Server.');
			statusBar.setStatus({ attr: 'Synerex', status: 'debug-start' });
		}
	);
}

function startNodeServer(channel) {
	tcpscan.run({'host': 'localhost', 'port': 9990}).then(
		() => {
			vscode.window.showWarningMessage('Node Server seems to be already running.');
			channel.appendLine('Node Server seems to be already running.');
			statusBar.setStatus({ attr: 'Node', status: 'warning' });
		},
		() => {
			const nodeServerPath = vscode.workspace.getConfiguration('synerexClient').get('nodeServer');
			nodeHandle = vscode.tasks.executeTask(new vscode.Task(
				{type: 'synerexClient.nodeServer'},
				vscode.TaskScope.Workspace,
				"Node Server",
				"Synerex Client Extension",
				new vscode.ShellExecution(nodeServerPath)
			));
			channel.appendLine('Started Node Server.');
			statusBar.setStatus({ attr: 'Node', status: 'debug-start' });
		}
	);
}

module.exports = {
	activate,
	deactivate
}
