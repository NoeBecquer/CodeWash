describe('Navigation', () => {

  it('can click the play button', () => {

    cy.visit('http://localhost:5173')

    cy.contains('Play').click()

    cy.url().should('not.eq', 'http://localhost:5173/')
  })

})