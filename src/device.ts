import { execAdbCmdAsync } from './core';

export type AdbDeviceStatus = 'offline' | 'device' | 'unauthorized';

/**
 * Upper bound for `adb devices`. A healthy call returns in tens of
 * milliseconds; without any bound a wedged adb server leaves the returned
 * promise pending forever, and callers that poll keep spawning more adb
 * processes on top of the stuck one.
 */
export const DEFAULT_ADB_DEVICES_TIMEOUT_MS = 10_000;

export interface GetAdbDevicesOptions {
  /** Override the default bound. Pass a tighter value when polling. */
  timeoutMs?: number;
}

/** @description return adb devices  */
export async function getAdbDevices(options?: GetAdbDevicesOptions) {
  const { timeoutMs = DEFAULT_ADB_DEVICES_TIMEOUT_MS } = options || {};
  const list: string = await execAdbCmdAsync('adb devices', {
    encoding: 'utf-8',
    timeoutMs,
  });
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
