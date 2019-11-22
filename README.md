
# Small vinyl-stream wrapper -aka Gulp plugin- for image optimization utilities.

Run image optimization utilities within your streams. Contains `jpegoptim` and `pngquant` binaries within the package for *win32* (ie: Windows), *darwin* (ie: OS-X) and *linux*. Has `svgo` as a dependency.

> *NOTE:* No tests have been written yet!

## Installation

`yarn install`. Or `npm install`. Or just copy the files to your own project.

## Usage

```
const optimizeImages = require('@eklingen/vinyl-stream-optimize-images')
stream.pipe(optimizeImages())
```

## Options

You have the following options:

### `swallowUnchanged`

This will determine if unchanged files are removed from the stream. Default: `true`.

```
optimizeImages({
  swallowUnchanged: true
})
```

### `minDifference`

This will determine the minimum size decrease to mark the file as "changed". Default is `16 * 1024`, or 16KB.

```
optimizeImages({
  minDifference: 16 * 1024
})
```

### `maxBuffer`

This will determine the maximum buffer size to use. Default is `64 * 1024 * 1024`, or 64MB.

```
optimizeImages({
  maxBuffer: 64 * 1024 * 1024
})
```

### `jpegoptim`

These options are passed to `jpegoptim`. Run `yarn jpegoptim --help` for more details.

```
optimizeImages({
  jpegoptim: {
    stripComments: true, // Strip comments
    stripEXIF: true, // Strip EXIF metadata
    stripIPTC: true, // Strip IPTC data
    stripICC: true, // Strip ICC color profiles
    stripXMP: true, // Strip XMP metadata
    forceProgressive: true, // Force all images as progressive jpeg's (blurry first)
    max: null, // Maximum quality 0-100
    size: null, // Try to optimize to certain filesize
  }
})
```

### `pngquant`

These options are passed to `pngquant`. Run `yarn pngquant --help` for more details.

```
optimizeImages({
  pngquant: {
    quality: [30, 50], // Quality min/max 0-100
    speed: 4, // Speed 1-11 where 1=slowest, 11=fastest
    disableDithering: false, // Disable dithering
    strip: true // Strip metadata
  }
})
```

### `svgo`

These options are passed to `svgo`. Run `yarn svgo --help` for more details.

```
optimizeImages({
  svgo: {
    plugins: [
      { addAttributesToSVGElement: false },
      { addClassesToSVGElement: false },
      { cleanupAttrs: true },
      { cleanupEnableBackground: true },
      { cleanupIDs: true },
      { cleanupListOfValues: true },
      { cleanupNumericValues: true },
      { collapseGroups: true },
      { convertColors: { currentColor: true, names2hex: true, rgb2hex: true, shorthex: true, shortname: true } },
      { convertPathData: true },
      { convertShapeToPath: false },
      { convertStyleToAttrs: true },
      { convertTransform: true },
      { mergePaths: false },
      { minifyStyles: true },
      { moveElemensAttrsToGroup: true },
      { moveGroupAttrsToElements: false },
      { removeAttrs: { attrs: '(stroke|fill)' } },
      { removeComments: true },
      { removeDesc: true },
      { removeDimensions: false },
      { removeDoctype: true },
      { removeEditorsNSData: true },
      { removeElementsByAttr: false },
      { removeEmptyAttrs: true },
      { removeEmptyContains: true },
      { removeEmptyText: true },
      { removeHiddenElems: true },
      { removeMetadata: true },
      { removeNonInheritableGroupAttrs: true },
      { removeRasterImages: true },
      { removeScriptElement: false },
      { removeStyleElement: false },
      { removeTitle: true },
      { removeUnknownsAndDefaults: true },
      { removeUnusedNS: true },
      { removeUselessDefs: true },
      { removeUselessStrokeAndFill: false },
      { removeViewBox: false },
      { removeXMLNS: false },
      { removeXMLProcInst: true },
      { sortAttrs: true }
    ],
    js2svg: { pretty: true }
  }
})
```

### Installation size

If you're worried about package installation size, the executables are not that large. However, you can add the following to your `.yarnclean` file: `@eklingen/vinyl-stream-optimize-images/vendor/<platform>/*` where the platforms are those you don't need.

## Dependencies

This package requires ["svgo"](https://www.npmjs.com/package/svgo).

---

Copyright (c) 2019 Elco Klingen. MIT License.
