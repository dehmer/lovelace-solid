import * as R from 'ramda'
import ms from 'milsymbol'
import { Symbol } from '@syncpoint/signs/src'
import * as SIDC from './format'
import * as Modifiers from './aliases'
import sidcSpecial from './sidc-special.json'
import sidcSKKM from './sidc-skkm.json'
import { ms2525c } from 'mil-std-2525'

const mainIcons = R.curry((filter, arg) => arg.mainIcon
  ? filter.length
    ? filter.includes(arg.name) ? arg.mainIcon : []
    : arg.mainIcon
  : Object.values(arg).reduce((acc, value) => typeof value === 'object'
    ? acc.concat(mainIcons(filter, value))
    : acc
  , [])
)

const isAvailable = icon => icon.remarks !== 'N/A'
const isPoint = icon => icon.geometry
  ? icon.geometry === 'POINT'
  : icon.geometry !== ''

const makeSIDC = ({ codingscheme, battledimension, functionid }) =>
  `${codingscheme}*${battledimension}*${functionid}*****`

const fn = collect => R.compose(
    R.map(makeSIDC),
    R.filter(isPoint),
    R.filter(isAvailable),
    collect
)

export const STD_2525_C = fn(mainIcons([]))(ms2525c)
export const TACGRP_2525_C = fn(mainIcons(['TACTICAL GRAPHICS']))(ms2525c)

const assign = xs => xs.reduce((a, b) => Object.assign(a, b), {})
const xprod = (...xss) =>
  xss.reduce((acc, xs) => acc.flatMap(a => xs.map(x => [...a, x])), [[]])

const sidc = sidc => ({ sidc })
const format = xs => {
  const { sidc, ...options } = assign(xs)
  return { sidc: SIDC.format(options, sidc) }
}

export const CONTEXT = [{}, { exercise: true }] // no simulation for 2525C
export const ECHELON = [
  'TEAM', 'SQUAD', 'SECTION', 'PLATOON', 'COMPANY',
  'BATTALION', 'REGIMENT', 'BRIGADE', 'DIVISION',
  'CORPS', 'ARMY', 'ARMY_GROUP', 'REGION', 'COMMAND'
].map(echelon => ({ echelon }))

export const IDENTITY_BASE = [
  { identity: 'UNKNOWN' },
  { identity: 'FRIEND' },
  { identity: 'NEUTRAL' },
  { identity: 'HOSTILE' }
]

export const IDENTITY_EXTENTED = [
  { identity: 'PENDING' },
  { identity: 'ASSUMED_FRIEND' },
  { identity: 'SUSPECT' },
  { identity: 'JOKER' },
  { identity: 'FAKER' }
]

export const IDENTITY = [...IDENTITY_BASE, ...IDENTITY_EXTENTED]

const MOBILITY = [
  'WHEELED_LIMITED', 'WHEELED', 'TRACKED', 'HALF_TRACK',
  'TOWED', 'RAIL', 'PACK_ANIMALS', 'OVER_SNOW', 'SLED',
  'BARGE', 'AMPHIBIOUS', 'TOWED_ARRAY_SHORT', 'TOWED_ARRAY_LONG'
].map(mobility => ({ mobility }))

const HEADQUARTERS = [{ headquarters: false }, { headquarters: true }]
const MODIFIERS = xprod(
  [{ headquarters: false }, { headquarters: true }],
  [{ taskForce: false }, { taskForce: true }],
  [{ feint: false }, { feint: true }]
).map(assign)

export const STATUS_BASE = [
  { status: 'PLANNED'},
  { status: 'PRESENT' },
]

export const STATUS_EXTENDED = [
  { status: 'FULLY_CAPABLE'},
  { status: 'DAMAGED'},
  { status: 'DESTROYED'},
  { status: 'FULL_TO_CAPACITY'}
]

export const STATUS = [...STATUS_BASE, ...STATUS_EXTENDED]

// Without installations
export const DIMENSION = [
  'S-A-------*****',  // AIR
  'S-P-------*****',  // SPACE
  'S-G-U-----*****',  // UNIT (LAND)
  'S-G-E-----*****',  // EQUIPMENT (LAND)
  'S-S-------*****',  // SEA SURFACE
  'I-U-------*****',  // SEA SUBSURFACE
  'O-V-------*****',  // ACTIVITY/EVENT
].map(sidc => ({ sidc }))

export const INSTALLATION = [
  'S-G-------H****',  // INSTALLATION
]

export const ENGAGEMENT = [
  { modifiers: { AO: 'A:BBB-CC', AT: 'TARGET' } },
  { modifiers: { AO: 'A:BBB-CC', AT: 'NON-TARGET' } },
  { modifiers: { AO: 'A:BBB-CC', AT: 'EXPIRED' } }
]

