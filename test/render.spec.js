const renderHtml = require('../src/renderHtml')

describe('Stats Class tests',()=>{
    it('Should successfully render',()=>{
        renderHtml('./reports', 'wdio-*')
    })
})
