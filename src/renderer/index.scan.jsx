import * as R from 'ramda'
import * as Solid from "solid-js"
import { render } from 'solid-js/web'
import pixelmatch from 'pixelmatch'
import database from './database'
import { legacy, modern } from './options'
import * as Image from './image'
import Signal from './Signal'
import Progress from './Progress'
import './index.scss'

const openDatabase = async prefix => {
  const db = await database(prefix)
  // return R.take(100, await db.symbols())
  return db.symbols()
}

const Actions = {
  next: (index, options) => ({ type: 'next', index, options }),
  crop: (id, cropped) => ({ type: 'crop', id, cropped })
}

const next = (index, options) => state => ({
  index,
  options,
  stage: 'loading',
  threshold: state.threshold,
  sources: {
    legacy: Image.source(legacy)(options[index]),
    modern: Image.source(modern)(options[index]),
  }
})

const crop = (id, cropped) => state => {
  const next = { ...state.cropped || {}, [id]: cropped }
  const stage = Object.keys(next).length === 2 ? 'cropped' : 'cropping'
  return { ...state, stage, cropped: next }
}

const App = () => {
  const canvas = new OffscreenCanvas(0, 0)
  const putOffscreenImage = Image.put(canvas)
  const [options] = Solid.createResource('2525C+ICON', openDatabase)
  const initial = { stage: 'init', threshold: 100 }
  const actions = Signal.of()
  const state = Signal.scan((state, action) => {
    switch(action?.type) {
      case 'next': return next(action.index, action.options)(state)
      case 'crop': return crop(action.id, action.cropped)(state)
      default: return state
    }
  }, initial, actions)
  const review = Signal.of([])

  // Image DOM references:
  const refs = { legacy: null, modern: null }

  // Get the ball rolling when database is open and options are loaded:
  Solid.createEffect(() => {
    if (options()) {
      actions(Actions.next(0, options()))
    }
  })

  // Update images sources for current index:
  Solid.createEffect(() => {
    if (state().stage !== 'loading') return
    const { sources } = state()

    if(Image.setSource(refs.legacy)(sources.legacy)) {
      const cropped = Image.crop(canvas)(refs.legacy)
      actions(Actions.crop('legacy', cropped))
    }

    if(Image.setSource(refs.modern)(sources.modern)) {
      const cropped = Image.crop(canvas)(refs.modern)
      actions(Actions.crop('modern', cropped))
    }
  })

  // Compare image data after cropping:
  Solid.createEffect(() => {
    if (state().stage !== 'cropped') return
    const { threshold, index, options, sources, cropped } = state()
    const { legacy, modern } = cropped
    const width = Math.max(legacy.width, modern.width)
    const height = Math.max(legacy.height, modern.height)
    const img1 = putOffscreenImage(width, height, legacy).getImageData(0, 0, width, height)
    const img2 = putOffscreenImage(width, height, modern).getImageData(0, 0, width, height)
    const difference = pixelmatch(img1.data, img2.data, null, width, height, { threshold: 0.1 })

    if (difference > threshold) {
      review(acc => acc.concat([{
        sources: { ...sources },
        index: index,
        ...options[index],
        difference
      }]))
    }

    // Next index: rinse and repeat.
    if (index < options.length - 1) {
      actions(Actions.next(index + 1, options))
    }
  })

  const index = Solid.createMemo(() => state().index || 0)
  const double = x => x * 2
  const difference = p => x => R.tap(_ => (p = x))(x - p)

  const thruput = Signal.every(500)
    .map(() => Solid.untrack(index))
    .map(difference(0))
    .map(double)

  const progress = Solid.createMemo(() => {
    const { index, options } = state()
    return options?.length
      ? (index + 1) / options.length
      : 0
  })

  const handleLoad = ({ target }) => {
    const cropped = Image.crop(canvas)(target)
    actions(Actions.crop(target.id, cropped))
  }

  return (
    <>
      <Progress progress={progress()}/>
      <div class='main'>
        <img
          id='legacy'
          class='img--preview'
          alt=''
          ref={refs.legacy}
          onLoad={handleLoad}
        />
        <img
          id='modern'
          class='img--preview'
          alt=''
          ref={refs.modern}
          onLoad={handleLoad}
        />
        <div>{`${thruput()} ops/s`}</div>
      </div>

      <div class='review'>
        <Solid.For each={review()}>{(card) =>
          <div class='card'>
            <div class='card-content'>
              <img class='image--small' src={card.sources.legacy} alt=''/>
              <img class='image--small' src={card.sources.modern} alt=''/>
            </div>
            <div class='summary'>{card.difference} @ {card.index}</div>
            <div class='summary'>{card.sidc}</div>
          </div>
        }</Solid.For>
      </div>
    </>
  )
}

render(App, document.body)