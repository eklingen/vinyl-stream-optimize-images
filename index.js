// Small vinyl-stream wrapper -aka Gulp plugin- for optimizing images.
// Jpegoptim, Optipng, Svgo

const { access, chmod } = require('fs').promises
const { exec } = require('child_process')
const { join } = require('path')
const { platform, arch } = require('os')
const { Transform, Readable } = require('stream')

const isJPG = buffer => buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
const isPNG = buffer => buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
const isSVG = buffer => buffer.toString('utf8').indexOf('<svg') !== -1

const jpegoptimBinary = join(module.path, `/vendor/jpegoptim-1.4.6/${platform()}-${arch()}/jpegoptim${platform() === 'win32' ? '.exe' : ''}`)
const pngquantBinary = join(module.path, `/vendor/pngquant-2.12.5/${platform()}-${arch()}/jpegoptim${platform() === 'win32' ? '.exe' : ''}`)

const DEFAULT_OPTIONS = {
  swallowUnchanged: true,
  minDecrease: 16 * 1024, // 16KB
  maxBuffer: 64 * 1024 * 1024, // 64 MB

  jpegoptim: {
    stripComments: true,
    stripEXIF: true,
    stripIPTC: true,
    stripICC: true,
    stripXMP: true,
    forceProgressive: true,
    max: null,
    size: null
  },

  pngquant: {
    quality: [30, 50],
    speed: 4,
    disableDithering: false,
    strip: true
  },

  svgo: {
    multipass: false,
    datauri: 'base64',
    plugins: [
      // 'addAttributesToSVGElement',
      // 'addClassesToSVGElement',
      'cleanupAttrs',
      'cleanupEnableBackground',
      'cleanupIDs',
      'cleanupListOfValues',
      'cleanupNumericValues',
      'collapseGroups',
      { name: 'convertColors', params: { currentColor: true, names2hex: true, rgb2hex: true, shorthex: true, shortname: true } },
      // 'ConvertEllipseToCircle',
      'convertPathData',
      // 'convertShapeToPath',
      'convertStyleToAttrs',
      'convertTransform',
      'inlineStyles',
      // 'mergePaths',
      'mergeStyles',
      'minifyStyles',
      // 'moveGroupAttrsToElements',
      // 'prefixIds',
      // 'removeAttributesBySelector',
      { name: 'removeAttrs', params: { attrs: '(stroke|fill)' } },
      'removeComments',
      'removeDesc',
      // 'removeDimensions',
      'removeDoctype',
      'removeEditorsNSData',
      // 'removeElementsByAttr',
      'removeEmptyAttrs',
      'removeEmptyContainers',
      'removeEmptyText',
      'removeHiddenElems',
      'removeMetadata',
      'removeNonInheritableGroupAttrs',
      // 'remoceOffCanvasPaths',
      'removeRasterImages',
      // 'removeScriptElement',
      // 'removeStyleElement',
      'removeTitle',
      'removeUnknownsAndDefaults',
      'removeUnusedNS',
      'removeUselessDefs',
      // 'removeUselessStrokeAndFill',
      // 'removeViewBox',
      // 'removeXMLNS',
      'removeXMLProcInst',
      // 'reusePaths', TODO: Check if this can be safely enabled
      'sortAttrs',
      'sortDefsChildren'
    ],
    js2svg: { indent: 2, pretty: true }
  }
}

async function chmodBinaries () {
  if (platform() === 'win32') {
    return
  }

  try {
    await access(jpegoptimBinary, 1, async error => !error || chmod(jpegoptimBinary, 0o744))
    await access(pngquantBinary, 1, async error => !error || chmod(pngquantBinary, 0o744))
  } catch (e) {
    //
  }
}

async function runBinary (buffer, binary = '', args = [], maxBuffer) {
  if (!binary) {
    return
  }

  await chmodBinaries()

  return new Promise((resolve, reject) => {
    try {
      const child = exec(`${binary} ${args.join(' ')}`, { encoding: null, maxBuffer: maxBuffer, windowsHide: true }, (err, stdout, stderr) => resolve(err ? stderr : stdout))
      child.stdin.on('error', error => console.log('Could not pipe to executable. Try to `chmod +x` it.') && console.log(error))

      const stdin = new Readable({ encoding: null, maxBuffer: maxBuffer })
      stdin.push(buffer)
      stdin.push(null)
      stdin.pipe(child.stdin)
    } catch (error) {
      reject(error)
    }
  })
}

async function runSVGO (string = '', options = {}) {
  options = { ...DEFAULT_OPTIONS.svgo, ...options }

  const { optimize } = require('svgo')
  const result = await optimize(string, options)

  return result.data
}

function jpegoptimArgs (options = {}) {
  options = { ...DEFAULT_OPTIONS.jpegoptim, ...options }

  const args = ['--stdin', '--stdout']

  if (options.stripComments) {
    args.push('--strip-com')
  }

  if (options.stripEXIF) {
    args.push('--strip-exif')
  }

  if (options.stripIPTC) {
    args.push('--strip-iptc')
  }

  if (options.stripICC) {
    args.push('--strip-icc')
  }

  if (options.stripXMP) {
    args.push('--strip-xmp')
  }

  if (options.forceProgressive) {
    args.push('--all-progressive')
  }

  if (options.max !== null) {
    args.push(`--max=${options.max}`)
  }

  if (options.size !== null) {
    args.push(`--size=${options.size}`)
  }

  return args
}

function pngquantArgs (options = {}) {
  options = { ...DEFAULT_OPTIONS.pngquant, ...options }

  const args = ['-']

  if (options.quality !== null) {
    args.push('--quality', `${options.quality[0]}-${options.quality[1]}`)
  }

  if (options.speed !== null) {
    args.push('--speed', options.speed)
  }

  if (options.disableDithering) {
    args.push('--nofs')
  }

  if (options.strip) {
    args.push('--strip')
  }

  return args
}

function optimizeImages (options = {}) {
  async function transform (file, encoding, callback) {
    options = ({ ...DEFAULT_OPTIONS, ...options })

    const contents = file.contents.toString('utf8')
    const oldLength = contents.length

    let result

    if ((file.extname === '.svg') && isSVG(contents)) {
      result = await runSVGO(contents, options.svgo)
    } else if ((file.extname === '.jpg' || file.extname === '.jpeg') && isJPG(file.contents)) {
      result = await runBinary(file.contents, jpegoptimBinary, [...jpegoptimArgs(options.jpegoptim)], options.maxBuffer)
    } else if (file.extname === '.png' && isPNG(file.contents)) {
      result = await runBinary(file.contents, pngquantBinary, [...pngquantArgs(options.optipng)], options.maxBuffer)
    }

    if (result && result.length < (oldLength - options.minDecrease)) {
      file.contents = Buffer.from(result)
      return callback(null, file)
    }

    return options.swallowUnchanged ? callback() : callback(null, file)
  }

  return new Transform({ transform, readableObjectMode: true, writableObjectMode: true })
}

module.exports = optimizeImages
