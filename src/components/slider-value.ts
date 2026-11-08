/** 保留小数精度，同时消除常见的二进制浮点尾差。 */
function precise(value: number) {
  return Number(value.toPrecision(14))
}

export function createSliderScale(min: number, max: number, step: number) {
  const lower = Number.isFinite(min) ? min : 0
  const proposedUpper = Number.isFinite(max) ? Math.max(lower, max) : Math.max(lower, 100)
  const upper = Number.isFinite(proposedUpper - lower) ? proposedUpper : lower
  const interval = Number.isFinite(step) && step > 0 ? step : 1
  const span = upper - lower
  const clamp = (value: number) => Math.min(upper, Math.max(lower, value))

  function snap(value: number) {
    if (!Number.isFinite(value)) return lower
    const bounded = clamp(value)
    if (!span || bounded === upper || bounded === lower) return bounded
    const index = Math.round((bounded - lower) / interval)
    const candidate = clamp(precise(lower + index * interval))
    // max 始终可选；非整除范围的最后一格可以短于 step。
    return upper - bounded < Math.abs(candidate - bounded) ? upper : candidate
  }

  function next(value: number, direction: number, count = 1) {
    const index = (value - lower) / interval
    const target =
      direction > 0 ? Math.floor(index + 1e-9) + count : Math.ceil(index - 1e-9) - count
    return clamp(precise(lower + target * interval))
  }

  return {
    min: lower,
    max: upper,
    step: interval,
    span,
    snap,
    next,
    ratio: (value: number) => (span ? (clamp(value) - lower) / span : 0),
    fromRatio: (ratio: number) => snap(lower + Math.max(0, Math.min(1, ratio)) * span),
  }
}
