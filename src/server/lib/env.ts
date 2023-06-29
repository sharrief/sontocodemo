enum NODE_ENV {
  development = 'development',
  production = 'production',
  test = 'test',
  staging = 'staging'
}
enum DB_SERVER {
  az = 'azure',
  dh = 'dreamhost',
  do = 'digitalocean',
  ldh = 'localdreamhost'
}
const { env } = process as { env: {
  NODE_ENV?: NODE_ENV;
  PORT?: number;
  SITE_HOST?: string;
  SITE_HOST_2?: string;
  SITE_FILE_HOST?: string;
  COOKIE_SECRET?: string;
  DB_SERVER?: DB_SERVER;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_PASSWORD_SALT?: string;
  DB_PASSWORD_2FA_SALT?: string;
  SESSION_NAME?: string;
  SITE_URL?: string;
  SITE_NAME?: string;
  EMAIL_SERVER?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  EMAIL_ADMIN?: string;
  EMAIL_DEV?: string;
  EMAIL_TEST_CLIENT?: string;
  APPINSIGHTS_INSTRUMENTATIONKEY?: string;
  WATCH_CLIENT?: string;
  SEND_REQUEST_EMAILS?: string;
  NEW_REQUESTS_DISABLED?: string;
}; };

const isProduction = env.NODE_ENV === NODE_ENV.production;
const isTest = env.NODE_ENV === NODE_ENV.test;
const isStaging = env.NODE_ENV === NODE_ENV.staging;
const isDevelopment = (env.NODE_ENV === NODE_ENV.development || (!isTest && !isStaging && !isProduction));
const isLiveSite = isProduction || isStaging;
const isAzure = env.DB_SERVER === DB_SERVER.az;
const isDigitalOcean = env.DB_SERVER === DB_SERVER.do;

export default {
  var: {
    ...env,
    SEND_REQUEST_EMAILS: (() => { switch (env.SEND_REQUEST_EMAILS) { case 'true': return true; case 'false': return false; default: return undefined; } })(),
    NEW_REQUESTS_DISABLED: (() => { switch (env.NEW_REQUESTS_DISABLED) { case 'true': return true; case 'false': return false; default: return undefined; } })(),
  },
  isDevelopment,
  isProduction,
  isStaging,
  isTest,
  isLiveSite,
  isAzure,
  isDigitalOcean,
};
