var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/DataSource.ts
var import_axios = __toESM(require("axios"));
var tus = __toESM(require("tus-js-client"));
var fs = __toESM(require("fs"));
var Path = __toESM(require("path"));
var DataSource = class {
  configs = {
    baseURL: "https://centralise.platform.wondaris.com/api/oauth/v1.0/gcs"
  };
  constructor(configs = {}) {
    this.configs = { ...this.configs, ...configs };
  }
  setConfigs(configs = {}) {
    this.configs = { ...this.configs, ...configs };
    return this;
  }
  validate() {
    if (!this.configs.dataSet) {
      throw new Error("dataSet is required");
    }
    if (!this.configs.dataSource) {
      throw new Error("dataSource is required");
    }
    if (!this.configs.token) {
      throw new Error("token is required");
    }
    return this;
  }
  async getUploadInfo() {
    const url = `${this.configs.baseURL}/${this.configs.dataSource}/${this.configs.dataSet}`;
    const options = {
      "method": "POST",
      url,
      "headers": {
        "Accept": "application/json",
        "Authorization": `Bearer ${this.configs.token}`,
        "Content-Type": "application/json"
      }
    };
    const { data } = await import_axios.default.request(options);
    if (!data) {
      throw new Error("Failed to get upload token");
    }
    return data;
  }
  async uploadToWondarisFileStore(filePath, tusOptions = {}) {
    const uploadInfo = await this.validate().getUploadInfo();
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    const options = {
      onError(error) {
        console.error("An error occurred:");
        console.error(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(`Progress: ${percentage}% `, { bytesUploaded, bytesTotal });
      },
      onSuccess() {
        console.log("Upload finished");
      },
      chunkSize: 30 * 1024 * 1024,
      retryDelays: [0, 1e3, 3e3, 5e3],
      ...tusOptions,
      endpoint: uploadInfo.url,
      metadata: {
        ...tusOptions.metadata || {},
        filename: Path.basename(filePath)
        // filetype: 'text/plain',
      },
      headers: {
        ...tusOptions.headers || {},
        Authorization: uploadInfo.short_token
      }
    };
    const file = fs.createReadStream(filePath);
    const upload = new tus.Upload(file, options);
    upload.start();
  }
};
var DataSource_default = DataSource;

// src/index.ts
var src_default = {
  WndrsDataSource: DataSource_default
};
