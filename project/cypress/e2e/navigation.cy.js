describe('Navigation', () => {

  it('can start a battle from the main menu', () => {

    cy.visit('http://localhost:5173')

    cy.get('.perspective-1000')
      .find('div')
      .eq(3)
      .click({ force: true })

  })

})