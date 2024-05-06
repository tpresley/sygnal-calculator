import { classes } from "sygnal"

// map numbers to which segments are displayed
// - '0' is off, '1' is on
// - first segment is the top one, goes around clockwise, the middle segment is last
const SEGMENTS = {
  0: '1111110',
  1: '0110000',
  2: '1101101',
  3: '1111001',
  4: '0110011',
  5: '1011011',
  6: '1011111',
  7: '1110000',
  8: '1111111',
  9: '1111011',
  '-': '0000001',
  // add the decimal to prevent errors, but it actually gets rendered as a span
  '.': '0000000',
}

export default function DIGIT({ state, props, calculated }) {
  // get the required values from state
  const { id, digit } = state
  // caluculated values are available on the state itelf, but are also in the calculated argument
  const { segments } = calculated
  
  // props set on a collection element are passed to all items in the collection
  let { fill, background, padding, skew, transition } = props

  // set default padding and background if needed
  padding    ||= '0.1em'
  background ||= 'transparent'

  // if the digit is a '.' just render it in a span and skip the SVG
  if (digit === '.') return <span style={{ fontSize: `calc(1em + ${ padding } * 2)`, color: fill }}>.</span>

  // calculate the classes for each individual segment given the index position
  const segmentClasses = (ind) => classes('segment', `segment-${ ind }`, { on: segments[ind] })

  // style each segment with the provided fill color
  const style = { fill, transition }

  // render an SVG of an LCD style segmented digit
  return (
    <div className="digit" style={{ height: '1em', backgroundColor: background, padding, transform: `skew(${ skew || '0' })` }} id={ id }>
      <svg style={{ height: '1em' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 292.06 585.99">
        <defs>
          <style>{`
            .segment {opacity: 0.1;}
            .segment.on {opacity: 1;}
          `}</style>
        </defs>
        <polygon style={ style } className={ segmentClasses(0) } points="230.47 58.07 61.27 58.23 61.27 58.07 32.39 29.04 61.27 0.15 230.47 0 259.36 29.04 230.47 57.92 230.47 58.07"/>
        <polygon style={ style } className={ segmentClasses(1) } points="292.06 61.95 292.06 259.88 291.9 259.88 262.87 288.76 233.98 259.88 233.98 61.95 263.02 33.07 291.9 61.95 292.06 61.95"/>
        <polygon style={ style } className={ segmentClasses(2) } points="292.06 325.72 292.06 523.65 291.9 523.65 262.87 552.52 233.98 523.65 233.98 325.72 263.02 296.83 291.9 325.72 292.06 325.72"/>
        <polygon style={ style } className={ segmentClasses(3) } points="230.47 585.84 61.27 585.99 61.27 585.84 32.39 556.8 61.27 527.92 230.47 527.76 259.36 556.8 230.47 585.68 230.47 585.84"/>
        <polygon style={ style } className={ segmentClasses(4) } points="58.07 325.72 58.07 523.65 57.92 523.65 28.89 552.52 0 523.65 0 325.72 29.04 296.83 57.92 325.72 58.07 325.72"/>
        <polygon style={ style } className={ segmentClasses(5) } points="58.07 61.95 58.07 259.88 57.92 259.88 28.89 288.76 0 259.88 0 61.95 29.04 33.07 57.92 61.95 58.07 61.95"/>
        <polygon style={ style } className={ segmentClasses(6) } points="230.47 321.75 61.27 321.9 61.27 321.75 32.39 292.72 61.27 263.83 230.47 263.68 259.36 292.72 230.47 321.59 230.47 321.75"/>
      </svg>
    </div>
  )
}

// convert the digit in state into an array of true/false based on 1's or 0's in the segment template string for the digit
DIGIT.calculated = {
  segments: (state) => SEGMENTS[state.digit].split('').map(segment => segment === '1' )
}
