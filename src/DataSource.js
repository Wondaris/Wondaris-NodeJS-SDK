import axios from 'axios'
import * as tus from 'tus-js-client'
import * as fs from 'node:fs'
import { fileMetadata } from 'file-metadata'

class Datasource {
  configs = {
    baseURL: 'https://centralise.platform.wondaris.com/api/oauth/v1.0/gcs',
  }

  constructor (configs = {}) {
    this.configs = { ...this.configs, ...configs }
  }

  setConfigs (configs = {}) {
    this.configs = { ...this.configs, ...configs }

    return this
  }

  validate () {
    if (!this.configs.dataSet) {
      throw new Error('dataSet is required')
    }
    if (!this.configs.dataSource) {
      throw new Error('dataSource is required')
    }
    if (!this.configs.token) {
      throw new Error('token is required')
    }

    return this
  }

  async getUploadInfo () {
    const url = `${this.configs.baseURL}/${this.configs.dataSource}/${this.configs.dataSet}`

    const options = {
      'method': 'POST',
      url,
      'headers': {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.configs.token}`,
        'Content-Type': 'application/json',
      }
    }

    const { data } = await axios.request(options)

    if (!data) {
      throw new Error('Failed to get upload token')
    }

    return data
  }

  async uploadToGcsSource (filePath, tusOptions = {}) {
    const uploadInfo = await this.validate().getUploadInfo()

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found')
    }

    const stats = await fileMetadata(filePath)

    const options = {
      onError (error) {
        console.error('An error occurred:')
        console.error(error)
      },
      onProgress (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        console.log(`Progress: ${percentage}% `, { bytesUploaded, bytesTotal })
      },
      onSuccess () {
        console.log('Upload finished')
      },
      chunkSize: 30 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      ...tusOptions,
      endpoint: uploadInfo.url,
      metadata: {
        ...(tusOptions.metadata || {}),
        filename: stats.displayName,
        // filetype: 'text/plain',
      },
      headers: {
        ...(tusOptions.headers || {}),
        Authorization: uploadInfo.short_token,
      },
    }

    const file = fs.createReadStream(filePath)

    // https://github.com/tus/tus-js-client/blob/main/docs/api.md
    const upload = new tus.Upload(file, options)

    upload.start()
  }
}

export default Datasource
