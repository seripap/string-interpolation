
function getArrayKeyIndex(val) {
  // Find values between []
  const matchArrayIndex = val.match(/\[(.*?)\]/);
  if (matchArrayIndex) {
    return {
      index: matchArrayIndex[1],
      key: val.replace(matchArrayIndex[0], ''),
    };
  }
  return val;
}

module.exports = (value, data) => {
  try {
    const valuesToPull = value.split('.');
    while (valuesToPull.length) {
      const testValue = getArrayKeyIndex(valuesToPull.shift());
      if (typeof testValue === 'object') {
        if (testValue.index && testValue.key) {
          data = data[testValue.key][testValue.index];
        }
      } else {
        data = data[testValue];
      }
    }
    return data;
  } catch (e) {
    return '';
  }
}
