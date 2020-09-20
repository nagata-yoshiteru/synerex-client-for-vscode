# Synerex Client for Visual Studio Code

## Features

- Auto start Synerex Servers / Providers on startup.
- Auto Install Synerex Servers / Providers.

## Compatible Synerex Servers / Providers

Currently, following Synerex Servers / Providers are compatible.

| Server / Provider Name | Repository | sp-id | Default Enabled |
| --- | --- | --- | --- |
| Synerex Server | [synerex/synerex_server](https://github.com/synerex/synerex_server) | `synerexServer` | Yes |
| Node Server | [synerex/synerex_nodeserv](https://github.com/synerex/synerex_nodeserv) | `nodeServer` | Yes |
| Proxy Provider | [synerex/provider_proxy](https://github.com/synerex/provider_proxy) | `proxyProvider` | No |
| Harmoware-VIS Layers Provider | [synerex/provider_harmovis_layers](https://github.com/synerex/provider_harmovis_layers) | `harmovisLayersProvider` | No |

## Requirements

- [Git](https://git-scm.com/)
- [Go](https://golang.org/)
- [Make](https://www.gnu.org/software/make/) (for macOS, Linux)

## Start / Stop Synerex Client

If you want to start Synerex Client automatically in specific VSCode Workspace, go to VSCode Workspace Configuration and enable the `Synerex Client - Enable Client` option.  
For more information, refer to the following section.

### To Start

Press `Ctrl` + `Shift` + `P` to open Command Palette, type `start synerex` and select `Start Synerex Client`.

### To Stop

Press `Ctrl` + `Shift` + `P` to open Command Palette, type `stop synerex` and select `Stop Synerex Client`.

## Extension Settings

**Please configure following settings for VSCode Workspace or Folder. If you set them for User Configuration, all VSCode window attempt to start this client.**  
To open Workspace Configuration, press `Ctrl` + `,` on your VSCode window and click the `Workspace` tab in the Configuration.

This extension contributes the following settings:

### General
* Enable Client (`synerexClient.enableClient`): If enabled, launch this extension after VSCode started.
* Enable Auto Start (`synerexClient.enableAutoStart`): If enabled, launch Synerex Servers and Providers after VSCode started.

### Indivisual Server / Provider Option

Following options are available for Compatible Synerex Servers / Providers.


* `Server / Provider Name` Enabled (`synerexClient.[sp-id].enabled`) : Whether to use the Server / Provider correspond to `sp-id`. Default value is shown in the Compatible Synerex Servers / Providers table above. 
* `Server / Provider Name` Enable Auto Start (`synerexClient.[sp-id].enableAutoStart`) : Whether to start the Server / Provider correspond to `sp-id` automatically. Default value is `true` for all Synerex Servers / Providers. 
* `Server / Provider Name` Path (`synerexClient.[sp-id].path`): Specifies the path to the Server / Provider correspond to `sp-id`. If not specified, extension will install it automatically.
* `Server / Provider Name` Version (`synerexClient.[sp-id].version`): Specifies the Server / Provider version to install. Can be specified with commit hash, tag or branch bame. If not specified, extension will install latest tag version. Default value is `master` ( master branch ) for all Synerex Servers / Providers. 

### Reinstalling Server

Press `Ctrl` + `Shift` + `P` to open Command Palette, type `reinstall server` and select `Reinstall Server / Provider - Synerex Client`.
Then, select the server you want to reinstall.

## Known Issues

Currently, no issues are found. 

## Release Notes

### 0.5.1

- Rename Update Server to Reinstall Server / Provider

### 0.5.0

- Update Configuration Path
- Add Auto Start option for individual Servers and Providers.
- Add Version option for Servers and Providers.

### 0.4.x

- Update Startup behavior
- Bug Fix about configuration
- Update dependencies

### 0.3.0

- Add Server Updater

### 0.2.x

- Add Harmoware-VIS Layers Provider Support

### 0.1.x

- Add Proxy Provider Support
- Add Enable / Disable Feature
- Changed to background task

### 0.0.x

- Initial beta release of Synerex Client for Visual Studio Code.



