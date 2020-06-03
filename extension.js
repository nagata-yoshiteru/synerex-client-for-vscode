// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "synerex-client-for-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let startCommand = vscode.commands.registerCommand('synerexClient.start', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		startSynerexServer();
	});

	// let continuouslySynerexServerCommand = vscode.commands.registerCommand('extension.sayHello', () => {
	// 	window.showInformationMessage('Hello World!');
	// });

	let type = "execStartTaskProv";
	const channel = vscode.window.createOutputChannel("Synerex Server");
	channel.appendLine('Loaded Synerex Client for VSCode.');

	const launchOnWindowOpen = vscode.workspace.getConfiguration('synerexClient').get('launchOnWindowOpen');
	console.log('synerexClient.launchOnWindowOpen: ', launchOnWindowOpen);

	context.subscriptions.push(startCommand);
	
	if(launchOnWindowOpen) startSynerexServer(channel);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function startSynerexServer(channel) {
	const synerexServerPath = vscode.workspace.getConfiguration('synerexClient').get('synerexServer');
	const nodeServerPath = vscode.workspace.getConfiguration('synerexClient').get('nodeServer');
	vscode.tasks.executeTask(new vscode.Task(
		{type: 'synerexClient.synerexServer'},
		vscode.TaskScope.Workspace,
		"Synerex Server",
		"Synerex Client Extension",
		new vscode.ShellExecution(synerexServerPath)
	));
	channel.appendLine('Started Synerex Server.');
	vscode.tasks.executeTask(new vscode.Task(
		{type: 'synerexClient.nodeServer'},
		vscode.TaskScope.Workspace,
		"Node Server",
		"Synerex Client Extension",
		new vscode.ShellExecution(nodeServerPath)
	));
	channel.appendLine('Started Node Server.');
	vscode.window.showInformationMessage('Started Synerex Client!');
	vscode.window.setStatusBarMessage('Synerex ▷');
}

module.exports = {
	activate,
	deactivate
}
