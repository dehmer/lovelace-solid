import * as R from 'ramda'
import { overlay } from './overlay'

export const IDENTITY = {
  PENDING: '0',
  UNKNOWN: '1',
  ASSUMED_FRIEND: '2',
  FRIEND: '3',
  NEUTRAL: '4',
  SUSPECT: '5', JOKER: '5',
  HOSTILE: '6', FAKER: '6'
}

const STATUS = {
  PRESENT: '0',
  PLANNED: '1', ANTICIPATED: '1',
  FULLY_CAPABLE: '2',
  DAMAGED: '3',
  DESTROYED: '4',
  FULL_TO_CAPACITY: '5'
}

export const ECHELON = {
  TEAM: '11', // CREW: '11',
  SQUAD: '12',
  SECTION: '13',
  PLATOON: '14', // DETACHMENT: '14',
  COMPANY: '15', // BATTERY: '15', TROOP: '15',
  BATTALION: '16', // SQUADRON: '16',
  REGIMENT: '17', // GROUP: '17',
  BRIGADE: '18',
  DIVISION: '21',
  CORPS: '22', // MEF: '22',
  ARMY: '23',
  ARMY_GROUP: '24', // FRONT: '24',
  REGION: '25', // THEATER: '25',
  COMMAND: '26'
}

export const MOBILITY = {
  WHEELED_LIMITED: '31',
  WHEELED: '32',
  TRACKED: '33',
  HALF_TRACK: '34',
  TOWED: '35',
  RAIL: '36',
  PACK_ANIMALS: '37',
  OVER_SNOW: '41',
  SLED: '42',
  BARGE: '51',
  AMPHIBIOUS: '52',
  TOWED_ARRAY_SHORT: '61',
  TOWED_ARRAY_LONG: '62'
}

const OVERLAYS = [
  // mutually exclusive: reality, exercise and simulation
  options => options.reality && overlay('0', [2, 3]),
  options => options.exercise && overlay('1', [2, 3]),
  options => options.simulation && overlay('2', [2, 3]),
  options => options.identity && overlay(IDENTITY[options.identity], [3, 4]),
  options => options.status && overlay(STATUS[options.status], [6, 7]),
  // mutually exclusive: mobility and echelon
  options => options.mobility && overlay(MOBILITY[options.mobility], [8, 10]),
  options => options.echelon && overlay(ECHELON[options.echelon], [8, 10]),
  options => {
    const indicator =
      (options.headquarters ? 0x01 : 0) |
      (options.taskForce ? 0x02 : 0) |
      (options.feint ? 0x04 : 0) |
      (options.dummy ? 0x04 : 0)
    return indicator && overlay(INDICATOR[indicator], [7, 8])
  }
]

export default (options, code) => {
  const overlays = OVERLAYS.map(R.applyTo(options)).filter(Boolean)
  return overlays.length ? R.compose(...overlays)(code) : code
}
