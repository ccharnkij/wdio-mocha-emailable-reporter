const fs = require('fs')
const path = require('path')
const nunjucks = require('nunjucks')
const prettyMs = require('pretty-ms')
const propertiesReader = require('properties-reader')
const appRoot = require('app-root-path')
const propFile = appRoot + '/mocha-emailable.properties'

const render = (dir, mergedResults, customFileName) => {
    const environment = nunjucks.configure([path.join(__dirname, '../templates/')], { // set folders with templates
        autoescape: true
    })

    environment.addGlobal('renderImage', function (contextString) {
        const context = JSON.parse(contextString)

        for (let i = 0; i < context.length; i++) {
            if (context[i].title === 'Screenshot') {
                return context[i].value
            }
        }
    })

    environment.addGlobal('prettyMs', function (start, end) {
        return prettyMs(Date.parse(end) - Date.parse(start))
    })

    const customProp = readProperties()
    mergedResults.customProp = customProp

    const html = nunjucks.render('report.html', mergedResults)
    const htmlEmail = nunjucks.render('reportEmailBody.html', mergedResults)

    const fileName = customFileName || 'result.html'
    const filePath = path.join(dir, fileName)

    const fileEmailName = `${fileName.split('.')[0] + '-email.html'}`
    const fileEmailPath = path.join(dir, fileEmailName)

    fs.writeFileSync(filePath, html)
    fs.writeFileSync(fileEmailPath, htmlEmail)
}

const renderHtml = (...args) => {
    const dir = args[0] || process.argv[2]
    const filePattern = args[1] || process.argv[3]
    const customFileName = args[2] || process.argv[4]

    try {
        const rawData = getDataFromFiles(dir, filePattern)
        const mergedResults = mergeData(rawData)
        render(dir, mergedResults, customFileName)
    } catch (e) {
        console.log(e)
    }
}

function getDataFromFiles (dir, filePattern) {
    const fileNames = fs.readdirSync(dir).filter(file => file.match(filePattern))
    const data = []

    fileNames.forEach(fileName => {
        try {
            data.push(JSON.parse(fs.readFileSync(`${dir}/${fileName}`)))
        } catch (e) {
            // Invalid file
        }
    })

    return data
}

function mergeData (rawData) {
    let mergedResults
    rawData.forEach(data => {
        if (mergedResults === undefined) {
            mergedResults = {}
            Object.assign(mergedResults, data)
        } else {
            // increment stats totals
            mergedResults.stats.suites += data.stats.suites
            mergedResults.stats.tests += data.stats.tests
            mergedResults.stats.passes += data.stats.passes
            mergedResults.stats.pending += data.stats.pending
            mergedResults.stats.failures += data.stats.failures
            mergedResults.stats.duration += data.stats.duration
            mergedResults.stats.testsRegistered += data.stats.testsRegistered
            mergedResults.stats.skipped += data.stats.skipped
            mergedResults.stats.hasSkipped = mergedResults.stats.skipped > 0
            mergedResults.stats.passPercent = mergedResults.stats.tests === 0 ? 0 : Math.round((mergedResults.stats.passes / mergedResults.stats.tests) * 100)
            mergedResults.stats.pendingPercent = mergedResults.stats.tests === 0 ? 0 : Math.round((mergedResults.stats.pending / mergedResults.stats.tests) * 100)

            // duration
            if (mergedResults.stats.start > data.stats.start) {
                mergedResults.stats.start = data.stats.start
            }
            if (mergedResults.stats.end < data.stats.end) {
                mergedResults.stats.end = data.stats.end
            }

            // add suites
            data.suites.suites.forEach(suite => {
                mergedResults.suites.suites.push(suite)
            })
        }
    })
    return mergedResults
}

function readProperties () {
    const customProp = {}

    if (fs.existsSync(propFile)) {
        const properties = propertiesReader(propFile)
        const regex = /\${[^\s]*}/g

        for (const i of Object.keys(properties._properties)) {
            const match = properties._properties[i].match(regex)
            if (match && match.length) {
                for (const e of match) {
                    const envValue = process.env[e.slice(2, -1)]
                    if (envValue) {
                        customProp[i] = properties._properties[i].replace(e, envValue)
                    }
                }
            } else {
                customProp[i] = properties._properties[i]
            }
        }
    }

    return customProp
}

module.exports = renderHtml
