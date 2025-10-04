// Invalid: Date usage
const date1 = new Date();
const date2 = new Date('2023-10-04');
const now = Date.now();
const parsed = Date.parse('2023-10-04');

// Invalid: Date types
const dateVar: Date = new HsDate();
function processDate(date: Date): void {}
interface WithDate { timestamp: Date; }
type DateAlias = Date;

// Valid: HsDate usage (should not trigger)
const hsDate = new HsDate();
const hsDateVar: HsDate = new HsDate();
