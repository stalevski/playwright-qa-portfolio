export type TestTargetConfig = {
  uiBaseUrl: string;
  apiBaseUrl: string;
};

const withTrailingSlash = (value: string): string => (value.endsWith('/') ? value : `${value}/`);

const publicUiBaseUrl = process.env.PUBLIC_BASE_URL ?? 'https://petstore.swagger.io';
const publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL ?? 'https://petstore.swagger.io/v2';
const sauceDemoUiBaseUrl = process.env.SAUCE_DEMO_BASE_URL ?? 'https://www.saucedemo.com';
const sauceDemoApiBaseUrl = process.env.SAUCE_DEMO_API_BASE_URL ?? 'https://www.saucedemo.com';
const localUiBaseUrl = process.env.LOCAL_BASE_URL ?? 'http://127.0.0.1:3000';
const localApiBaseUrl = process.env.LOCAL_API_BASE_URL ?? 'http://127.0.0.1:3000/api';

export const testTargets = {
  swaggerPetstore: {
    uiBaseUrl: publicUiBaseUrl,
    apiBaseUrl: withTrailingSlash(publicApiBaseUrl),
  },
  sauceDemo: {
    uiBaseUrl: sauceDemoUiBaseUrl,
    apiBaseUrl: withTrailingSlash(sauceDemoApiBaseUrl),
  },
  pethubLocal: {
    uiBaseUrl: localUiBaseUrl,
    apiBaseUrl: withTrailingSlash(localApiBaseUrl),
  },
} satisfies {
  swaggerPetstore: TestTargetConfig;
  sauceDemo: TestTargetConfig;
  pethubLocal: TestTargetConfig;
};

export const localAppPort = new URL(testTargets.pethubLocal.uiBaseUrl).port || '3000';
