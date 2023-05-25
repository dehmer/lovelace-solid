import * as R from 'ramda'
import { createSignal, createEffect } from 'solid-js'

const Signal = value => {
  value.map = fn => Signal(() => fn(value()))
  value.ap = fn => Signal(() => fn()(value()))
  value.on = fn => createEffect(() => fn(value()))

  // Compatibility: fantasy-land
  value['fantasy-land/map'] = value.map
  value['fantasy-land/ap'] = value.ap
  return value
}

Signal.of = (initial, options) => {
  const [get, set] = createSignal(initial, options)
  return Signal(arg => R.isNil(arg) ? get() : set(arg))
}

Signal.reducer = (fn, initial, options) => {
  const [get, set] = createSignal(initial, options)
  return (...args) => args.length
    ? void set(state => fn(state, ...args))
    : get()
}

const timer = (fn, timeout) => {
  fn(timeout)
  setTimeout(() => timer(fn, timeout), timeout)
}

Signal.every = timeout => {
  const [get, set] = createSignal(undefined, { equals: false })
  timer(set, timeout)
  return Signal(get)
}

Signal.foldp =
Signal.scan =
  (fn, acc, signal) => Signal(() => {
    acc = fn(acc, signal())
    return acc
  })

export default Signal
