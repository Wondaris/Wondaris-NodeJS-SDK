const { configDotenv } = require('dotenv')
const wondaris = require('wondaris-sdk').default

// Attempt to load a .env file into the environment variables
configDotenv()

// Instantiate the data source, setting the baseURL (optional),
// data source & data set slugs (from Wondaris Centralise)
// and the token (in this example from en environment variable)
const dataSource = new wondaris.WndrsDataSource({
    baseURL: 'https://centralise.platform.wondaris.com/api/oauth/v1.0/gcs',
    dataSource: 'demo-data-source',
    dataSet: 'demo-data-set',
  token: process.env.TOKEN,
})

// Upload the file
dataSource.uploadToWondarisFileStore('./example.csv', {
  // example add more options to tus client
  // https://github.com/tus/tus-js-client/blob/main/docs/api.md
  onBeforeRequest () {
    console.log('onBeforeRequest')
  }
})


