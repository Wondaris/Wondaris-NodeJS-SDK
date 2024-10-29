# wondaris-sdk
> This is the SDK that Wondaris Team has developed for applications using NodeJS for the Wondaris services.
> 
> This SDK simplifies uploading files to Wondaris File Storage via the Tus protocol, making it easy to integrate into your Node.js projects.

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
const wondaris = require('wondaris-sdk').default
```

If your bundler supports ES Modules, you can use:

```js
import wondaris from 'wondaris-sdk'
```

# Usage

This document contains an introduction and example about how to use wondaris-sdk:

## Example: Simple file upload
```js
const dataSource = new wondaris.WndrsDataSource({
    baseURL: 'https://centralise.platform.wondaris.com/api/oauth/v1.0/gcs',
    dataSource: 'demo-data-source',
    dataSet: 'demo-data-set',
    token: process.env.TOKEN,
})
// path to file which you want to upload
const pathToFile = './example.csv'

//  more options to tus client can see here
// https://github.com/tus/tus-js-client/blob/main/docs/api.md
const tusOptions = {
    onBeforeRequest () {
        console.log('onBeforeRequest')
    },
}

// Upload the file
dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

## Tus Options
> You can add additional options to tusOptions for customization and control in your application
>
> The available options for customizing the tus client are listed here. https://github.com/tus/tus-js-client/blob/main/docs/api.md


### onSuccess
_Default value:_ `() => console.log('Upload finished')`

An optional function called when the upload finished successfully. For example:

