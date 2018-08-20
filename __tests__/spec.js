const Interpolator = require('../');

describe('Interpolator', () => {
  it('should initalize', () => {
    const interpolator = new Interpolator();
    expect(interpolator).toBeInstanceOf(Interpolator);
    expect(interpolator.delimiter).toEqual(expect.arrayContaining(['{','}']));
  });

  it('should initalize with options', () => {
    const options = {
      delimiter: ['[[',']]']
    };
    const interpolator = new Interpolator(options);
    expect(interpolator).toBeInstanceOf(Interpolator);
    expect(interpolator.options).toBe(options);
    expect(interpolator.delimiter).toEqual(expect.arrayContaining(['[[',']]']));
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

  it('should return itself if nothing is provided', () => {
    const str = 'Hello world';
    const interpolated = interpolator.parse(str);
    expect(interpolated).toBe(str);
  });

  it('should parse undefined data that has no alternative text', () => {
    const str = `Hi my name is {name|uppercase}`;
    const data = {
      notName: 'dan',
    }
    const interpolated = interpolator.parse(str, data);
    const expected = 'Hi my name is ';
    expect(interpolated).toMatch(expected);
  });

  it('should support data aliases references from helper function', () => {
    const testRef = () => 'test city data';
    const testKey = 'city';

    const test = interpolator.addAlias(testKey, testRef);
    expect(test.aliases[0].ref).toBe('test city data');
  });

  it('should add data aliases', () => {
    const originalReplace = `{name.first} {name.last} is from {locations[0]} {locations[1]}`;
    const replaceThis = `{firstName} {lastName} is from {city} {state}`;
    const data = {
        name: {
          first: 'Dan',
          last: 'Seripap',
        },
        locations: ['New York','NY'],
    }

    const aliases = [{
        key: 'firstName',
        ref: 'name.first'
    },
    {
        key: 'lastName',
        ref: 'name.last'
    },
    {
        key: 'city',
        ref: 'locations[0]'
    },
    {
        key: 'state',
        ref: 'locations[1]'
    }];

    // Add aliaseses to interpolator4
    aliases.forEach(alias => interpolator.addAlias(alias.key, alias.ref));
    
    const originalInterpolated = interpolator.parse(originalReplace, data);
    const interpolated = interpolator.parse(replaceThis, data);
    const expected = 'Dan Seripap is from New York NY';
    expect(originalInterpolated).toMatch(expected);
    expect(interpolated).toMatch(expected);
  });

  it('should ignore case from interpolated values from data aliasing', () => {
    const replaceThis = `{FIRSTNAME} {LASTNAME} is from {CiTy} {STaTe}`;
    const data = {
        name: {
          first: 'Dan',
          last: 'Seripap',
        },
        locations: ['New York','NY'],
    }

    const aliases = [{
        key: 'firstName',
        ref: 'name.first'
    },
    {
        key: 'LaSTNaME',
        ref: 'name.last'
    },
    {
        key: 'CITY',
        ref: 'locations[0]'
    },
    {
        key: 'state',
        ref: 'locations[1]'
    }];

    // Add aliaseses to interpolator4
    aliases.forEach(alias => interpolator.addAlias(alias.key, alias.ref));
    
    const interpolated = interpolator.parse(replaceThis, data);
    const expected = 'Dan Seripap is from New York NY';
    expect(interpolated).toMatch(expected);
  });
  
  it('should remove data aliases', () => {
    const replaceThis = `{city} is great!`;
    const data = {
      location: {
        city: 'New York'
      },
    }
    interpolator.addAlias('city', 'location.city');
    const interpolated = interpolator.parse(replaceThis, data);
    const expected = 'New York is great!';
    expect(interpolated).toBe(expected);

    interpolator.removeAlias('city');
    const interpolatedAgain = interpolator.parse(replaceThis, data);
    expect(interpolatedAgain).toBe(' is great!');
  });

  it('modifiers should have access to raw data', () => {
    const replaceThis = `2015 World Series Winner: {2015|year2015}`;
    const worldSeriesWinner = {
      winners: [{
        year: 2015,
        team: 'Royals'
      },
      {
        year: 2016,
        team: 'Cubs'
      },
      {
        year: 2017,
        team: 'Astros'
      }]
    };

    // val will be`2015`, data will be worldSeriesWinner
    const advanceCustomModifier = (val, data) => {
        try {
          // val is always a string, which is why parseInt is neccessary if referencing a number
          const winner = data.winners.find(winner => winner.year === parseInt(val));
          return winner.team;
        } catch (e) {
          console.log(e);
          return val;
        }
    }

    interpolator.registerModifier('year2015', advanceCustomModifier);

    const interpolated = interpolator.parse(replaceThis, worldSeriesWinner);
    // Output: 2015 World Series Winner: Royals
  });
});
