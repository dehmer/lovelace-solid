import * as R from 'ramda'
import legacy from './legacy'
import modern from './modern'

export const format = R.curry((options, code) => {
  const [sidc, standard] = code.split('+')
  const formatted = sidc.length === 20
    ? modern(options, sidc)
    : legacy(options, sidc)
  return standard ? `${formatted}+${standard}` : formatted
})
