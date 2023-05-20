// Props objects are readonly and have reactive properties
// which are wrapped in Object getters. This allows them to
// have a consistent form regardless of whether the caller
// used signals, signal expressions, or static values.
// You access them by props.propName.

const Progress = props => {
  const color = props.color || 'red'

  const progressStyle = () => ({
    'background-color': color,
    width: `${props.progress * 100}%`
  })

  const leaderStyle = () => ({
    'background-color': color,
    color: color
  })

  return (
    <div class='progress' style={progressStyle()}>
      <div class='progress__leader' style={leaderStyle()}></div>
    </div>
  )
}

export default Progress
