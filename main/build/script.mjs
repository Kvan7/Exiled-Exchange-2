import child_process from 'child_process'
import electron from 'electron'
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

const isDev = !process.argv.includes('--prod')
const debugPort = process.env.EE2_REMOTE_DEBUGGING_PORT || '9222'
const debugDir = path.resolve('.debug')
const electronLogPath = path.join(debugDir, 'electron.log')
const chromiumLogPath = path.join(debugDir, 'chromium.log')

if (isDev) {
  fs.mkdirSync(debugDir, { recursive: true })
}

const electronRunner = (() => {
  let handle = null
  return {
    restart () {
      console.info('Restarting Electron process.')

      if (handle) handle.kill()
      const args = (isDev)
        ? [
            '.',
            `--remote-debugging-port=${debugPort}`,
            '--enable-logging=file',
            `--log-file=${chromiumLogPath}`
          ]
        : ['.']
      const env = {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: (isDev) ? '1' : process.env.ELECTRON_ENABLE_LOGGING
      }

      if (isDev) {
        fs.appendFileSync(
          electronLogPath,
          `\n[${new Date().toISOString()}] Starting Electron with remote debugging on http://127.0.0.1:${debugPort}\n`
        )
        console.info(`Electron remote debugging: http://127.0.0.1:${debugPort}`)
        console.info(`Electron log: ${electronLogPath}`)
        console.info(`Chromium log: ${chromiumLogPath}`)
      }

      handle = child_process.spawn(electron, args, {
        env,
        stdio: (isDev) ? ['inherit', 'pipe', 'pipe'] : 'inherit'
      })

      if (isDev) {
        const logStream = fs.createWriteStream(electronLogPath, { flags: 'a' })
        handle.stdout.pipe(process.stdout)
        handle.stderr.pipe(process.stderr)
        handle.stdout.pipe(logStream)
        handle.stderr.pipe(logStream)
        handle.on('close', () => logStream.end())
      }
    }
  }
})()

const visionBuild = await esbuild.build({
  entryPoints: ['src/vision/link-worker.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/vision.js'
})

const mainContext = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: !isDev,
  platform: 'node',
  external: ['electron', 'uiohook-napi', 'electron-overlay-window', 'linux-evdev-wayland-helper'],
  outfile: 'dist/main.js',
  define: {
    'process.env.STATIC': (isDev) ? '"../build/icons"' : '"."',
    'process.env.VITE_DEV_SERVER_URL': (isDev) ? '"http://localhost:5173"' : 'null'
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
