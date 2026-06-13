import child_process from 'child_process'
import electron from 'electron'
import esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const isDev = !process.argv.includes('--prod')
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173'

const electronRunner = (() => {
  let handle = null
  return {
    restart () {
      console.info('Restarting Electron process.')

      if (handle) handle.kill()
      handle = child_process.spawn(electron, ['.'], {
        stdio: 'inherit'
      })
    }
  }
})()

const visionBuild = await esbuild.build({
  entryPoints: ['src/vision/link-worker.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/vision.js'
})

const linuxHelper = path.resolve('../native/linux-evdev-helper/linux-evdev-helper')
if (process.platform === 'linux' && fs.existsSync(linuxHelper)) {
  const dest = 'dist/linux-evdev-helper'
  const temp = `${dest}.${process.pid}.tmp`
  fs.copyFileSync(linuxHelper, temp)
  fs.chmodSync(temp, 0o755)
  fs.renameSync(temp, dest)
}

const mainContext = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: !isDev,
  platform: 'node',
  external: ['electron', 'uiohook-napi', 'electron-overlay-window'],
  outfile: 'dist/main.js',
  define: {
    'process.env.STATIC': (isDev) ? '"../build/icons"' : '"."',
    'process.env.VITE_DEV_SERVER_URL': (isDev) ? JSON.stringify(devServerUrl) : 'null'
  },
  plugins: (isDev) ? [{
    name: 'electron-runner',
    setup (build) {
      build.onEnd((result) => {
        if (!result.errors.length) electronRunner.restart()
      })
    }
  }] : []
})

if (isDev) {
  await mainContext.watch()
} else {
  await mainContext.rebuild()
  mainContext.dispose()
}
