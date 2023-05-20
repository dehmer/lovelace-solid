import * as R from 'ramda'
import { Level } from 'level'
const { EntryStream, KeyStream } = require('level-read-stream')
import hash from 'object-hash'
import { STD_2525_C } from './options'
import { TACGRP_2525_C } from './options'
import { CONTEXT } from './options'
import { DIMENSION, INSTALLATION } from './options'
import { IDENTITY_BASE, IDENTITY_EXTENTED, IDENTITY } from './options'
import { ECHELON } from './options'
import { ENGAGEMENT } from './options'
import { STATUS_BASE, STATUS_EXTENDED, STATUS } from './options'
import * as SIDC from './format'

const assign = xs => xs.reduce((a, b) => Object.assign(a, b), {})
const xprod = (...xss) =>
  xss.reduce((acc, xs) => acc.flatMap(a => xs.map(x => [...a, x])), [[]])

const sidc = sidc => ({ sidc })
const format = xs => {
  const { sidc, ...options } = assign(xs)
  return { sidc: SIDC.format(options, sidc) }
}

const preset = (sidc, options = {}) => ({
  sidc: SIDC.format(options, sidc), ...options
})

const makeSet = (name, xs) => xs.map(value => [`${name}+${hash(value)}`, value])

const sets = [
  // Basic dimensions with present status:
  ...makeSet(
    '2525C+PRESENT',
    xprod(
      DIMENSION,
      IDENTITY_BASE,
      [{ status: 'PRESENT' }]
    ).map(format)
  ),

  // All 2525C plain icons (unknown, friend, hostile and neutral):
  ...makeSet(
    '2525C+ICON',
    xprod(
      STD_2525_C.map(sidc),
      IDENTITY_BASE,
      [{ status: 'PRESENT' }]
    ).map(format)
  ),

  // All 2525C monochrome icons (unknown, friend, hostile and neutral):
  ...makeSet(
    '2525C+MONOCHROME',
    xprod(
      xprod(
        STD_2525_C.map(sidc),
        IDENTITY_BASE,
        [{ status: 'PRESENT' }]
      ).map(format),
      [{ monoColor: 'green' }]
    ).map(assign)
  ),

  ...makeSet(
    '2525C+ENGAGEMENT',
    xprod(
      xprod(DIMENSION, IDENTITY, [{ status: 'PRESENT' }]).map(format),
      ENGAGEMENT
    ).map(assign)
  ),

  ...makeSet(
    '2525C+ECHELON',
    xprod(DIMENSION, IDENTITY_BASE, ECHELON, [{ status: 'PRESENT' }]).map(format)
  ),

  ...makeSet(
    '2525C+AMPLIFIERS',
    xprod(
      xprod(DIMENSION, IDENTITY, [{ status: 'PRESENT' }]).map(format),
      [{
        infoFields: true,
        uniqueDesignation: 'TANGO',
        higherFormation: '1/2',
        dtg: 'O/O'
      }]
    ).map(assign)
  ),

  ...makeSet(
    '2525C+ISSUE',
    [
      preset('SFGCUCII--*****', {
        infoFields: true,
        uniqueDesignation: 'ALPHA'
      }),
      preset('SFAPMFQP--*****', {
        infoFields: true,
        uniqueDesignation: '55',
        outlineWidth: 3,
        outlineColor: 'white',
        monoColor: 'blue'
      }),
      preset('SFGCUCII--*****', {
        infoFields: true,
        uniqueDesignation: 'ALPHA',
        engagementBar: 'A:BBB-CC',
        engagementType: 'EXPIRED'
      }),
      preset('GFGPGPRD--*****', {
        outlineWidth: 3,
        outlineColor: 'white'
      }),
      preset('GFGPGPRD--*****', {
        outlineWidth: 3,
        outlineColor: 'white',
        monoColor: 'blue'
      })
    ]
  )
]

export default async (prefix) => {
  const db = new Level('database')
  const symbolDB = db.sublevel('symbol', { valueEncoding: 'json' })
  const distanceDB = db.sublevel('distance', { valueEncoding: 'json' })

  const populate = () => {
    const ops = sets.map(([key, value]) => ({ type: 'put', sublevel: symbolDB, key, value }))
    return db.batch(ops)
  }

  const predefinedDistances = async () => {
    // distanceDB.put('2525C+ISSUE+0ae407c2ddbcedffa069baf3c1e98c17886843a6', 6042)
    // distanceDB.put('2525C+ISSUE+1069ec92e60cba7cb198ef3836a986ee34a870e3', 9456)
    // distanceDB.put('2525C+ISSUE+79990fcb02dde378b045156cd99ad4e617eff74c', 2516)
  }

  const options = prefix => prefix
    ? { gte: prefix, lte: prefix + 0xff }
    : {}

  const keys = async (prefix) => {
    const acc = []
    const stream = new KeyStream(symbolDB, options(prefix))
    for await (const key of stream) acc.push(key)
    return acc
  }

  const delSymbols = keys => {
    return symbolDB.batch(keys.map(key => ({ type: 'del', key })))
  }

  const delDistances = keys => {
    return distanceDB.batch(keys.map(key => ({ type: 'del', key })))
  }

  const symbols = async () => {
    const stream = new EntryStream(symbolDB, options(prefix))
    const acc = []
    for await (const { key, value } of stream) acc.push({ ...value, key })
    const keys = R.map(R.prop('key'), acc)
    const distances = await distanceDB.getMany(keys)
    const symbols = acc.map((symbol, index) => ({ ...symbol, distance: distances[index] }))
    return symbols
  }

  // await delSymbols(await keys(prefix))
  // await delDistances(await keys(prefix))
  await db.clear()
  // await distanceDB.clear()
  await predefinedDistances()
  await populate()

  return {
    symbols,
    distance: (key, value) => distanceDB.put(key, value),
    dispose: () => db.close()
  }
}
