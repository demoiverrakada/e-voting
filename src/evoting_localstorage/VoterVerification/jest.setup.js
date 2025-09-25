// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
    },
  };
});

// Mock react-native modules that might not be available in test environment
jest.mock('react-native-fs', () => ({}));
jest.mock('react-native-camera', () => ({}));
jest.mock('react-native-qrcode-scanner', () => ({}));
jest.mock('react-native-document-picker', () => ({}));
jest.mock('react-native-permissions', () => ({}));
jest.mock('react-native-sha256', () => ({}));
jest.mock('react-native-status-bar-height', () => ({}));
jest.mock('rn-fetch-blob', () => ({}));
jest.mock('react-native-config', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));