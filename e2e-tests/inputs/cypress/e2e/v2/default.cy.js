/// <reference types="cypress" />
import { CardLib } from '../../utils';

describe('evervault inputs', () => {
  context('v2 render default inputs', () => {
    beforeEach(() => {
      cy.visit('http://localhost:9000/v2/?team=59a96deeef03&app=app_869a0605f7c3')
    })
  
    it('renders inputs with CVV', () => {
      cy.get('#cardnumber').should('have.length', 1)
      cy.get('#expirationdate').should('have.length', 1)
      cy.get('#securitycode').should('have.length', 1)
    });

    it('does not show errors for correct fields', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.validCardNumber}{enter}`);
      cy.get('[data-testing=expirationdate]').type(`${CardLib.validExpirationData}{enter}`);
      cy.get('[data-testing=securitycode]').type(`${CardLib.validSecurityCode}{enter}`);

      cy.get('[data-testing=validation-message]').should('not.have.text', 'Your card number is invalid')
    });

    // Special test case as Amex cards CVV is 4 digits
    it('does not show errors for correct fields and amex card', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.validAmexCard}{enter}`);
      cy.get('[data-testing=expirationdate]').type(`${CardLib.validExpirationData}{enter}`);
      cy.get('[data-testing=securitycode]').type(`${CardLib.validAmexCVV}{enter}`);

      cy.get('[data-testing=validation-message]').should('not.have.text', 'Your CVC is invalid')
    });

    it('does show errors for incorrect card number', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.invalidCardNumber}{enter}`);

      cy.get('[data-testing=validation-message]').should('have.text', 'Your card number is invalid');
    });

    it('does show errors for incorrect exiry date', () => {
      cy.get('[data-testing=expirationdate]').type(`${CardLib.invalidExpirationData}{enter}`);

      cy.get('[data-testing=validation-message]').should('have.text', 'Your expiration date is invalid');
    });

    it('does show errors for incorrect cvv', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.validCardNumber}{enter}`);
      cy.get('[data-testing=expirationdate]').type(`${CardLib.validExpirationData}{enter}`);
      cy.get('[data-testing=securitycode]').type(`${CardLib.validAmexCVV}{enter}`);

      cy.get('[data-testing=validation-message]').should('have.text', 'Your CVC is invalid');
    });
  });

  context('v2 render with CCV disabled', () => {
    beforeEach(() => {
      cy.visit('http://localhost:9000/v2/?team=59a96deeef03&app=app_869a0605f7c3&disableCVV=true')
    })
  
    it('renders inputs without CVV', () => {
      cy.get('#cardnumber').should('have.length', 1)
      cy.get('#expirationdate').should('have.length', 1)
    })

    it('does not show errors for correct fields', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.validCardNumber}{enter}`);
      cy.get('[data-testing=expirationdate]').type(`${CardLib.validExpirationData}{enter}`);

      cy.get('[data-testing=validation-message]').should('not.have.text', 'Your card number is invalid')
    });

    it('does show errors for incorrect card number', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.invalidCardNumber}{enter}`);

      cy.get('[data-testing=validation-message]').should('have.text', 'Your card number is invalid');
    });

    it('does show errors for incorrect exiry date', () => {
      cy.get('[data-testing=expirationdate]').type(`${CardLib.invalidExpirationData}{enter}`);

      cy.get('[data-testing=validation-message]').should('have.text', 'Your expiration date is invalid');
    });
  });
});
