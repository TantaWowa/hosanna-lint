// Invalid: Number.EPSILON usage
const epsilon = Number.EPSILON;
if (Math.abs(a - b) < Number.EPSILON) { return true; }
