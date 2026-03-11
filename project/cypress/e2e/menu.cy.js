describe('Main Menu', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('shows main menu buttons', () => {

    cy.get('[data-cy=settings-button').should('exist')
    cy.get('[data-cy=theme-button').should('exist')
    cy.get('[data-cy=fullscreen-button').should('exist')
    cy.get('[data-cy=achievement-button]').should('exist')
    cy.get('[data-cy=bug-button]').should('exist')
  })

})