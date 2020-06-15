# synerex-client-for-vscode README

Synerex Client for Visual Studio Code


## Features

- Auto start Synerex / Node Server on startup.
- Auto Install Synerex / Node Server.


## Requirements

[Go](https://golang.org/)


## Extension Settings

This extension contributes the following settings:

* `synerexClient.launchOnWindowOpen`: If enabled, launch Synerex Server and Node Server when a VSCode workspace which contains `.synerex` file opend.
* `synerexClient.synerexServer`: Specifies the path to Synerex Server.
* `synerexClient.nodeServer` : Specifies the path to Node Server.


## Known Issues

- Some Windows Environments cannot install Servers automatically. 


## Release Notes

### 0.0.3

- macOS / Linux Support.
- Refactor.

### 0.0.2

- Improved working directory selection behavior.

### 0.0.1

- Initial beta release of Synerex Client for Visual Studio Code.



