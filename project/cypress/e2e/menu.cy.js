describe('Main Menu', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('shows main menu buttons', () => {

    cy.contains('Play').should('exist')

    cy.contains('Settings').should('exist')

    cy.contains('Bug').should('exist')

  })

})