// The in-app "reduce animations" choice, readable from UI code without depending on the data layer.
// The root layout keeps it in sync with Settings.
let reduce = false;

export function setReduceMotion(value: boolean) {
  reduce = value;
}

export function shouldReduceMotion() {
  return reduce;
}
