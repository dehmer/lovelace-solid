import * as R from 'ramda'

export const aliases = {
  quantity: 'D',
  reinforcedReduced: 'F',
  staffComments: 'G',
  additionalInformation: 'H',
  additionalInformation1: 'H1',
  evaluationRating: 'J',
  combatEffectiveness: 'K',
  signatureEquipment: 'L',
  higherFormation: 'M',
  hostile: 'N',
  iffSif: 'P',
  direction: 'Q',
  sigint: 'R2',
  uniqueDesignation: 'T',
  uniqueDesignation1: 'T1',
  uniqueDesignation2: 'T2',
  type: 'V',
  dtg: 'W',
  dtg1: 'W1',
  altitudeDepth: 'X',
  location: 'Y',
  speed: 'Z',
  specialHeadquarters: 'AA',
  country: 'AC',
  platformType: 'AD',
  equipmentTeardownTime: 'AE',
  commonIdentifier: 'AF',
  auxiliaryEquipmentIndicator: 'AG',
  // headquartersElement: 'AH',
  installationComposition: 'AI',

  // A:BBB-CC
  engagementBar: 'AO',

  /**
   * Non-standard.
   * Target designation for hostile tracks.
   * Values: 'TARGET', 'NON-TARGET', 'EXPIRED'
   * See engagement bar.
   *
   */
  engagementType: 'AT',
  guardedUnit: 'AQ',
  specialDesignator: 'AR'
}

const entries = Object.entries
const fromEntries = Object.fromEntries
const flip = R.map(([k, v]) => [v, k])
export const reverse = R.compose(fromEntries, flip, entries)(aliases)