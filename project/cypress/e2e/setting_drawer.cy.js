describe('Settings Drawer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('opens settings drawer', () => {
    cy.get('[data-cy=settings-button]').click();

    // Drawer should appear (we rely on DOM change)
    cy.contains(/settings/i).should('exist');
  });
});