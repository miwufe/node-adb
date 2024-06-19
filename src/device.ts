import { execAdbCmdAsync } from './core';

export type AdbDeviceStatus = 'offline' | 'device' | 'unauthorized';

/** @description return adb devices  */
export async function getAdbDevices() {
  const list: string = await execAdbCmdAsync('adb devices');
  return _parseDeviceInfo(list);
  function _parseDeviceInfo(stdout: string) {
    if (!stdout) {
      return [];
    }
    const lines = stdout.replace(/(\n|\r\n){1,}/g, '\n').split('\n');
    const result = lines
      .filter((item, idx) => {
        //删除第0个和空元素
        return idx !== 0 && item !== '';
      })
      .map((item) => {
        const [sn, status] = item.split('\t') as [string, AdbDeviceStatus];
        return { sn, status };
      });
    return result;
  }
}

export async function connectDevice(sn: string) {
  try {
    const cmd = `adb connect ${sn}`;
    const res = await execAdbCmdAsync(cmd);
    let result = {
      status: false,
      msg: res,
    };
    if (/connected to/.test(res)) result.status = true;
    return result;
  } catch (error: any) {
    return {
      status: false,
      msg: error.toString(),
    };
  }
}

export async function disconnectDevice(sn: string) {
  try {
    const cmd = `adb disconnect ${sn}`;
    const res = await execAdbCmdAsync(cmd);
    let result = {
      status: false,
      msg: res,
    };
    if (/disconnected/.test(res)) result.status = true;
    return result;
  } catch (error: any) {
    return {
      status: false,
      msg: error.toString(),
    };
  }
}
