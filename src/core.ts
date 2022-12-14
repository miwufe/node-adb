import {
  exec,
  execSync,
  spawn,
  ExecSyncOptionsWithStringEncoding,
  ChildProcessWithoutNullStreams,
  spawnSync,
} from 'child_process';
import { resolve, relative } from 'path';

const TIMEOUT = 8 * 10000;
const base = resolve(__dirname, '..', 'bin');
let hasSystemAdb: boolean | undefined;

export const supportedPlatform = ['win32', 'darwin', 'linux'] as const;
export type SupportedPlatform = typeof supportedPlatform[number];

export const ADB_BINARY_FILE = () => ({
  win32: process.env.NODE_ADB_BIN_PATH || resolve(base, 'win/adb.exe'),
  darwin: process.env.NODE_ADB_BIN_PATH || resolve(base, 'mac/adb'),
  linux: process.env.NODE_ADB_BIN_PATH || resolve(base, 'linux/adb'),
});

export function getAdbFullPath() {
  try {
    return ADB_BINARY_FILE()[process.platform as SupportedPlatform];
  } catch (error) {
    throw new Error(
      `Sorry, @miwt/adb not support your system, supported platform has ${supportedPlatform.toString()}\n` + error
    );
  }
}

export function getAdbReactivePath(cwd = process.cwd()) {
  try {
    return relative(cwd, ADB_BINARY_FILE()[process.platform as SupportedPlatform]);
  } catch (error) {
    throw new Error(
      `Sorry, @miwt/adb not support your system, supported platform has ${supportedPlatform.toString()}` + error
    );
  }
}

/** @description Is there an available ADB in your computer? */
export function isSystemAdbAvailable() {
  if (hasSystemAdb !== undefined) return hasSystemAdb;
  try {
    const res = execSync('adb version').toString().includes('Android Debug Bridge version');
    hasSystemAdb = res;
    return hasSystemAdb;
  } catch (e) {
    hasSystemAdb = false;
    return hasSystemAdb;
  }
}

export type AdbDeviceStatus = 'offline' | 'device' | 'unauthorized';

export const ipRegExp =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(\d+)$/;

export function ensureArgs(command: string, options?: ExecSyncOptionsWithStringEncoding) {
  let cwd = options?.cwd || process.cwd();
  if (!isSystemAdbAvailable()) {
    let cmd = command.split(' ');
    const binFile = getAdbFullPath();
    cmd[0] = binFile;
    command = cmd.join(' ');
  }
  const res: [string, ExecSyncOptionsWithStringEncoding] = [
    command,
    {
      ...options,
      cwd,
      timeout: options?.timeout || TIMEOUT,
    } as ExecSyncOptionsWithStringEncoding,
  ];
  return res;
}

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
        //?????????0???????????????
        return idx !== 0 && item !== '';
      })
      .map((item) => {
        const [sn, status] = item.split('\t') as [string, AdbDeviceStatus];
        return { sn, status };
      });
    return result;
  }
}

/**
 *  @description use sync method to run adb commamnd, will return a string
 *  @example execAdbCmdSync('adb devices')
 */
export function execAdbCmdSync(command: string, options?: ExecSyncOptionsWithStringEncoding) {
  return execSync(...ensureArgs(command, options)).toString();
}

/**
 *  @description use async method to run adb commamnd, will return a string
 *  @example execAdbCmdAsync('adb devices')
 */
export function execAdbCmdAsync(command: string, options?: ExecSyncOptionsWithStringEncoding & { log?: any }) {
  return new Promise<string>(async (resolve, reject) => {
    // ??????8s?????????????????????
    exec(...ensureArgs(command, options), (err, stdout) => {
      if (err) return reject(err);
      const msg: string = stdout.toString();
      return resolve(msg);
    });
  });
}

/**
 *  @description use exec method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  @example
 *  const lsProcess = execAdbCmd('adb shell ls /data/tmp')
 *  lsProcess.stdout.on('data',(data)=>{
 *    console.log(data.toString())
 *  })
 *
 *  const adbShell = spawnAdbCmd('adb', ['shell'])
 *  adbShell.stdin.write('ls /data/tmp \n')
 *  adbShell.stdin.write('ls /data/tmp/dir \n')
 */
export function execAdbCmd(command: string, options?: ExecSyncOptionsWithStringEncoding) {
  return exec(...ensureArgs(command, options)) as ChildProcessWithoutNullStreams;
}

/**
 *  @description use spawn method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  @description ?????? nodejs ????????????exec?????????????????? adb ?????????????????????????????????????????????????????????????????????????????? adb ??????
 *  @example
 *  const adbShell = spawnAdbCmd('adb', ['shell'])
 *  adbShell.stdin.write('ls /data/tmp \n')
 *  adbShell.stdin.write('ls /data/tmp/dir \n')
 */
export function spawnAdbCmd(command: string, args: string[], options?: ExecSyncOptionsWithStringEncoding) {
  const [cmd, opts] = ensureArgs(command, options);
  console.log('cmd', cmd, opts);
  return spawn(cmd, args, opts) as ChildProcessWithoutNullStreams;
}

/**
 *  @description use sync spawn method to run adb commamnd, will return a string
 *  @example spawnSyncAdbCmd('adb', ['devices'])
 */
export function spawnSyncAdbCmd(command: string, args?: string[], options?: ExecSyncOptionsWithStringEncoding) {
  const [cmd, opts] = ensureArgs(command, options);
  return spawnSync(cmd, args, opts);
}
