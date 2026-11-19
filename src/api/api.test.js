describe('API base URL', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock('../appsettings.json');
  });

  test('uses the URL selected in appsettings.json', () => {
    const appSettings = require('../appsettings.json');
    const { API_BASE_URL } = require('./api');

    expect(API_BASE_URL).toBe(appSettings.ApiUrls[appSettings.BackendType]);
  });

  test('uses the Azure URL when BackendType is azure', () => {
    jest.doMock('../appsettings.json', () => ({
      BackendType: 'azure',
      ApiUrls: {
        local: 'http://localhost:5107/api',
        azure: 'https://ecommercestoredevapi-amdjeheceag6eedy.westus3-01.azurewebsites.net/api',
      },
    }));
    const { API_BASE_URL } = require('./api');
    jest.dontMock('../appsettings.json');

    expect(API_BASE_URL).toBe(
      'https://ecommercestoredevapi-amdjeheceag6eedy.westus3-01.azurewebsites.net/api'
    );
  });

  test('reports an unsupported BackendType', () => {
    jest.doMock('../appsettings.json', () => ({
      BackendType: 'unknown',
      ApiUrls: {},
    }));

    expect(() => require('./api')).toThrow('Use "local" or "azure".');
    jest.dontMock('../appsettings.json');
  });
});
