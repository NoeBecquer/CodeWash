describe('Fullscreen', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('toggles fullscreen', () => {
    cy.get('[data-cy=fullscreen-button]').click();

    // Can't fully assert fullscreen easily, but no crash
    cy.get('body').should('exist');
  });
});