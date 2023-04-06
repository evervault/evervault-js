/// <reference types="cypress" />
describe('evervault inputs', () => {
  context('v2 render localized inputs with custom fonts', () => {
    const teamUuid = '59a96deeef03';
    const appUuid =  'app_869a0605f7c3';
    const fontUrl = encodeURIComponent('https://fonts.googleapis.com/css2?family=Poppins:wght@100;800&display=swap');
    const fontFamily = encodeURIComponent("'Poppins', sans-serif");
    const labelWeight = '300';
    const labelFontSize = '24px';
    const inputFontSize = '30px';
    
    beforeEach(() => {
      cy.visit(`http://localhost:9000/v2/?team=${teamUuid}&app=${appUuid}&fontUrl=${fontUrl}&fontFamily=${fontFamily}&labelWeight=${labelWeight}&labelFontSize=${labelFontSize}&inputFontSize=${inputFontSize}`)
    })
  
    it('renders inputs with a custom font', () => {
      cy.get('[id=font-url]').should('have.length', 1);
      cy.get('body').should('have.css', 'font-family', 'Poppins, sans-serif')
    });

    it('inserts google fonts preconnect tags', () => {
      cy.get('[id=font-preconnect]').should('have.length', 1);
      cy.get('[id=font-preconnect-cors]').should('have.length', 1);
    });

    it('asserts that LabelFontSize is set to 24px', () => {
      cy.get('[data-testing=expirationDateLabel]').should('have.css', 'font-size', '24px');
    });

    it('asserts that labelWeight is set to 300', () => {
      cy.get('[data-testing=expirationDateLabel]').should('have.css', 'font-weight', '300');
    });

    it('asserts that inputFontSize is set to 30px', () => {
      cy.get('[id=expirationdate]').should('have.css', 'font-size', '30px');
    })
  });
});