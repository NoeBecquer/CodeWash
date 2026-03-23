describe('Achievement Menu', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('opens achievement drawer', () => {
    cy.get('[data-cy=achievement-button]').click();

    cy.get('div.fixed').should('exist');
  });
});