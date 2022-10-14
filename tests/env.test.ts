import { execAdbCmdSync, getAdbFullPath } from '../src';

describe('env', () => {
  beforeAll(() => {
    process.env.NODE_ADB_BIN_PATH = '/Users/lin/Downloads/归档/node_modules/adb-driver/bin/mac/adb';
  });

  it('env', () => {
    expect(getAdbFullPath()).toBe(process.env.NODE_ADB_BIN_PATH);
  });

  it('api', () => {
    const res = execAdbCmdSync('adb devices');
    console.log('sync', res);
    expect(res.includes('List of devices attached')).toBeTruthy();
  });
});
