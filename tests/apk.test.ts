import path from 'path';
import { getAdbDevices, installApk, isApkInstalled, uninstallApk } from '../src';

describe('apk', () => {
  let device: string;
  const testApp = 'org.hapjs.debugger';

  beforeAll(async () => {
    const list = await getAdbDevices();
    let res = list.find((item) => item.status === 'device');
    if (!res) throw Error('not find android device');
    else device = res.sn;
  });

  it('not installed', async () => {
    const res = await isApkInstalled(device, testApp);
    console.log('not installed.res.msg', res);
    expect(res.status).not.toBeTruthy();
  });

  it('install', async () => {
    const res = await installApk(device, path.resolve(__dirname, './static/quickapp_debugger_car.apk'));
    console.log('install.res.msg', res);
    expect(res.status).toBeTruthy();
  });

  it('isInstalled', async () => {
    const res = await isApkInstalled(device, testApp);
    console.log('isInstalled.res.msg', res);
    expect(res.status).toBeTruthy();
  });

  it('uninstall', async () => {
    const res = await uninstallApk(device, testApp);
    console.log('uninstall.res.msg', res);
    expect(res.status).toBeTruthy();
  });
});
