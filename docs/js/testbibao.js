let c = 4
const addX = x => n => n + x
const addThree = addX(3)
let d = addThree(c)
console.log('example partial application', d);
// ========================
let c = 4

function addX(x) {
  return function (n) {
    return n + x
  }
}
const addThree = addX(3)
let d = addThree(c)
console.log('example partial application', d)
// ========================
let c = 6
const addX = (x, y) => n => {
  if (x - y > 0) {
    x += 1;
    y += 1;
    return x + y + n;
  } else {
    x -= 1;
    y -= 1;
    return x + y - n;
  }
}
const addThree = addX(3, 4)
let d = addThree(c)
let f = addThree(c)
console.log('example partial application', d, f);