const defaultOptions = require('./statics/DefaultOptions.js');
const getValueFromObject = require('./lib/getValueFromObject.js');
const defaultModifiers = require('./modifiers');

class Interpolator {
  constructor(options = defaultOptions) {
    this.options = options;
    this.modifiers = [];
    this.aliases = [];
    this.registerBuiltInModifiers();
  }

  registerBuiltInModifiers() {
    defaultModifiers.forEach(modifier => this.registerModifier(modifier.key, modifier.transform));
    return this;
  }

  get delimiter() {
    return this.options.delimiter;
  }

  delimiterStart() {
    return this.options.delimiter[0];
  }

  delimiterEnd() {
    return this.options.delimiter[1];
  }

  registerModifier(key, transform) {
    if (!key) {
      return new Error('Modifiers must have a key');
    }
    
    if (typeof transform !== 'function') {
      return new Error('Modifiers must have a transformer. Transformers must be a function that returns a value.');
    }

    this.modifiers.push({key, transform});
    return this;
  }

  parseRules(str) {
    const regex = `${this.delimiterStart()}([^}]+)${this.delimiterEnd()}`;
    const execRegex = new RegExp(regex, 'gi');
    const matches = str.match(execRegex);

    // const parsableMatches = matches.map((match) => ({ key: removeDelimiter(match), replaceWith: match }));
    return matches ? this.extractRules(matches) : [];
  }

  extractRules(matches) {
    return matches.map((match) => {
      const alternativeText = this.getAlternativeText(match);
      const modifiers = this.getModifiers(match);
      return {
        key: this.getKeyFromMatch(match),
        replace: match,
        modifiers,
        alternativeText
      }
    })
  }

  getKeyFromMatch(match) {
    let mutableMatch = match;
    if (mutableMatch.indexOf(':') > 0) {
      mutableMatch = this.removeAfter(mutableMatch, ':');
    }

    if (mutableMatch.indexOf('|') > 0) {
      mutableMatch = this.removeAfter(mutableMatch, '|')
    }

    return this.removeDelimiter(mutableMatch);
  }

  removeDelimiter(val) {
    return val.replace(new RegExp(this.delimiterStart(), 'g'), '').replace(new RegExp(this.delimiterEnd(), 'g'), '');
  }

  removeAfter(str, val) {
    return str.substring(0, str.indexOf(val));
  }

  extractAfter(str, val) {
    return str.substring(str.indexOf(val) + 1);
  }

  getAlternativeText(str) {
    if (str.indexOf(':') > 0) {
      const altText = this.removeDelimiter(this.extractAfter(str, ':'));
      if (altText.indexOf('|') > 0) {
        return this.removeAfter(altText, '|');
      }
      return altText;
    }

    return '';
  }

  getModifiers(str) {
    if (str.indexOf('|') > 0) {
      const strModifiers = this.removeDelimiter(this.extractAfter(str, '|')).split(',');
      return strModifiers.map(modifier => this.getModifier(modifier));
    }

    return [];
  }

  parse(str = '', data = {}) {
    const rules = this.parseRules(str);
    if (rules && rules.length > 0) {
      return this.parseFromRules(str, data, rules);
    }

    return str;
  }

  parseFromRules(str, data, rules) {
    return rules.reduce((reducedStr, rule) => this.applyRule(reducedStr, rule, data), str);
  }

  applyRule(str, rule, data = {}) {
    const dataToReplace = this.applyData(rule.key, data);
    if (dataToReplace) {
      return str.replace(rule.replace, this.applyModifiers(rule.modifiers, dataToReplace));
    } else if (rule.alternativeText) {
      return str.replace(rule.replace, this.applyModifiers(rule.modifiers, rule.alternativeText));
    }

    return str.replace(rule.replace, '');
  }

  getFromAlias(key) {
    return this.aliases.find(alias => alias.key === key);
  }

  applyData(key, data) {
    const alias = this.getFromAlias(key);
    if (alias) {
      const value = getValueFromObject(alias.ref, data);
      if (value) {
        return value;
      }
    }
    return (key.indexOf('.') > 0 || key.indexOf('[') > 0) ? getValueFromObject(key, data) : data[key];
  }

  getModifier(key) {
    return this.modifiers.find(modifier => modifier.key === key);
  }

  applyModifiers(modifiers, str) {
    try {
      const transformers = modifiers.map(modifier => modifier.transform);
      return transformers.reduce((str, transform) => transform(str), str);
    } catch (e) {
      return str;
    }
  }

  addAlias(key, ref) {
    this.aliases.push({ key, ref });
    return this;
  }

  removeAlias(key) {
    this.aliases = this.aliases.filter(alias => alias.key !== key);
    return this;
  }
}

module.exports = Interpolator;
