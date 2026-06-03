import {
  toBaseQty,
  calcLinePaise,
  formatINR,
  getCompatibleUnits,
} from "../lib/units";

console.log("===== UNIT TESTS =====");

// TEST 1
console.log("2L →", toBaseQty(2, "L"));
console.log("Expected: 2000");

// TEST 2
console.log("0.5kg →", toBaseQty(0.5, "kg"));
console.log("Expected: 500");

// TEST 3
console.log("Price:", calcLinePaise(2000, 5));
console.log("Expected: 10000");

// TEST 4
console.log("Formatted:", formatINR(10000));
console.log("Expected: ₹100.00");

// TEST 5
console.log("Compatible Units:", getCompatibleUnits("g"));
console.log("Expected: ['g', 'kg']");