describe('App Launch', () => {
  it('loads the home page', () => {
    cy.visit('http://localhost:5173')
    cy.contains('Play')
  })
})