const DIRECTION = R.range(0, 24).map(i => ({ modifiers: { Q: 15 * i } }))

const preset = (sidc, options = {}) => ({
  sidc: SIDC.format(options, sidc), ...options
})

export const sets = {
  'set:dimension/present':
  xprod(DIMENSION, IDENTITY_BASE, [{ status: 'PRESENT' }]).map(format),

  'set:icons/2525c':
    xprod(
      STD_2525_C.map(sidc),
      IDENTITY_BASE,
      [{ status: 'PRESENT' }]
    ).map(format),

  'set:icons/skkm':
    xprod(
      sidcSKKM.map(sidc),
      IDENTITY_BASE,
      [{ status: 'PRESENT' }],
    ).map(format),

  'K-G-HFL--------': [
    preset('K-G-HFL--------', {
      infoFields: true,
      "reinforcedReduced":"(+)",
      "additionalInformation":"additional info",
      "uniqueDesignation":"unique designation"
    })
  ],


  'set:icons/monochrome':
    xprod(
      xprod(
        STD_2525_C.map(sidc),
        IDENTITY_BASE,
        [{ status: 'PRESENT' }]
      ).map(format),
      [{ monoColor: 'green' }]
    ).map(assign),

  'set:echelon': xprod(DIMENSION, IDENTITY_BASE, ECHELON, [{ status: 'PRESENT' }]).map(format),
  'set:modifiers': xprod(DIMENSION, IDENTITY, MODIFIERS, [{ status: 'PRESENT' }]).map(format),
  'set:mobility': xprod(DIMENSION, IDENTITY, MOBILITY, [{ status: 'PRESENT' }]).map(format),
  'set:engagement':
    xprod(
      xprod(DIMENSION, IDENTITY, [{ status: 'PRESENT' }]).map(format),
      ENGAGEMENT
    ).map(assign),
  'set:direction':
    xprod(
      xprod(DIMENSION, IDENTITY_BASE, HEADQUARTERS, [{ status: 'PRESENT' }]).map(format),
      DIRECTION
    ).map(assign),
  'set:control': xprod(TACGRP_2525_C.map(sidc), IDENTITY, [{ status: 'PRESENT' }]).map(format),
  'set:special': xprod(sidcSpecial.map(sidc), [{ identity: 'FRIEND' }], [{ status: 'PRESENT' }]).map(format),
  'set:variations': [
    preset('SHGPUCFRSS*****', { echelon: 'BRIGADE', modifiers: { Q: 45 } }),
    preset('SFAPMFB---*****', { modifiers: { Q: 315 } }),
    preset('SFGPEWHL--*****', { mobility: 'TRACKED' }),
    preset('SFGPUCII--*****', { headquarters: true, taskForce: true, dummy: true }),
    preset('SNGPIRNB--H****'),
    preset('SFGXUCVFU-*****', {
      engagementBar: 'A:B-CCC',
      engagementType: 'EXPIRED',
    }),
    preset('SFGX------*****', {
      infoFields: true,
      engagementBar: 'A:B-CCC',
      engagementType: 'EXPIRED',
      specialHeadquarters: 'AA',
      headquartersElement: 'AH',
      direction: 120
    }),
    preset('SFGAUCVFU-*****'),
    preset('SFGPUCIZ--*****', {
      infoFields: true,
      uniqueDesignation: '1',
      higherFormation: '2',
      specialHeadquarters: 'AA',
      dtg: 'O/O'
    }),
    preset('SFUPND----*****'),
    preset('SFSPNH----*****', {
      infoFields: true,
      quantity: 'C'
    }),
    preset('SFSPXM----*****'),
    preset('SFSPXMC---*****'),
    preset('SFPPT-----*****'),
    preset('SHAPWMS---*****'),
    preset('SFGPUCFSO-*****'),
    preset('SHUPWMGD--*****'),
    preset('SFUPWMG---*****'),
    preset('SNUPWMGX--*****'),
    preset('SFUPWMGE--*****'),
    preset('SFUPWMGC--*****'),
    preset('SHUPV-----*****'),
    preset('SHUPX-----*****'),
  ]
}

export const modern = options => {
  const { sidc, ...rest } = options
  return new Symbol(sidc, rest)
}

export const legacy = options => {
  const { sidc: code, ...rest } = options
  const [sidc, standard] = code.split('+')
  const reducer = (acc, [key, value]) => {
    acc[Modifiers.reverse[key]] = value
    return acc
  }

  const modifiers = Object.entries(options.modifiers || {}).reduce(reducer, {})
  const infoFields = !R.isEmpty(modifiers)

  return new ms.Symbol(sidc, {
    standard,
    infoFields,
    ...modifiers,
    ...rest
  })
}
