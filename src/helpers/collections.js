export function setEq(collectionA, collectionB) {
  const setA = new Set(collectionA);
  const setB = new Set(collectionB);
  if (setA.size !== setB.size) {
    return false;
  }
  for (const a of setA) {
    if (!setB.has(a)) {
      return false;
    }
  }
  return true;
}
