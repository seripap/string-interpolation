# String Interpolation

[![Build Status](https://travis-ci.org/seripap/string-interpolation.svg?branch=master)](https://travis-ci.org/seripap/string-interpolation)

This package assists with dynamic string interpolation and on the fly value transformation. You're likely to find this useful if you're using a CMS that allows text input and want to transform value entry without writing a lot of code.

## Example

In a real world scenario, `Hi, my name is {name}.` is coming from a CMS entered by an editor. The content editor knows nothing technical about `{name}` but understands that `{name}` is replaced with an actual name on the client.

```js
const Interpolator = require('string-interpolation');

// This isn't needed, unless you need to change your interpolation brackets to something else
const options = {
    delimiter: ['{','}'],
};
const interpolator = new Interpolator(options);

const replaceThis = `Welcome back, {username}!`;
const data = {
    username: 'Dan',
};
interpolator.parse(replaceThis, data);
// Welcome back, Dan!
```

## Documentation

### Options (optional)

- `delimiter`: Array; Must be an array of 2 items. This is the start and end values of the delimiter. Defaults to `{}`

```js
// Defaults
{
    delimiter: ['{','}'],
}
```

### Alternative Text

If data key is not defined, you can provide an alternative value. Just delineate the alternative text with a colon `:` after the data key. Due to current limitations, you cannot use reserved symbols (`|`, `:`) as an alternative text.

If you need to include reserved symbols as an alt text, feel free to open up a PR for a fix :).

```js
const replaceThis = `Hi, my name is {name:Altnerative Text}.`;
const interpolator = new Interpolator();

interpolator.parse(replaceThis);
// Hi, my name is Alternative Text.
```

### Modifiers

Modifiers are functions that transform interpolated text. These are applied by reducing strings parsed from the interpolator. By specifying a pipe `|`, the parser will transform interpolated text based on modifiers leading the pipe. This will also do transformations on alternative text if provided.

```js
const Interpolator = require('string-interpolator');
const interpolator = new Interpolator();

const replaceThis = `Hi, my name is {name|uppercase}.`;
const data = {
    name: 'Dan',
};

interpolator.parse(replaceThis, data);
// Hi, my name is DAN.
```

You can add as many modifiers as you'd like by seperating with a comma. Useful if you are using custom modifiers and want to reduce a string, not quite as useful with the example below.

```js
const Interpolator = require('string-interpolator');
const interpolator = new Interpolator();

// This will transform to title case, and then lowercase
const replaceThis = `Hi, my name is {name|title,lowercase}.`;
const data = {
    name: 'Dan',
};

interpolator.parse(replaceThis, data);
// Hi, my name is dan.
```

#### Built in modifiers

| modifier | description |
|---|---|
| title | Converts to title case |
| uppercase | Converts to uppercase |
| lowercase | Converts to lowercase |

**All modifiers, whether custom or prebuilt are not case sensitive**. You can name a modifier whatever you'd like but it will all get parsed as lowercased text values.

### Custom modifiers

You can also build your own modifiers. Modifiers are functions that receives interpolated strings and transforms them.

#### .registerModifier(key, modifier)

- `key`: Unique key that annotates the modifier
- `modifier`: Function to execute when reducing string

You can reference the interpolated value and data passed while parsing.

```js
const customModifier = (val) => val.split('').reverse().join('');
```

#### Simple Example

```js
const Interpolator = require('string-interpolator');
const interpolator = new Interpolator();

const replaceThis = `Hi, my name is {name|customModifier}.`;
const data = {
    name: 'Dan',
};

// `str` in this case will be "Dan"
const customModifier = str => str.split('').reverse().join('');

// Register modifier with interpolation service with the name "customModifier" This is actually parsed internally as `custommodifier`, but to keep it pretty, you should consider using camel cases.
interpolator.registerModifier('customModifier', customModifier);

interpolator.parse(replaceThis, data);
// Output: Hi, my name is naD.
```

#### Advance Example

Assuming you do not want to make data alias to the referenced data point (see below), you can parse the raw data from the modifier itself. Be sure to try/catch.

```js
const Interpolator = require('string-interpolator');
const interpolator = new Interpolator();

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
```

### Data Alias

Sometimes when data is passed as an object, you'd need to access a specific node or array item.

Consider the expected: `Dan Seripap is from New York, NY`. Let's say our data structure looks like this:

```js
const data = {
    name: {
        first: 'Dan',
        last: 'Seripap',
    },
    locations: ['New York','NY'],
}
```

We want to interpolate correctly the following text: `Dan Seripap is from New York, NY`. If you know exactly where these nodes exists, you can provide the following string to be interpolated: `{name.first} {name.last} is from {locations[0]} {locations[1]}`.

However, sometimes interpolated text is coming from a source where its data origins are unknown. In this case, we need to add some data references to where these data points actually exist.

#### .addAlias(key, ref)

- `key`: Key that indicates a reference to what is being replaced
- `ref`: Reference to key value from parent object

```js
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

// Add aliaseses to interpolator
aliases.forEach(alias => interpolator.addAlias(alias.key, alias.ref));
```

These aliases now define keys to exact locations of where values exists. We can now interpolate the text: `{firstName} {lastName} is from {city} {state}` which yeilds the same results as .

#### .removeAlias(key)

Removes a referenced alias point by key.
