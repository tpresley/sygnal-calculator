import { Collection, ABORT, xs } from 'sygnal'
import { RootComponent } from 'sygnal/types'
import type { AppState, AppActions, AppCalculated, Operation, DigitProps } from './types'
import { MODES, OPERATIONS } from './types'
import Digit from './digit'


// map operator strings to math functions
const operations: { [operation in Operation]: (a: number, b: number) => number } = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '/': (a, b) => a / b,
  'x': (a, b) => a * b
}

// app constants
const NUMBERS     = ['1','2','3','4','5','6','7','8','9','0']
const CLEAR_ALL   = 'AC'
const SWITCH_SIGN = '+/-'
const PERCENT     = '%'
const DECIMAL     = '.'
const EQUALS      = '='


const DIGIT_SKEW    = '-7deg'
const TRANSITION    = '100ms'
const DISPLAY_FILL  = '#AAA'
const REGISTER_FILL = '#999'


const CALCULATOR: RootComponent<AppState, any, AppActions, AppCalculated> = (_props, state) => {
  const { operation, mode } = state

  // create number and operation buttons from the constant arrays
  // - these could also be made into components, but since they don't require state they can remain simple functions
  const numberButtons    = NUMBERS.map(num => <div className="button number" data-value={ `${ num }` }>{ num }</div>)
  const operationButtons = Object.values(OPERATIONS).map(op  => <div className="button operator" data-value={ op }>{ op }</div>)

  const operationText = mode === MODES.EQUALS ? '' : operation

  return (
    <div className="calculator">
      <div className="display">
        <div className="previous">
          {/*
            use the built-in collection element to add arrays of components 
            - this line will create a new Digit component for each item
              in the calculated digit array field on the current state
            - props are passed down to each component
          */}
          <Collection<DigitProps> of={ Digit } from="registerDigits" fill={ REGISTER_FILL } skew={ DIGIT_SKEW } transition={ TRANSITION } className="register-container" />
          <span className="operation">{ operationText }</span>
        </div>
        <Collection<DigitProps> of={ Digit } from="displayDigits" fill={ DISPLAY_FILL } skew={ DIGIT_SKEW } transition={ TRANSITION } className="current-container" />
      </div>
      <div className="keypad">
        <div className="numbers">
          <div className="button clear">{ CLEAR_ALL }</div>
          <div className="button sign">{ SWITCH_SIGN }</div>
          <div className="button percent">{ PERCENT }</div>
          { numberButtons }
          <div className="button decimal">{ DECIMAL }</div>
        </div>
        <div className="operators">
          { operationButtons }
          <div className="button equal">{ EQUALS }</div>
        </div>
      </div>
    </div>
  )
}

CALCULATOR.initialState = {
  display:   '',
  register:  '',
  mode:      MODES.NUMBER,
  operation: null,
}

CALCULATOR.calculated = {
  // actual display and register state values are stored as strings
  // but we need the float values to perform math operations on
  // - calculated fields are automatically added to the state
  //   and are updated whenever the state changes
  displayFloat: (state) => {
    const floatVal = parseFloat(state.display)
    if (isNaN(floatVal)) return null
    return floatVal
  },
  registerFloat: (state) => {
    const floatVal = parseFloat(state.register)
    if (isNaN(floatVal)) return null
    return floatVal
  },

  // convert display and register into an array of displayable digits
  displayDigits: (state) => {
    return state.display.split('').slice(0, 10).map((digit, ind) => ({ digit, id: 'disp' + (10 - state.display.length + ind) }))
  },
  registerDigits: (state) => {
    if (state.mode === MODES.EQUALS) return []
    return state.register.split('').slice(0, 10).map((digit, ind) => ({ digit, id: 'reg' + (10 - state.register.length + ind) }))
  },
}

