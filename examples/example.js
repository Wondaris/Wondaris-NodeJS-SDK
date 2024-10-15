import { configDotenv } from 'dotenv'
import wondaris from 'wondaris-sdk'

configDotenv()

const dataSource = new wondaris.WndrsDataSource({
  baseURL: 'https://mdp.staging.wondaris.com/api/oauth/v1.0/gcs',
  dataSource: 'demo-staging',
  dataSet: 'demo-staging',
  token: process.env.TOKEN,
})

await dataSource.uploadToGcsSource('./example.csv', {
  // example add more options to tus client
  // https://github.com/tus/tus-js-client/blob/main/docs/api.md
  onBeforeRequest () {
    console.log('onBeforeRequest')
  }
})


