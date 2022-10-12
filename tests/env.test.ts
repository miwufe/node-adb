import { execAdbCmdSync, getAdbFullPath } from '../src';

describe('env', () => {
  beforeAll(() => {
    process.env.NODE_ADB_BIN_PATH_MAC = '/Users/lin/Downloads/归档/node_modules/adb-driver/bin/mac/adb';
    process.env.NODE_ADB_BIN_PATH_WINDOWS = '/adssadlasdkj';
    process.env.NODE_ADB_BIN_PATH_LINUX = '/adssadlasdkj';
  });

  it('env', () => {
    expect(
      [
        process.env.NODE_ADB_BIN_PATH_MAC,
        process.env.NODE_ADB_BIN_PATH_WINDOWS,
        process.env.NODE_ADB_BIN_PATH_LINUX,
      ].includes(getAdbFullPath())
    ).toBeTruthy();
  });

  it('api', () => {
    const res = execAdbCmdSync('adb devices');
    console.log('sync', res);
    expect(res.includes('List of devices attached')).toBeTruthy();
  });
});
