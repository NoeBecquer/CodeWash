describe('Theme Drawer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('opens cosmetics drawer', () => {
    cy.get('[data-cy=theme-button]').click();

    // Overlay appears
    cy.get('div.fixed').should('exist');
  });
});