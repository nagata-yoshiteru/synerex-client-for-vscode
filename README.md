# Synerex Client for Visual Studio Code
![master](https://github.com/nagata-yoshiteru/synerex-client-for-vscode/workflows/master/badge.svg)
![release](https://github.com/nagata-yoshiteru/synerex-client-for-vscode/workflows/release/badge.svg)

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

## Requirements

- [Git](https://git-scm.com/)
- [Go](https://golang.org/)
- [Make](https://www.gnu.org/software/make/) (for macOS, Linux)

## Extension Settings

This extension contributes the following settings:

### General
* `synerexClient.launchOnWindowOpen`: If enabled, launch Synerex Server and Node Server when a VSCode workspace which contains `.synerex` file opend.

### Indivisual Server / Provider Option

Following options are available for Compatible Synerex Servers / Providers.


* `synerexClient.[sp-id]`: Specifies the path to the Server / Provider correspond to `sp-id`. If not specified, extension will install it automatically.
* `synerexClient.[sp-id]Enabled` : Whether to use the Server / Provider correspond to `sp-id`. Default value is shown in the Compatible Synerex Servers / Providers table above. **Please restart VSCode window after update this option.**


## Known Issues

Currently, no issues are found. 

## Release Notes

### 0.1.x

- Add Proxy Provider Support
- Add Enable / Disable Feature

### 0.0.x

- Initial beta release of Synerex Client for Visual Studio Code.



