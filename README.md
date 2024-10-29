# wondaris-sdk
> This is the SDK that Wondaris Team has developed for applications using NodeJS for the Wondaris services.

# Prerequisites

1. Firstly, you need to be an active Wondaris customer and have an account on https://centralise.platform.wondaris.com.
2. You need to create a data source of type "Wondaris File Storage" on the Centralise, and then create a dataset within that source.
3. Create a token that has the appropriate scope to allow access and manipulation of the dataset you have created.

# Installation

## Install from NPM (recommended)

Install the package using a package manager, such as `npm` or `yarn`:

```
$ npm install --save wondaris-sdk
```

After that, you can load the package:

```js
var wondaris = require('wondaris-sdk').default
```

If your bundler supports ES Modules, you can use:

```js
import wondaris from 'wondaris-sdk'
```

# Usage

This document contains an introduction and example about how to use wondaris-sdk:

The basic flow is for every application the same:


## Example: Simple file upload


##  `WondarisDataSource` 
The class is designed to upload files to Wondaris's cloud storage. 
Since we're using Tus Server for our uploads, this class interacts with the Tus Client to handle the file transfer process.
It also leverages the capabilities of the Tus client.




- With Common JS: see example in `examples/example.js` to know how to use this package
- With ESM : see example in `examples/example.mjs` to know how to use this package


We use Tus client to upload files to GCS, maybe you want to add more options to tus client, please see https://github.com/tus/tus-js-client/blob/main/docs/api.md


