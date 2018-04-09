const Interpolator = require('../');

describe('Interpolator', () => {
  it('should initalize', () => {
    const interpolator = new Interpolator();
    expect(interpolator).toBeInstanceOf(Interpolator);
    expect(interpolator.delimiter()).toEqual(expect.arrayContaining(['{','}']));
  });

  it('should initalize with options', () => {
    const options = {
      delimiter: ['[[',']]']
    };
    const interpolator = new Interpolator(options);
    expect(interpolator).toBeInstanceOf(Interpolator);
    expect(interpolator.options).toBe(options);
    expect(interpolator.delimiter()).toEqual(expect.arrayContaining(['[[',']]']));
  });
});

describe('Parser', () => {
  let interpolator = null;

  beforeEach(() => {
    interpolator = new Interpolator();
  });

  it('should parse interpolated text', () => {
    const str = 'Hi my name is {name}';
    const data = {
      name: 'dan',
    }
    const interpolated = interpolator.parse(str, data);
    const expected = 'Hi my name is dan';
    expect(interpolated).toBe(expected);
  });

  it('should parsed interpolated text with alt text', () => {
    const str = `Hi my name is {name:Altnerative}`;
    const interpolated = interpolator.parse(str);
    const expected = 'Hi my name is Altnerative';
    expect(interpolated).toMatch(expected);
  });

  it('should fail gracefully', () => {
    const str = 'Hi my name is {name}';
    const data = {
      names: 'dan',
    };
    const interpolated = interpolator.parse(str);
    const expected = 'Hi my name is ';
    expect(interpolated).toMatch(expected);    
  });

  it('should parse interpolated text with modifier', () => {
    const str = `Hi my name is {name|uppercase}`;
    const data = {
      name: 'dan',
    }
    const interpolated = interpolator.parse(str, data);
    const expected = 'Hi my name is DAN';
    expect(interpolated).toBe(expected);
  });

  it('should parse interpolated text with alternative text with modifier', () => {
    const str = `Hi my name is {name:alTernAtive|uppercase}`;
    const interpolated = interpolator.parse(str);
    const expected = 'Hi my name is ALTERNATIVE';
    expect(interpolated).toBe(expected);
  });

  it('should register and execute custom modifiers successfully', () => {
    const replaceThis = `Hi, my name is {name|customModifier}.`;
    const data = {
      name: 'Dan',
    };
    const customModifier = str => str.split('').reverse().join('');
    interpolator.registerModifier('customModifier', customModifier)

    const interpolated = interpolator.parse(replaceThis, data);
    const expected = 'Hi, my name is naD.';
    expect(interpolated).toBe(expected);
  });

  it('should gracefullt fail undefined modifiers', () => {
    const replaceThis = `Hi, my name is {name|undefinedModifier}.`;
    const data = {
      name: 'Dan',
    };
    const interpolated = interpolator.parse(replaceThis, data);
    const expected = 'Hi, my name is Dan.';
    expect(interpolated).toBe(expected);
  });
});
