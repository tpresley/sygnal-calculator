'use strict'

import { ABORT, component } from 'sygnal'


// map operator strings to math functions
const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '/': (a, b) => a / b,
  'x': (a, b) => a * b
}


export default component({
  name: 'CALCULATOR',

  initialState: {
    display:   '',
    register:  '',
    mode:      'num',
    operation: null,
  },

  // actual display and register state values are stored as strings
  // but we need the float values to perform math operations on
  calculated: {
    displayFloat: (state) => {
      const floatVal = parseFloat(state.display)
      if (isNaN(floatVal)) return ''
      return floatVal
    },
    registerFloat: (state) => {
      const floatVal = parseFloat(state.register)
      if (isNaN(floatVal)) return ''
      return floatVal
    }
  },

  model: {
    // when a number button is clicked
    // - if we weren't in 'num' mode before, initialize the display to '' (this will be the first digit)
    // - concatenate the number pressed to the right of the current display string and set to 'num' mode
    NUM_CLICK:     (state, data) => {
      const current = state.mode === 'num' ? state.display : ''
      const display = current + data
      return { ...state, display, mode: 'num' }
    },
    // when the '.' button is pressed
    // - ignore if the display already contains a '.'
    // - if the display is empty, set it to '0.'
    // - otherwise add '.' to the right of the display string
    DEC_CLICK:     (state, data) => {
      if (state.display.includes('.')) return ABORT
      if (state.display === '') return { ...state, mode: 'num', display: '0.' }
      const display = state.display + '.'
      return { ...state, display }
    },
    // when '=' is clicked
    // - ignore if there is no operation selected
    // - if we are in 'eq' mode (we've already hit '=' once before), then repeat the previous operation
    //   (flip operands to make sure subtraction and division work as expected)
    // - otherwise run the calculation and set the mode to 'eq'
    EQ_CLICK:      (state) => {
      if (!state.operation) return ABORT
      let register, first, second
      if (state.mode === 'eq') {
        register = state.register
        first    = state.displayFloat
        second   = state.registerFloat
      } else {
        register = state.display
        first    = state.registerFloat
        second   = state.displayFloat
      }
      const display  = operations[state.operation](first, second).toString()
      return { ...state, display, register, mode: 'eq' }
    },
    // when an operation key is pressed
    // - if we're chaining operations (doing another op without hitting '=') then run the previous
    //   calc and store the result in the register
    // - if a previous op was chosen, and no numbers have been entered yet, just change the operation
    // - otherwise move the display to the register and set the operation to the pressed button
    OP_CLICK:      (state, data) => {
      const isChainedOp = state.mode == 'num' && state.operation
      const register = isChainedOp ? operations[state.operation](state.registerFloat, state.displayFloat).toString() : state.display
      if (state.mode === 'op' && state.display === '') return { ...state, operation: data }
      const display  = ''
      return { ...state, display, register, mode: 'op', operation: data }
    },
    // when the 'AC' button is clicked
    // - clear the display, register, and operation
    // - set the mode back to 'num' (ready to enter the first number)
    AC_CLICK:      (state, data) => ({ display: '', register: '', mode: 'num', operation: null }),
    // when the '+/-' button is clicked
    // - reverse the sign by adding a '-' to the left of the display string (or removing it if there's already one there)
    SIGN_CLICK:    (state, data) => ({ ...state, display: state.display[0] === '-' ? state.display.slice(1) : '-' + state.display }),
    // when the '%' button is clicked
    // - divide the display by 100
    PERCENT_CLICK: (state, data) => ({ ...state, display: (state.displayFloat / 100).toString() }),
  },

  intent: ({ DOM }) => {
    // helper that extracts a specified HTML data property from an event target
    const domData       = (field)    => e => e.target.dataset[field]
    // given a CSS selector, get click events and extract the data-value property
    const getClickEvent = (selector) => DOM.select(selector).events('click').map(domData('value'))

    // get click events from the different button types, and map them to actions (in the model)
    return {
      NUM_CLICK:     getClickEvent('.number'),
      DEC_CLICK:     getClickEvent('.decimal'),
      EQ_CLICK:      getClickEvent('.equal'),
      OP_CLICK:      getClickEvent('.operator'),
      AC_CLICK:      getClickEvent('.clear'),
      SIGN_CLICK:    getClickEvent('.sign'),
      PERCENT_CLICK: getClickEvent('.percent'),
    }
  },

  view: ({ state }) => {
    const numButton = num => <div className="button number" data-value={ `${ num }` }>{ num } </div>
    const opButton  = op  => <div className="button operator" data-value={ op }>{ op } </div>

    return (
      <div className="calculator">
        <div className="display">
          <div className="previous">
            <span className="register">{ state.mode !== 'eq' && state.register } </span>
            <span className="operation">{ (state.mode !== 'eq' && state.operation) || ' ' }</span>
          </div>
          <div className="current-container">
            <span className="current">{ state.display || ' ' }</span>
          </div>
        </div>
        <div className="keypad">
          <div className="numbers">
            <div className="button clear">AC</div>
            <div className="button sign">+/-</div>
            <div className="button percent">%</div>
            { [1,2,3,4,5,6,7,8,9,0].map(numButton) }
            <div className="button decimal">.</div>
          </div>
          <div className="operators">
            { ['/', 'x', '-', '+'].map(opButton) }
            <div className="button equal">=</div>
          </div>
        </div>
      </div>
    )
  }

})