CALCULATOR.model = {
  // when a number button is clicked
  // - ignore if the new digit is a 0 and there is already a leading zero in the display
  // - if we weren't in MODES.NUMBER mode before, initialize the display to '' (this will be the first digit)
  // - if the previous mode was MODES.EQUALS, start a new unchained calc (clear the register and operation)
  // - concatenate the number pressed to the right of the current display string and set to MODES.NUMBER mode
  NUMBER_INPUT: (state, data) => {
    if (data === '0' && (state.display === '0')) return ABORT
    const current   = state.mode === MODES.NUMBER ? state.display : ''
    const register  = state.mode !== MODES.EQUALS ? state.register : ''
    const operation = state.mode !== MODES.EQUALS ? state.operation : null
    const display   = current + data
    return { ...state, display, register, operation, mode: MODES.NUMBER }
  },
  // when the '.' button is pressed
  // - if in MODES.EQUALS (just finished a calc) treat as a new number (set display to '0.', clear the register and operation, and set to NUMBER_MODE)
  // - ignore if the display already contains a '.'
  // - if the display is empty, set it to '0.'
  // - otherwise add '.' to the right of the display string
  ADD_DECIMAL: (state) => {
    if (state.mode === MODES.EQUALS) return { ...state, display: '0.', register: '', operation: null, mode: MODES.NUMBER }
    if (state.display.includes('.')) return ABORT
    if (state.display === '') return { ...state, mode: MODES.NUMBER, display: '0.' }
    const display = state.display + '.'
    return { ...state, display }
  },
  // when '=' is clicked
  // - ignore if there is no operation selected or the display is empty (no second operand)
  // - if we are in MODES.EQUALS mode (we've already hit '=' once before), then repeat the previous operation
  //   (flip operands to make sure subtraction and division work as expected)
  // - otherwise run the calculation and set the mode to MODES.EQUALS
  RUN_CALC: (state) => {
    if (!state.operation || state.display === '') return ABORT
    let register, first, second
    if (state.mode === MODES.EQUALS) {
      register = state.register
      first    = state.displayFloat ?? 0
      second   = state.registerFloat ?? 0
    } else {
      register = state.display
      first    = state.registerFloat ?? 0
      second   = state.displayFloat ?? 0
    }
    const display  = operations[state.operation](first, second).toString()
    return { ...state, display, register, mode: MODES.EQUALS }
  },
  // when an operation key is pressed
  // - ignore if the display is empty and we're not already in OPERATOR_MODE (basically initial app state)
  // - if we're chaining operations (doing another op without hitting '=') then run the previous
  //   calc and store the result in the register
  // - if a previous op was chosen, and no numbers have been entered yet, just change the operation
  // - otherwise move the display to the register and set the operation to the pressed button
  SET_OPERATOR: (state, data) => {
    if (state.mode !== MODES.OPERATION && state.display === '') return ABORT
    const isChainedOp = state.mode == MODES.NUMBER && state.operation
    const register = (isChainedOp && state.operation) ? operations[state.operation](state.registerFloat ?? 0, state.displayFloat ?? 0).toString() : state.display
    if (state.mode === MODES.OPERATION && state.display === '') return { ...state, operation: data as Operation }
    const display  = ''
    return { ...state, display, register, mode: MODES.OPERATION, operation: data as Operation, registerFloat: state.registerFloat }
  },
  // when the 'AC' button is clicked
  // - clear the display, register, and operation
  // - set the mode back to NUMBER_MODE (ready to enter the first number)
  CLEAR_ALL: () => ({ display: '', register: '', mode: MODES.NUMBER, operation: null }),
  // when the '+/-' button is clicked
  // - reverse the sign by adding a '-' to the left of the display string (or removing it if there's already one there)
  SWITCH_SIGN: (state) => ({ ...state, display: state.display[0] === '-' ? state.display.slice(1) : '-' + state.display }),
  // when the '%' button is clicked
  // - divide the display by 100
  MAKE_PERCENT: (state) => ({ ...state, display: ((state.displayFloat ?? 0) / 100).toString() }),
}

CALCULATOR.intent = ({ DOM }) => {
  // helper that extracts a specified HTML data property from an event target
  const domData       = (field: string)    => (e: Event): string | undefined => e.target instanceof HTMLElement ? e.target.dataset[field] : ''
  // given a CSS selector, get click events and extract the data-value property
  const getClickEvent = (selector: string) => DOM.select(selector).events('click').map(domData('value'))

  // capture all user keydown events in the browser window, and extract the 'key' from the event object
  const allKey$   = DOM.select('document').events('keydown').map(e => e.key)
  // simple helper to determine if the current key pressed matches the specified array of keys
  const keyFilter = (keys: string[]) => (pressed: string) => keys.includes(pressed)

  // get streams of each category of key input
  const number$    = allKey$.filter(keyFilter(NUMBERS))
  const decimal$   = allKey$.filter(keyFilter([DECIMAL]))
  // allow either the '=' (defined in the EQUALS constant) or the Enter key
  const equal$     = allKey$.filter(keyFilter([EQUALS, 'Enter']))
  // allow '*' as an alternative multiplication key, but map it back to 'x' if pressed
  const operation$ = allKey$.filter(keyFilter([...Object.values(OPERATIONS), '*'])).map(op => op === '*' ? 'x' : op)
  // use 'Backspace' as the 'AC' keyboard shortcut
  const clearAll$  = allKey$.filter(keyFilter(['Backspace']))
  // use '~' as the '+/-' keyboard shortcut
  const sign$      = allKey$.filter(keyFilter(['~']))
  const percent$   = allKey$.filter(keyFilter([PERCENT]))


  // get click events from the different button types, and map them to actions (in the model)
  // merge the click events with the keyboard events of the same category
  // - the actions will trigger whether the user clicks with the mouse or uses the keyboard equivalents
  return {
    NUMBER_INPUT: xs.merge( getClickEvent('.number'),   number$    ),
    ADD_DECIMAL:  xs.merge( getClickEvent('.decimal'),  decimal$   ).mapTo(null),
    RUN_CALC:     xs.merge( getClickEvent('.equal'),    equal$     ).mapTo(null),
    SET_OPERATOR: xs.merge( getClickEvent('.operator'), operation$ ),
    CLEAR_ALL:    xs.merge( getClickEvent('.clear'),    clearAll$  ).mapTo(null),
    SWITCH_SIGN:  xs.merge( getClickEvent('.sign'),     sign$      ).mapTo(null),
    MAKE_PERCENT: xs.merge( getClickEvent('.percent'),  percent$   ).mapTo(null),
  }
}

export default CALCULATOR