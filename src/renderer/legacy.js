import * as R from 'ramda'
import { overlay } from './overlay'

const IDENTITY = {
  PENDING: ['P', 'G'],
  UNKNOWN: ['U', 'W'],
  ASSUMED_FRIEND: ['A', 'M'],
  FRIEND: ['F', 'D'],
  NEUTRAL: ['N', 'L'],

  // Joker. A friendly track acting as a suspect for exercise purposes.
  SUSPECT: ['S', 'J'],
  JOKER: ['J', 'J'],

  // Faker. A friendly track acting as a hostile for exercise purposes.
  HOSTILE: ['H', 'K'],
  FAKER: ['K', 'K']
}

const STATUS = {
  ANTICIPATED: 'A',
  PLANNED: 'A',
  PRESENT: 'P',
  FULLY_CAPABLE: 'C',
  DAMAGED: 'D',
  DESTROYED: 'X',
  FULL_TO_CAPACITY: 'F'
}

const MOBILITY = {
  WHEELED_LIMITED: 'MO',
  WHEELED: 'MP',
  TRACKED: 'MQ',
  HALF_TRACK: 'MR',
  TOWED: 'MS',
  RAIL: 'MT',
  PACK_ANIMALS: 'MW',
  OVER_SNOW: 'MU',
  SLED: 'MV',
  BARGE: 'MX',
  AMPHIBIOUS: 'MY',
  TOWED_ARRAY_SHORT: 'NS',
  TOWED_ARRAY_LONG: 'NL'
}

const ECHELON = {
  TEAM: 'A', CREW: 'A',
  SQUAD: 'B',
  SECTION: 'C',
  PLATOON: 'D', DETACHMENT: 'D',
  COMPANY: 'E', BATTERY: 'E', TROOP: 'E',
  BATTALION: 'F',
  SQUADRON: 'F',
  REGIMENT: 'G', GROUP: 'G',
  BRIGADE: 'H',
  DIVISION: 'I',
  CORPS: 'J', MEF: 'J',
  ARMY: 'K',
  ARMY_GROUP: 'L', FRONT: 'L',
  REGION: 'M', THEATER: 'M',
  COMMAND: 'N'
}

// HQ (0x01), TF (0x02), F/D (0x04)
const INDICATOR = {
  1: 'A', // HQ
  3: 'B', // TF, HQ
  5: 'C', // FD, HQ
  7: 'D', // FD, TF, HQ
  2: 'E', // TF
  4: 'F', // FD
  6: 'G'  // FD, TF
}

const OVERLAYS = [
  options => options.identity && overlay(
    IDENTITY
      [options.identity]
      [options.exercise ? 1 : 0],
    [1, 2]
  ),
  options => options.status && overlay(STATUS[options.status], [3, 4]),
  options => options.mobility && overlay(MOBILITY[options.mobility], [10, 12]),
  options => options.echelon && overlay(ECHELON[options.echelon], [11, 12]),
  // EFFPB-----H****
  options => options.installation && overlay('H-', 10, 12),
  options => {
    const indicator =
      (options.headquarters ? 0x01 : 0) |
      (options.taskForce ? 0x02 : 0) |
      (options.feint ? 0x04 : 0) |
      (options.dummy ? 0x04 : 0)
    return indicator && overlay(INDICATOR[indicator], [10, 11])
  }
]

export default (options, code) => {
  const overlays = OVERLAYS.map(R.applyTo(options)).filter(Boolean)
  return overlays.length ? R.compose(...overlays)(code) : code
}