```js
const tusOptions = {
    onSuccess () {
        console.log('onSuccess')
    },
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### onProgress
_Default value:_  
```js
(bytesUploaded, bytesTotal) => {
    const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
    console.log(`Progress: ${percentage}% `, {bytesUploaded, bytesTotal})
}
```

An optional function that will be called each time progress information is available. The arguments will be `bytesSent` and `bytesTotal`. For example:

```js
const tusOptions = {
    onProgress (bytesUploaded, bytesTotal) {
        console.log({bytesUploaded, bytesTotal})
    },
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### onChunkComplete

_Default value:_ `null`

An optional function that will be called each time a `PATCH` has been successfully completed. The arguments will be `chunkSize`,`bytesAccepted`, `bytesTotal`. For example:

```js
const tusOptions = {
    onChunkComplete (chunkSize, bytesAccepted, bytesTotal) {
        console.log({ chunkSize, bytesAccepted, bytesTotal })
    },
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### onError
_Default value:_ 
```js
(error) => {
    console.error('An error occurred:')
    console.error(error)
}
```

An optional function called once an error appears. The argument will be an Error instance with additional information about the involved requests. For example:

_Example:_
```js
const tusOptions = {
    onError(error) {
        console.error('Error: ', error)
    },
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### onShouldRetry
_Default value:_ `null`

An optional function called once an error appears and before retrying.

When no callback is specified, the retry behavior will be the default one: any status codes of 409, 423 or any other than 4XX will be treated as a server error and the request will be retried automatically, as long as the browser does not indicate that we are offline.

When a callback is specified, its return value will influence the retry behavior: The function must return `true` if the request should be retried, `false` otherwise. The argument will be an `Error` instance with additional information about the involved requests.

Please note that the callback will not be invoked when the maximum number of retry attempts was reached.

```js
const tusOptions = {
    onShouldRetry: (err, retryAttempt, options) => {
        console.log('Error', err)
        console.log('Request', err.originalRequest)
        console.log('Response', err.originalResponse)

        var status = err.originalResponse ? err.originalResponse.getStatus() : 0
        // Do not retry if the status is a 403.
        if (status === 403) {
            return false
        }

        // For any other status code, we retry.
        return true
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### headers

_Default value:_ `{Authorization: 'Bearer ' + wondarisToken}`

An object with custom header values used in all requests. For example:

```js
const tusOptions = {
    headers: {
        'Content-Type': 'application/json',
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

#### chunkSize

_Default value:_ ` 30 * 1024 * 1024` Bytes

A number indicating the maximum size of a `PATCH` request body in bytes. With value (`Infinity`) means that tus-js-client will try to upload the entire file in one request. This setting is also required if the input file is a reader/readable stream.

**Warning:** **Do not set this value**, unless you are being forced to. The only two valid reasons for setting `chunkSize` are:

- You are passing a reader or readable stream as input to tus-js-client and it will complain that it "cannot create source for stream without a finite value for the chunkSize option" if you leave `chunkSize` empty.
- You are using a tus server or proxy with a limit on how big request bodies may be.

In all other cases, **do not set this value** as it will hurt your upload performance. If in doubt, leave this value to the default or contact us for help.

If you are required to specify a value, consider this:

- A small chunk size (less than a few MBs) may reduce the upload performance dramatically. Each `PATCH` request can only carry little data, which requires more HTTP requests to transmit the whole file. All of these HTTP requests add overhead to the upload process. In addition, if the server has hard limits (such as the minimum 5 MB chunk size imposed by S3), specifying a chunk size which below outside those hard limits will cause chunked uploads to fail.
- A large chunk size (more than a GB) is problematic when a reader/readable stream is used as the input file. In these cases, tus-js-client will create an in-memory buffer with the size of `chunkSize`. This buffer is used to resume the upload if it gets interrupted. A large chunk size means a larger memory usage in this situation. Choosing a good value depends on the application and is a trade-off between available memory and upload performance.

_Example:_
```js
const tusOptions = {
    chunkSize: Infinity,
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

#### metadata

_Default value:_ `{filename: realFilename}`

An object with string values used as additional meta data which will be passed along to the server when (and only when) creating a new upload. Can be used for filenames, file types etc, for example:

```js
const tusOptions = {
    metadata: {
        filetype: "image/png",
        userId: "1234567",
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)

```

### metadataForPartialUploads

_Default value:_ `{}`

An object with string values used as additional meta data for partial uploads. When parallel uploads are enabled via `parallelUploads`, tus-js-client creates multiple partial uploads. The values from `metadata` are not passed to these partial uploads but only passed to the final upload, which is the concatentation of the partial uploads. In contrast, the values from `metadataForPartialUploads` are only passed to the partial uploads and not the final upload. This option has no effect if parallel uploads are not enabled. Can be used to associate partial uploads to a user, for example:

```js
const tusOptions = {
    metadataForPartialUploads: {
        userId: "1234567",
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### uploadSize

_Default value:_ `null`

An optional integer representing the size of the file in bytes. This will only be used if the size cannot be automatically calculated which only happens if you supply a `Readable` stream as the file to upload.

#### retryDelays

_Default value:_ `[0, 1000, 3000, 5000]`

An array or null, indicating how many milliseconds should pass before the next attempt to uploading will be started after the transfer has been interrupted. The array's length indicates the maximum number of attempts. If the final attempt did not finish successfully, an error will be emitted using the `onError` callback. For more details about the system of retries and delays, read the [FAQ entry about automated Retries](/docs/faq.md#can-tus-js-client-automatically-retry-errored-requests).

Following example will trigger up to three retries, each after 1s, 3s and 5s respectively:


```js
const tusOptions = {
    retryDelays: [1000, 3000, 5000]
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

#### onBeforeRequest

_Default value:_ `null`

An optional function that will be called before a HTTP request is sent out. The argument will be an instance of the `HttpRequest` interface as defined for the `httpStack` option. This can be used to modify the outgoing request. For example, you can enable the `withCredentials` setting for XMLHttpRequests in browsers:

```js
const tusOptions = {
    onBeforeRequest: function (req) {
        var xhr = req.getUnderlyingObject()
        xhr.withCredentials = true
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

You can also return a Promise if you need to perform some calculations before the request is sent:

```js
const tusOptions = {
    onBeforeRequest: function (req) {
        return new Promise(resolve => {
            var xhr = req.getUnderlyingObect()
            xhr.withCredentials = true
            resolve()
        })
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

#### onAfterResponse

_Default value:_ `null`

An optional function that will be called after a HTTP response has been received. The arguments will be an instance of the `HttpRequest` and `HttpResponse` interface as defined for the `httpStack` option. This can be used to retrieve additional data from the server, for example:

```js
const tusOptions = {
    onAfterResponse: function (req, res) {
        var url = req.getURL()
        var value = res.getHeader("X-My-Header")
        console.log(`Request for ${url} responded with ${value}`)
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

You can also return a Promise if you need to perform some calculations before tus-js-client processes the response:

```js
const tusOptions = {
    onAfterResponse: function (req, res) {
        return new Promise(resolve => {
            var url = req.getURL()
            var value = res.getHeader("X-My-Header")
            console.log(`Request for ${url} responded with ${value}`)
            resolve()
        })
    }
}

dataSource.uploadToWondarisFileStore(pathToFile, tusOptions)
```

### httpStack

_Default value:_ Environment-specific implementation

An object used as the HTTP stack for making network requests. This is an abstraction layer above the different network APIs on the various platforms. If you want to implement your own HTTP stack, pass an object to the `httpStack` option which conforms to the following `HttpStack` interface:

```typescript
interface HttpStack {
    createRequest(method: string, url: string): HttpRequest;
    getName(): string;
}

interface HttpRequest {
    constructor(method: string, url: string);
    getMethod(): string;
    getURL(): string;

    // Set a header from this request.
    setHeader(header: string, value: string);

    // Retrieve a header value from this request.
    // Note: In browser environments this method can only return headers explicitly set by
    // tus-js-client or users through the above `setHeader` method. It cannot return headers that are
    // implicitly added by the browser (e.g. Content-Length) due to a security related API limitation.
    getHeader(header: string): string | undefined;

    setProgressHandler((bytesSent: number): void): void;

    // Send the HTTP request with the provided request body. The value of the request body depends
    // on the platform and what `fileReader` implementation is used. With the default `fileReader`,
    // `body` can be
    // - in browsers: a TypedArray, a DataView a Blob, or null.
    // - in  Node.js: a Buffer, a ReadableStream, or null.
    send(body: any): Promise<HttpResponse>;
    abort(): Promise<void>;

    // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
    getUnderlyingObject(): any;
}

interface HttpResponse {
    getStatus(): number;
    getHeader(header: string): string | undefined;
    getBody(): string;

    // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
    getUnderlyingObject(): any;
}
```

### urlStorage

_Default value:_ Environment-specific implementation

An object used as the URL storage for storing and retrieving upload URLs based on a file's fingerprint. The default implementation for browsers uses the Web Storage API. For Node.js, the default value is a dummy storage which discards all data to avoid memory leaks. If you want to save the upload URLs on disk, use the `tus.FileUrlStorage` class. You can use this option to implement your own storage if you want to use a specific backend for saving that data. In that case, the following `UrlStorage` interface must be used:

```typescript
interface UrlStorage {
  findAllUploads(): Promise<Array<ListEntry>>
  findUploadsByFingerprint(fingerprint: string): Promise<Array<ListEntry>>

  removeUpload(urlStorageKey: string): Promise<void>

  // Returns the URL storage key, which can be used for removing the upload.
  addUpload(fingerprint: string, upload: ListEntry): Promise<string>
}

interface ListEntry {
  size: number | null
  metadata: object
  creationTime: string
  urlStorageKey: string
  uploadUrl: string | null
  parallelUploadUrls: string[] | null
}
```

### fileReader

_Default value:_ Environment-specific implementation

An object used as the file reader to retrieve specific parts of the input file. If you want to implement your own, use the following `FileReader` interface:

```typescript
interface FileReader {
  // `input` is the same object that was passed to the `tus.Upload` constructor and is platform-specific.
  // `chunkSize` is the user-defined or default value for the `chunkSize` option.
  openFile(input: any, chunkSize: number): Promise<FileSource>
}

interface FileSource {
  // `size` is file length in bytes or `null` if no length can be determined because it is a streaming resource.
  size: number | null
  // `slice` returns a specific part of the file as requested by the range:
  // - `start` is treated inclusively and `end` is treated exclusively, just like `Blob#slice` in browsers.
  // - `start` is always a finite number, but `end` might be `Infinity`.
  // The returned result includes the requested data and indicates if the file was read completely:
  // - If data was read and the end was not reached:    `{ value: [data], done: false }`
  // - If data was read and the end has been reached:   `{ value: [data], done: true }`
  // - If no data was read because the end was reached: `{ value: null, done: true }`
  slice(start: number, end: number): Promise<SliceResult>
  // `close` frees all resources that have been allocated by this `FileReader` instance.
  close()
}

interface SliceResult {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  value: any | null
  // `done` is true if the file has been read fully and future calls to `slice` will not return new data.
  done: boolean
}
```
