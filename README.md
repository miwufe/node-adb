# node-adb

## en

node-adb contains adb binary files, so you can use the ADB command in the nodejs program, even if ADB is not installed in the user's computer environment

## 中文

ndoe-adb 包含 adb 所需的二进制文件，所有你可以在 nodejs 程序中运行 adb 命令，即使用户的电脑上没有安装 adb 。

# useage

```ts
import { getAdbDevices,} from 'ndoe-adb'

/**
 *  get adb devices list
 *  获取 adb 连接的设备列表
 */
cosnt list = await getAdbDevices()
// list: [ { sn: '0e2e40071d40xxxx', status: 'device' } ]

/**
 *  use sync method to run adb commamnd, will return a string
 *  同步方法运行一个 adb 命令
 */
const res = execADBCommandSync('adb devices');
// res: List of devices attached
// 0e2e40071d40xxxx        device

/**
 *  use async method to run adb commamnd, will return a string
 *  使用异步的方法运行一个 adb 命令
 */
 const res = await execADBCommandAsync('adb devices');
// res: List of devices attached
// 0e2e40071d40xxxx        device


/**
 *  use exec method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  使用 nodejs 子进程的exec方法运行一个adb命令，并返回这个子进程，
 *  使得你可以更细腻度的方式控制 adb
 */
const adbShell = spawnADBCommand('adb', ['shell'])
adbShell.stdin.write('ls /data/tmp \n')
adbShell.stdin.write('ls /data/tmp/dir \n')

/**
 *  use spawn method to run adb commamnd, will return a ChildProcess
 *  so than you can control the adb process more finely
 *  使用 nodejs 子进程的 spawn 方法运行一个adb命令，并返回这个子进程，
 *  使得你可以更细腻度的方式控制 adb
 */
const adbShell = spawnADBCommand('adb', ['shell'])
adbShell.stdin.write('ls /data/tmp \n')
adbShell.stdin.write('ls /data/tmp/dir \n')
```
