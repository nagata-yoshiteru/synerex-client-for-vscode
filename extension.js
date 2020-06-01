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
	let helloWorldCommand = vscode.commands.registerCommand('synerex-client-for-vscode.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Synerex Client for VSCode!');
		vscode.window.setStatusBarMessage('Synerex Hello World');
	});

	let startCommand = vscode.commands.registerCommand('synerex-client-for-vscode.start', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Started Synerex Client!');
		vscode.window.setStatusBarMessage('Synerex ▷');
	});

	let type = "execStartTaskProv";
	
	const exec = new vscode.ShellExecution("echo \"Hello World\"");
	vscode.tasks.executeTask(new vscode.Task({type: type}, vscode.TaskScope.Workspace,
			"Build", "Synerex Client Extension", exec));

	context.subscriptions.push(helloWorldCommand);
	context.subscriptions.push(startCommand);

	startSynerexServer();
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function startSynerexServer() {
	const channel = vscode.window.createOutputChannel("Synerex Server");
	const execution = new vscode.ShellExecution("echo \"Hello World\"");
}

module.exports = {
	activate,
	deactivate
}
