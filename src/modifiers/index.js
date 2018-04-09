const uppercase = require('./uppercase.js');
const lowercase = require('./lowercase.js');
const title = require('./title.js');

const modifiers = [{
  key: 'uppercase',
  transform: uppercase,
},
{
  key: 'lowercase',
  transform: lowercase,
},
{
  key: 'title',
  transform: title,
}];


module.exports = modifiers;
