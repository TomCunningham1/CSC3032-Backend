const host = 'team11-db-v5.cxlgfoh4iee5.eu-west-1.rds.amazonaws.com'
const port = 3306

const EMAIL_SERVICE = {
  USER: 'tomcloudservice@gmail.com',
  SERVICE: 'gmail',
  PASS: 'cwwj wqmj afhm gtbg',
}

const CONTENT_TYPE_JSON = 'application/json'

const NON_PRODUCTION_ENVIRONMENT = {
  environmentName: 'non-production',
  databaseName: 'team11_non_prod_db',
}

const PRODUCTION_ENVIRONMENT = {
  environmentName: 'production',
  databaseName: 'team11_prod_db',
}

export {
  host,
  port,
  EMAIL_SERVICE,
  CONTENT_TYPE_JSON,
  NON_PRODUCTION_ENVIRONMENT,
  PRODUCTION_ENVIRONMENT,
}
