const WDIOReporter = require('@wdio/reporter').default
const Suite = require('./suite')
const Stats = require('./stats')
const Test = require('./test')
const { events } = require('./eventType')

class WdioMochaEmailableReporter extends WDIOReporter {
    constructor (options) {
        options = Object.assign(options)
        super(options)
        this.registerListeners()
    }

    registerListeners () {
        process.on(events.addComment, this.addComments.bind(this))
    }

    onRunnerStart (runner) {
        this.config = runner.config
        // Set sessionId
        if (runner.isMultiremote) {
            this.sessionId = {}
            let sanitizedCapabilities = ''
            Object.entries(runner.capabilities).forEach(([key, value], i) => {
                this.sessionId[key] = value.sessionId
                sanitizedCapabilities = sanitizedCapabilities.concat(`${value.browserName}.${value.browserVersion}.${value.platformName.split(' ')[0]}`)
                if (i < Object.keys(runner.capabilities).length - 1) {
                    sanitizedCapabilities = sanitizedCapabilities.concat(', ')
                }
            })
            this.sanitizedCaps = sanitizedCapabilities
        } else {
            this.sanitizedCaps = runner.sanitizedCapabilities
            this.sessionId = runner.sessionId
        }

        this.results = {
            stats: new Stats(runner.start),
            suites: new Suite(true, { title: '' }),
            copyrightYear: new Date().getFullYear()
        }
    }

    onSuiteStart (suite) {
        this.currSuite = new Suite(false, suite, this.sanitizedCaps)
        this.results.stats.incrementSuites()
    }

    onTestStart (test) {
        this.currTest = new Test(test, this.currSuite.uuid)
        this.currTest.addSessionContext(this.sessionId)
    }

    onTestSkip (test) {
        this.currTest = new Test(test, this.currSuite.uuid)
        this.currTest.addSessionContext(this.sessionId)
    }

    onAfterCommand (cmd) {
        const isScreenshotEndpoint = /\/session\/[^/]*\/screenshot/
        if (isScreenshotEndpoint.test(cmd.endpoint) && cmd.result.value) {
            this.currTest.addScreenshotContext(cmd.result.value)
        }
    }

    onTestEnd (test) {
        this.currTest.duration = test._duration
        this.currTest.updateResult(test)
        this.currTest.context = JSON.stringify(this.currTest.context)
        this.currSuite.addTest(this.currTest)
        this.results.stats.incrementTests(this.currTest)
    }

    onSuiteEnd (suite) {
        this.currSuite.duration = suite.duration
        this.results.suites.addSuite(this.currSuite)

        this.results.stats.end = suite.end
        this.results.stats.duration = suite.duration
        this.write(JSON.stringify(this.results))
    }

    // onRunnerEnd (runner) {
    //     this.results.stats.end = runner.end
    //     this.results.stats.duration = runner.duration
    //     this.write(JSON.stringify(this.results))
    // }

    addComments (args) {
        this.currTest.addCommentContext(args)
    }

    static addComment = (value) => {
        process.emit(events.addComment, value)
    }
}

exports.default = WdioMochaEmailableReporter
