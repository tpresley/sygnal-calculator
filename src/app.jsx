import { ABORT, xs } from 'sygnal'
import Digit from './digit'


// map operator strings to math functions
const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '/': (a, b) => a / b,
  'x': (a, b) => a * b
}

// app constants
const NUMBERS     = ['1','2','3','4','5','6','7','8','9','0']
const OPERATIONS  = ['/', 'x', '-', '+']
const CLEAR_ALL   = 'AC'
const SWITCH_SIGN = '+/-'
const PERCENT     = '%'
const DECIMAL     = '.'
const EQUALS      = '='


// app 'modes' (state machine)
const NUMBER_MODE   = 'num'
const OPERATOR_MODE = 'op'
const EQUALS_MODE   = 'eq'

const DIGIT_SKEW    = '-7deg'
const TRANSITION    = '100ms'
const DISPLAY_FILL  = '#AAA'
const REGISTER_FILL = '#999'


export default function CALCULATOR({ state }) {
  const { operation, mode } = state

  // create number and operation buttons from the constant arrays
  // - these could also be made into components, but since they don't require state they can remain simple functions
  const numberButtons    = NUMBERS.map(num => <div className="button number" data-value={ `${ num }` }>{ num }</div>)
  const operationButtons = OPERATIONS.map(op  => <div className="button operator" data-value={ op }>{ op }</div>)

  const operationText = mode === EQUALS_MODE ? '' : operation

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
          <collection of={ Digit } from="registerDigits" fill={ REGISTER_FILL } skew={ DIGIT_SKEW } transition={ TRANSITION } className="register-container" />
          <span className="operation">{ operationText }</span>
        </div>
        <collection of={ Digit } from="displayDigits" fill={ DISPLAY_FILL } skew={ DIGIT_SKEW } transition={ TRANSITION } className="current-container" />
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
  mode:      NUMBER_MODE,
  operation: null,
}

CALCULATOR.calculated = {
  // actual display and register state values are stored as strings
  // but we need the float values to perform math operations on
  // - calculated fields are automatically added to the state
  //   and are updated whenever the state changes
  displayFloat: (state) => {
    const floatVal = parseFloat(state.display)
    if (isNaN(floatVal)) return ''
    return floatVal
  },
  registerFloat: (state) => {
    const floatVal = parseFloat(state.register)
    if (isNaN(floatVal)) return ''
    return floatVal
  },

  // convert display and register into an array of displayable digits
  displayDigits: (state) => {
    return state.display.split('').slice(0, 10).map((digit, ind) => ({ digit, id: 'disp' + (10 - state.display.length + ind) }))
  },
  registerDigits: (state) => {
    if (state.mode === EQUALS_MODE) return []
    return state.register.split('').slice(0, 10).map((digit, ind) => ({ digit, id: 'reg' + (10 - state.register.length + ind) }))
  },
}

