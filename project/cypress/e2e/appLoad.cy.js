describe('Application startup', () => {

  it('loads the homepage', () => {
    cy.visit('http://localhost:5173')

    cy.get('body').should('be.visible')
  })

})