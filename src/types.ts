export enum MODES {
  NUMBER = 'num',
  OPERATION = 'op',
  EQUALS = 'eq'
}

export type Mode = MODES.NUMBER | MODES.OPERATION | MODES.EQUALS

export enum OPERATIONS {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = 'x',
  DIVIDE = '/'
}

export type Operation = OPERATIONS.ADD | OPERATIONS.SUBTRACT | OPERATIONS.MULTIPLY | OPERATIONS.DIVIDE

export type AppState = {
  display:   string,
  register:  string,
  mode:      MODES,
  operation: Operation | null,
}

export type AppActions = {
  NUMBER_INPUT: string | undefined,
  ADD_DECIMAL: null,
  RUN_CALC: null,
  SET_OPERATOR: string | undefined,
  CLEAR_ALL: null,
  SWITCH_SIGN: null,
  MAKE_PERCENT: null
}

export type Digit = {
  digit: string,
  id: string
}

export type AppCalculated = {
  displayFloat: number | null,
  registerFloat: number | null,

  // convert display and register into an array of displayable digits
  displayDigits: Digit[],
  registerDigits: Digit[],
}

export type DigitProps = {
  fill?: string,
  background?: string,
  padding?: string,
  skew?: string,
  transition?: string,
  className?: string
}

export type DigitCalculated = {
  segments: boolean[]
}