describe('Critical Event App Flows', () => {
    beforeEach(() => {
        cy.visit('/');
        // Set mock user session using our Cypress hook
        cy.window().then(win => {
        .catch(err => console.error(err))