CALCULATOR.model = {
  // when a number button is clicked
  // - ignore if the new digit is a 0 and there is already a leading zero in the display
  // - if we weren't in NUMBER_MODE mode before, initialize the display to '' (this will be the first digit)
  // - if the previous mode was EQUALS_MODE, start a new unchained calc (clear the register and operation)
  // - concatenate the number pressed to the right of the current display string and set to NUMBER_MODE mode
  NUMBER_INPUT: (state, data) => {
    if (data === '0' && (state.display === '0')) return ABORT
    const current   = state.mode === NUMBER_MODE ? state.display : ''
    const register  = state.mode !== EQUALS_MODE ? state.register : ''
    const operation = state.mode !== EQUALS_MODE ? state.operation : ''
    const display   = current + data
    return { ...state, display, register, operation, mode: NUMBER_MODE }
  },
  // when the '.' button is pressed
  // - if in EQUALS_MODE (just finished a calc) treat as a new number (set display to '0.', clear the register and operation, and set to NUMBER_MODE)
  // - ignore if the display already contains a '.'
  // - if the display is empty, set it to '0.'
  // - otherwise add '.' to the right of the display string
  ADD_DECIMAL: (state, data) => {
    if (state.mode === EQUALS_MODE) return { ...state, display: '0.', register: '', operation: null, mode: NUMBER_MODE }
    if (state.display.includes('.')) return ABORT
    if (state.display === '') return { ...state, mode: NUMBER_MODE, display: '0.' }
    const display = state.display + '.'
    return { ...state, display }
  },
  // when '=' is clicked
  // - ignore if there is no operation selected or the display is empty (no second operand)
  // - if we are in EQUALS_MODE mode (we've already hit '=' once before), then repeat the previous operation
  //   (flip operands to make sure subtraction and division work as expected)
  // - otherwise run the calculation and set the mode to EQUALS_MODE
  RUN_CALC: (state) => {
    if (!state.operation || state.display === '') return ABORT
    let register, first, second
    if (state.mode === EQUALS_MODE) {
      register = state.register
      first    = state.displayFloat
      second   = state.registerFloat
    } else {
      register = state.display
      first    = state.registerFloat
      second   = state.displayFloat
    }
    const display  = operations[state.operation](first, second).toString()
    return { ...state, display, register, mode: EQUALS_MODE }
  },
  // when an operation key is pressed
  // - ignore if the display is empty and we're not already in OPERATOR_MODE (basically initial app state)
  // - if we're chaining operations (doing another op without hitting '=') then run the previous
  //   calc and store the result in the register
  // - if a previous op was chosen, and no numbers have been entered yet, just change the operation
  // - otherwise move the display to the register and set the operation to the pressed button
  SET_OPERATOR: (state, data) => {
    if (state.mode !== OPERATOR_MODE && state.display === '') return ABORT
    const isChainedOp = state.mode == NUMBER_MODE && state.operation
    const register = isChainedOp ? operations[state.operation](state.registerFloat, state.displayFloat).toString() : state.display
    if (state.mode === OPERATOR_MODE && state.display === '') return { ...state, operation: data }
    const display  = ''
    return { ...state, display, register, mode: OPERATOR_MODE, operation: data }
  },
  // when the 'AC' button is clicked
  // - clear the display, register, and operation
  // - set the mode back to NUMBER_MODE (ready to enter the first number)
  CLEAR_ALL: (state, data) => ({ display: '', register: '', mode: NUMBER_MODE, operation: null }),
  // when the '+/-' button is clicked
  // - reverse the sign by adding a '-' to the left of the display string (or removing it if there's already one there)
  SWITCH_SIGN: (state, data) => ({ ...state, display: state.display[0] === '-' ? state.display.slice(1) : '-' + state.display }),
  // when the '%' button is clicked
  // - divide the display by 100
  MAKE_PERCENT: (state, data) => ({ ...state, display: (state.displayFloat / 100).toString() }),
}

CALCULATOR.intent = ({ DOM }) => {
  // helper that extracts a specified HTML data property from an event target
  const domData       = (field)    => e => e.target.dataset[field]
  // given a CSS selector, get click events and extract the data-value property
  const getClickEvent = (selector) => DOM.select(selector).events('click').map(domData('value'))

  // capture all user keydown events in the browser window, and extract the 'key' from the event object
  const allKey$   = DOM.select('document').events('keydown').map(e => e.key)
  // simple helper to determine if the current key pressed matches the specified array of keys
  const keyFilter = (keys) => (pressed) => keys.includes(pressed)

  // get streams of each category of key input
  const number$    = allKey$.filter(keyFilter(NUMBERS))
  const decimal$   = allKey$.filter(keyFilter([DECIMAL]))
  // allow either the '=' (defined in the EQUALS constant) or the Enter key
  const equal$     = allKey$.filter(keyFilter([EQUALS, 'Enter']))
  // allow '*' as an alternative multiplication key, but map it back to 'x' if pressed
  const operation$ = allKey$.filter(keyFilter([...OPERATIONS, '*'])).map(op => op === '*' ? 'x' : op)
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
    ADD_DECIMAL:  xs.merge( getClickEvent('.decimal'),  decimal$   ),
    RUN_CALC:     xs.merge( getClickEvent('.equal'),    equal$     ),
    SET_OPERATOR: xs.merge( getClickEvent('.operator'), operation$ ),
    CLEAR_ALL:    xs.merge( getClickEvent('.clear'),    clearAll$  ),
    SWITCH_SIGN:  xs.merge( getClickEvent('.sign'),     sign$      ),
    MAKE_PERCENT: xs.merge( getClickEvent('.percent'),  percent$   ),
  }
}