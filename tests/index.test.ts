import {
  execADBCommandSync,
  execADBCommandAsync,
  spawnADBCommand,
  execADBCommand,
  getAdbDevices,
} from '../src';

describe('run adb cmd', () => {
  it('sync', () => {
    const res = execADBCommandSync('adb devices');
    console.log('sync', res);
    expect(res.includes('List of devices attached')).toBeTruthy();
  });

  it('async', async () => {
    const res = await execADBCommandAsync('adb devices');
    console.log('async', res);
    expect(res.includes('List of devices attached')).toBeTruthy();
  });

  it('exec', async () => {
    const res = execADBCommand('adb devices');
    return new Promise<void>((resolve, reject) => {
      res.stdout?.on('data', (data) => {
        console.log('exec', data);
        expect(
          data.toString().includes('List of devices attached')
        ).toBeTruthy();
        resolve();
      });
    });
  });

  it('spwan', () => {
    const res = spawnADBCommand('adb', ['devices']);
    return new Promise<void>((resolve, reject) => {
      res.stdout?.on('data', (data) => {
        console.log('spawn', data.toString());
        expect(
          data.toString().includes('List of devices attached')
        ).toBeTruthy();
        resolve();
      });
    });
  });
});

describe('api', () => {
  it('getDevices', async () => {
    const res = await getAdbDevices();
    console.log('devices:', res);
    expect(res).not.toBeNull();
  });
});
