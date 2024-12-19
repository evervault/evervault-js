const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { expect } = require('chai');
const peggy = require('peggy');

const rawGrammar = readFileSync(resolve(__dirname, './grammar.peggy'), 'utf8');
const compiledParser = peggy.generate(rawGrammar);

const TEST_CASES = [
  {
    query: 'service = relay',
    result: {
      type: 'comparison',
      left: 'service',
      operator: '=',
      right: 'relay',
    },
  },
  {
    query: 'http.request.method = POST',
    result: {
      type: 'comparison',
      left: 'http.request.method',
      operator: '=',
      right: 'POST',
    },
  },
  {
    query: 'error: "Network timeout"',
    result: {
      type: 'comparison',
      left: 'error',
      operator: ':',
      right: 'Network timeout',
    },
  },
  {
    query: 'some_status = error',
    result: {
      type: 'comparison',
      left: 'some_status',
      operator: '=',
      right: 'error',
    },
  },
  {
    query: 'service != function',
    result: {
      type: 'comparison',
      left: 'service',
      operator: '!=',
      right: 'function',
    },
  },
  {
    query: 'service !: function',
    result: {
      type: 'comparison',
      left: 'service',
      operator: '!:',
      right: 'function',
    },
  },
  {
    query: 'service = relay AND latency > 1000',
    result: {
      type: 'compound',
      operator: 'AND',
      left: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'relay',
      },
      right: {
        type: 'comparison',
        left: 'latency',
        operator: '>',
        right: '1000',
      },
    },
  },
  {
    query: 'service = relay AND latency >= 1000',
    result: {
      type: 'compound',
      operator: 'AND',
      left: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'relay',
      },
      right: {
        type: 'comparison',
        left: 'latency',
        operator: '>=',
        right: '1000',
      },
    },
  },
  {
    query: 'service = relay AND latency <= 1000',
    result: {
      type: 'compound',
      operator: 'AND',
      left: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'relay',
      },
      right: {
        type: 'comparison',
        left: 'latency',
        operator: '<=',
        right: '1000',
      },
    },
  },
  {
    query: 'service = relay OR service = function',
    result: {
      type: 'compound',
      operator: 'OR',
      left: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'relay',
      },
      right: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'function',
      },
    },
  },
  {
    query:
      '(service = relay AND latency > 800) OR (service = function AND error: Timeout)',
    result: {
      type: 'compound',
      operator: 'OR',
      left: {
        type: 'compound',
        operator: 'AND',
        left: {
          type: 'comparison',
          left: 'service',
          operator: '=',
          right: 'relay',
        },
        right: {
          type: 'comparison',
          left: 'latency',
          operator: '>',
          right: '800',
        },
      },
      right: {
        type: 'compound',
        operator: 'AND',
        left: {
          type: 'comparison',
          left: 'service',
          operator: '=',
          right: 'function',
        },
        right: {
          type: 'comparison',
          left: 'error',
          operator: ':',
          right: 'Timeout',
        },
      },
    },
  },
  {
    query:
      '((service=relay AND level=error) OR (service=function AND error=timeout)) AND encryption.num_encrypts>3',
    result: {
      type: 'compound',
      operator: 'AND',
      left: {
        type: 'compound',
        operator: 'OR',
        left: {
          type: 'compound',
          operator: 'AND',
          left: {
            type: 'comparison',
            operator: '=',
            left: 'service',
            right: 'relay',
          },
          right: {
            type: 'comparison',
            operator: '=',
            left: 'level',
            right: 'error',
          },
        },
        right: {
          type: 'compound',
          operator: 'AND',
          left: {
            type: 'comparison',
            operator: '=',
            left: 'service',
            right: 'function',
          },
          right: {
            type: 'comparison',
            operator: '=',
            left: 'error',
            right: 'timeout',
          },
        },
      },
      right: {
        type: 'comparison',
        operator: '>',
        left: 'encryption.num_encrypts',
        right: '3',
      },
    },
  },
];

describe('EQL Parser', () => {
  TEST_CASES.forEach((c) => {
    it(`Can parse EQL: ${c.query}`, () => {
      const result = compiledParser.parse(c.query);
      expect(result).to.deep.equal(c.result);
    });
  });

  it('Implcitly uses AND for multiple comparisons', () => {
    const result = compiledParser.parse('service = relay latency > 1000');
    expect(result).to.deep.equal({
      type: 'compound',
      operator: 'AND',
      left: {
        type: 'comparison',
        left: 'service',
        operator: '=',
        right: 'relay',
      },
      right: {
        type: 'comparison',
        left: 'latency',
        operator: '>',
        right: '1000',
      },
    });
  });

  it('Does not allow keys to begin with .', () => {
    expect(() => compiledParser.parse('.service = relay')).to.throw();
  });

  it('Does not allow keys to end with .', () => {
    expect(() => compiledParser.parse('service. = relay')).to.throw();
  });

  it('Does not allow keys to contain consecutive .', () => {
    expect(() => compiledParser.parse('service..name = relay')).to.throw();
  });

  it('Requires comparisons to have a key and value', () => {
    expect(() => compiledParser.parse('service = relay = function')).to.throw();
  });

  it('Accepts lowercase compound keywords', () => {
    expect(() => {
      compiledParser.parse('service = relay and latency > 1000');
    }).to.not.throw();
  });

  it('Accepts multiple nested parenthesis', () => {
    expect(() => {
      compiledParser.parse('(((service = relay)))');
    }).to.not.throw();
  });

  it('Accepts "and" keyword as a value when used in a comparison', () => {
    expect(() => {
      compiledParser.parse('service = and');
    }).to.not.throw();
  });
});
