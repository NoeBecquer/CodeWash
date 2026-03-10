describe('Main Menu', () => {
  it('loads the homepage', () => {
    cy.visit('http://localhost:5173')
    cy.contains('Level')
  })
})