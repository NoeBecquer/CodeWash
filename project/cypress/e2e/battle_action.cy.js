describe('Battle Action Button', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('starts mini game when clicking battle button', () => {
    cy.get('[data-active="true"]')
      .find('[data-cy=battle-button]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // battle overlay (portal) appears
    cy.get('div.fixed').should('exist');
  });
});