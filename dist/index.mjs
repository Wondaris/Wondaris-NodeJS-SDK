// src/DataSource.ts
import axios from "axios";
import * as tus from "tus-js-client";
import * as fs from "node:fs";
import * as Path from "node:path";
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
    const { data } = await axios.request(options);
    if (!data) {
      throw new Error("Failed to get upload token");
    }
    return data;
  }
  async uploadToGcsSource(filePath, tusOptions = {}) {
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
export {
  src_default as default
};
