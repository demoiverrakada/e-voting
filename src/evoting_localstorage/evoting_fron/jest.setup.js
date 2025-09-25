// Set up global variables
global.__DEV__ = true;

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Image: 'Image',
  Alert: {
    alert: jest.fn(),
  },
  NativeModules: {},
  AppRegistry: {
    registerComponent: jest.fn(),
  },
}));

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