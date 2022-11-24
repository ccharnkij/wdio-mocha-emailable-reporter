WDIO Mocha Emailable Reporter
=========================

Generates test results in the a single page emailable HTML. Inspired by [wdio-mochawesome-reporter](https://github.com/fijijavis/wdio-mochawesome-reporter), this is pretty much a clone with the exception of generating a single page HTML report instead of merged json file.

## Installation

* NPM

```bash
npm install wdio-mocha-emailable-reporter --save-dev
```

## Configuration

### Import

```js
import WdioMochaEmailableReporter from 'wdio-mocha-emailable-reporter';
```

### Results to File

```js
reporters: [
  ['WdioMochaEmailableReporter',{
      outputDir: './Results'
  }]
],
```

### Results to File with custom file name

```js
reporters: [
  ['WdioMochaEmailableReporter',{
    outputDir: './Results',
    outputFileFormat: function(opts) {
        return `results-${opts.cid}.${opts.capabilities}.json`
    }
  }]
],
```

## Result Files

### Command line

### As part of a wdio hook

The `onComplete` is a great place to call the `renderHtml` script. Usage this way requires passing in the results directory and the file pattern as arguments to the script.

```javascript
// Located in your wdio.conf.js file
onComplete: function (exitCode, config, capabilities, results) {
  const renderHtml = require('wdio-mocha-emailable-reporter/renderHtml');
  renderHtml('./mocha-results', 'wdio-*');
}
```

Upon completion, the result script will output a single html file named `result.html` in the provided <RESULTS_DIR>

## Custom variable

Custom variable can be included in the result html by creating `mocha-emailable.properties` file in the project root. Additionally, environment variable can also be used in real time.

```
// Set environment variable
export BASE_URL=http://www.test.com

// Properties file
NAME=Test
BASE_URL=${BASE_URL}
```

## Custom comments

Comments can be added to the report by using the `addComment` event.

```
import WdioMochaEmailableReporter from 'wdio-mocha-emailable-reporter';

WdioMochaEmailableReporter.addComment('test')
```
