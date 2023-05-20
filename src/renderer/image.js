export const trim = (width, height, data) => {
  let x, y
  const box = { x1: width + 1, y1: height + 1, x2: -1, y2: -1 }
  L1: for (y = 0; y < height; y++) for (x = 0; x < width; x++) if (data[((y * width + x) * 4) + 3]) { box.y1 = y; break L1; }
  L2: for (y = height - 1; y > 0; y--) for (x = 0; x < width; x++) if (data[((y * width + x) * 4) + 3]) { box.y2 = y; break L2; }
  L3: for (x = 0; x < width; x++) for (y = 0; y < height; y++)  if (data[((y * width + x) * 4) + 3]) { box.x1 = x; break L3; }
  L4: for (x = width - 1; x > 0; x--) for (y = 0; y < height; y++)  if (data[((y * width + x) * 4) + 3]) { box.x2 = x; break L4; }
  return box
}

/**
 * Draw image to offscreen canvas, trim borders and return
 * trimmed pixel data.
 */
export const crop = canvas => image => {
  const ctx = context(canvas)
  const { naturalWidth: width, naturalHeight: height } = image
  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0)

  const original = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const box = trim(canvas.width, canvas.height, original.data)
  const data = ctx.getImageData(
    box.x1,
    box.y1,
    box.x2 - box.x1,
    box.y2 - box.y1
  )

  return { width, height, box, data }
}

export const put = canvas => (width, height, { box, data }) => {
  const ctx = context(canvas)
  canvas.width = width
  canvas.height = height
  const x = Math.ceil((width - (box.x2 - box.x1)) / 2)
  const y = Math.ceil((height - (box.y2 - box.y1)) / 2)
  ctx.putImageData(data, x, y)
  return ctx
}

export const setSource = image => src => {
  image.src = src
  return image.complete
}

export const source = fn => options =>
  options
    ? fn(options).toDataURL()
    : undefined

export const context = canvas => canvas.getContext('2d', { willReadFrequently: true })
