import {
  exec,
  execSync,
  spawn,
  ExecSyncOptionsWithStringEncoding,
  ChildProcess,
  ChildProcessWithoutNullStreams,
  spawnSync,
} from 'child_process';
import { resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import treeKill from 'tree-kill';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

const base = resolve(_dirname, '..', 'bin');
let hasSystemAdb: boolean | undefined;

export const supportedPlatform = ['win32', 'darwin', 'linux'] as const;
export type SupportedPlatform = (typeof supportedPlatform)[number];

/**
 * Enum for specifying the preferred ADB module type.
 *
 * @enum {string}
 * @example
 * process.env.NODE_ADB_BIN_PATH = '/path/to/your/customBin'
 * process.env.PRIORITY_ADB_MODULE_TYPE = 'custom'
 */
export enum PriorityAdbModuleType {
  /**
   * Use the ADB module installed on the host machine.
   * @type {string}
   */
  Host = 'host',

  /**
   * Use the internal ADB module provided by the plugin.
   * @type {string}
   */
  Internal = 'internal',

  /**
   * Use a custom ADB module specified by the environment variable `NODE_ADB_BIN_PATH`.
   * @type {string}
   */
  Custom = 'custom',
}

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
    const res = execSync('adb version', {
      encoding: 'utf8',
    }).includes('Android Debug Bridge version');
    hasSystemAdb = res;
    return hasSystemAdb;
  } catch (e) {
    hasSystemAdb = false;
    return hasSystemAdb;
  }
}

export const ipRegExp =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(\d+)$/;

/**
 * get available adb command
 * 1. host adb command available return 'adb'
 * 2. custom adb command available return custom adb executable path
 * 3. return our internal adb executable path
 */
export function getAdbCmd() {
  if (
    process.env.PRIORITY_ADB_MODULE_TYPE === PriorityAdbModuleType.Custom ||
    process.env.PRIORITY_ADB_MODULE_TYPE === PriorityAdbModuleType.Internal ||
    !isSystemAdbAvailable()
  ) {
    return getAdbFullPath();
  }
  return 'adb';
}

export function ensureArgs(command: string, options?: ExecSyncOptionsWithStringEncoding) {
  let cwd = options?.cwd || process.cwd();
  if (
    process.env.PRIORITY_ADB_MODULE_TYPE === PriorityAdbModuleType.Custom ||
    process.env.PRIORITY_ADB_MODULE_TYPE === PriorityAdbModuleType.Internal ||
    !isSystemAdbAvailable()
  ) {
    let cmd = command.split(' ');
    const binFile = getAdbFullPath();
    cmd[0] = `"${binFile}"`;
    // On Windows, cmd.exe /s strips the outermost quotes after /c,
    // so wrapping the whole command in an extra pair of quotes ensures
    // inner quotes (for the path with spaces) are preserved.
    command = process.platform === 'win32' ? `"${cmd.join(' ')}"` : cmd.join(' ');
  }
  const res: [string, ExecSyncOptionsWithStringEncoding] = [
    command,
    {
      ...options,
      cwd,
    } as ExecSyncOptionsWithStringEncoding,
  ];
  return res;
}

/**
 *  @description use sync method to run adb commamnd, will return a string
 *  @example execAdbCmdSync('adb devices')
 */
export function execAdbCmdSync(command: string, options?: ExecSyncOptionsWithStringEncoding) {
  return execSync(
    ...ensureArgs(command, {
      encoding: 'utf8',
      ...options,
    })
  );
}

/**
 *  @description use async method to run adb commamnd, will return a string
 *  @example execAdbCmdAsync('adb devices')
 *  @example execAdbCmdAsync('adb devices', { timeoutMs: 10000 })
 */
export function execAdbCmdAsync(
  command: string,
  options?: ExecSyncOptionsWithStringEncoding & { log?: any; timeoutMs?: number }
) {
  const { timeoutMs, ...restOptions } = options || {};
  return new Promise<string>((resolve, reject) => {
    const child: ChildProcess = exec(
      ...ensureArgs(command, {
        encoding: 'utf-8',
        ...restOptions,
      }),
      (err, stdout, stderr) => {
        if (timer) clearTimeout(timer);
        if (err) return reject(err);
        const msg: string = stdout || stderr;
        return resolve(msg);
      }
    );

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs && timeoutMs > 0 && child.pid) {
      timer = setTimeout(() => {
        treeKill(child.pid!, 'SIGKILL', (killErr) => {
          reject(
            new AdbTimeoutError(
              `adb command timed out after ${timeoutMs}ms: ${command}`,
              command,
              timeoutMs,
              killErr ?? undefined
            )
          );
        });
      }, timeoutMs);
    }
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
 *  @description 使用 nodejs 子进程的exec方法运行一个 adb 命令，并返回这个子进程，使得你可以更细腻度的方式控制 adb 命令
 *  @example
 *  const adbShell = spawnAdbCmd('adb', ['shell'])
 *  adbShell.stdin.write('ls /data/tmp \n')
 *  adbShell.stdin.write('ls /data/tmp/dir \n')
 */
export function spawnAdbCmd(command: string, args: string[], options?: ExecSyncOptionsWithStringEncoding) {
  const [cmd, opts] = ensureArgs(command, options);
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

export class AdbTimeoutError extends Error {
  readonly command: string;
  readonly timeoutMs: number;
  readonly killError?: Error;

  constructor(message: string, command: string, timeoutMs: number, killError?: Error) {
    super(message);
    this.name = 'AdbTimeoutError';
    this.command = command;
    this.timeoutMs = timeoutMs;
    this.killError = killError;
  }
}

export interface AdbDeadlockDetectorOptions {
  /** Timeout (ms) for the health-check `adb devices` probe. Default: 5000 */
  probeTimeoutMs?: number;
  /** Callback invoked when deadlock is detected (probe process already killed via tree-kill). */
  onDeadlockDetected?: () => Promise<void> | void;
}

/**
 * Probe whether the adb daemon is responsive.
 * If `adb devices` hangs beyond probeTimeoutMs, the hung process is killed
 * via tree-kill (timeoutMs in execAdbCmdAsync), then onDeadlockDetected is called.
 */
export async function checkAdbHealth(options?: AdbDeadlockDetectorOptions): Promise<boolean> {
  const { probeTimeoutMs = 5000, onDeadlockDetected } = options || {};
  try {
    await execAdbCmdAsync('adb devices', { encoding: 'utf-8', timeoutMs: probeTimeoutMs });
    return true;
  } catch (err) {
    if (err instanceof AdbTimeoutError) {
      if (onDeadlockDetected) {
        await onDeadlockDetected();
      }
      return false;
    }
    throw err;
  }
}
