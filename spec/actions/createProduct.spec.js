'use strict'
describe('Wirecard Create product', () => {
  const expect = require('chai').expect

  describe('post proper data', () => {
    it('should get catalogues and call GET /v1/productCatalogues')
    it('should call POST /v1/productCatalogues/{catalogueId}/products')
    it('should return created product', () => {
      expect(5).to.be.equal(5)
    })
    it('should end')
  })

  describe('post malformed data', () => {
    it('should emit and error')
    it('should end')
  })
})
