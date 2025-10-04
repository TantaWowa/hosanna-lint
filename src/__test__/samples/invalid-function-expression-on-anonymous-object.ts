// Invalid: function expressions on anonymous objects
const obj = { method: function() {} };
const config = { handler: function(event) { return event; } };
