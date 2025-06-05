const renderHtml = require('../src/renderHtml')

describe('Stats Class tests',()=>{
    it('Should successfully render', async ()=>{
        await renderHtml('./reports', 'wdio-*')
    })
})
