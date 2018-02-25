<h2 align="center"><img src="https://github.com/uchaindb/UClient/blob/master/cordova/model/icon.png?raw=true" height="128"><br>UClient</h2>
<p align="center"><strong>Universal Client for UChainDb</strong></p>

[![Gitter](https://badges.gitter.im/uchaindb/UClient.svg)](https://gitter.im/uchaindb/UClient?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Build Status](https://travis-ci.org/uchaindb/UClient.svg?branch=master)](https://travis-ci.org/uchaindb/UClient)
[![Maintainability](https://api.codeclimate.com/v1/badges/6bb89e19a87ded0e27ff/maintainability)](https://codeclimate.com/github/uchaindb/UClient/maintainability)

UClient is Universal Client for [UChainDb](https://www.uchaindb.com) that enables:

* Discover chain database
* Find the history of database, even for cells
* Monitor fork of database
* Monitor table data modification or even the cell modification
* Inspect the block and transaction detail
* Manage private key
* Refer to our [roadmap](https://github.com/uchaindb/UClient/projects) for a full list

UClient has been brought to you in following form:

* Offline Available Webpage [Demo Link](http://app.uchaindb.com)
* iOS Mobile App (Work In Progress)
* Android Mobile App (Work In Progress)

Please report missing features/bugs on [GitHub](https://github.com/uchaindb/UClient/issues) and join us on [Gitter](https://gitter.im/uchaindb/UClient?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge).

## Contents

- [Build Client](#build-client)
  * [Using webpack](#using-webpack)
  * [Using msbuild](#using-msbuild)
- [Build Mobile(Cordova)](#build-mobile-cordova-)
- [Usage](#usage)
- [What's Included](#what-s-included)
- [Contributions](#contributions)
- [Release History](#release-history)
- [License](#license)

## Build Client

### Using webpack

``` bash
$ cd src
$ npm install
$ npm run build
```

### Using msbuild

``` bash
$ cd src
$ dotnet build --configuration release
```

## Build Mobile(Cordova)

``` bash
$ npm install -g cordova
$ cd cordova
$ npm run copy
$ cordova build ios
$ cordova build android
```

## Usage

TBD

## What's Included

- `src` folder
  - `npm run serve`: development using webpack command line.
  - `npm run build`: Production ready build.
  - `npm run extract`: Extract text from source code to language json file to be localized.
  - `npm run test`: Intended to be unit tests, but TBD.

- `cordova` folder
  - `npm run copy`: copy output of webpack result to cordova `www` folder.

## Contributions

We hope you'll get involved! Read our [Contributors' Guide](CONTRIBUTING.md) for details.

## Release History

* Please see <https://github.com/uchaindb/UClient/releases>

## License

Licensed under the [MIT license](LICENSE).
