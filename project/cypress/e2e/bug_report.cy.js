describe('Bug Report', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('opens bug report modal', () => {
    cy.get('[data-cy=bug-button]').click();

    cy.contains(/bug/i).should('exist');
  });
});