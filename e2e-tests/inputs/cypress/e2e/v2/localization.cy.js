/// <reference types="cypress" />
import translations from '../../fixtures/translations.json'
import { CardLib } from '../../utils';

describe('evervault inputs', () => {
  context('v2 render localized inputs', () => {
    beforeEach(() => {
      cy.visit(`http://localhost:9000/v2/?team=59a96deeef03&app=app_869a0605f7c3&cardNumberLabel=${translations['FR'].cardNumberLabel}&invalidCardNumberLabel=${translations['FR'].invalidCardNumberLabel}&expirationDateLabel=${translations['FR'].expirationDateLabel}&expirationDatePlaceholder=${translations['FR'].expirationDatePlaceholder}&invalidExpirationDateLabel=${translations['FR'].invalidExpirationDateLabel}&invalidCardNumberLabel=${translations['FR'].invalidCardNumberLabel}&invalidSecurityCodeLabel=${translations['FR'].invalidSecurityCodeLabel}&&securityCodeLabel=${translations['FR'].securityCodeLabel}`);
    })
  
    it('renders inputs', () => {
      cy.get('[data-testing=cardnumber]').should('have.length', 1);
      cy.get('[data-testing=expirationdate]').should('have.length', 1);
      cy.get('[data-testing=securitycode]').should('have.length', 1);
    });

    it('renders the fields with localized language', () => {
      cy.get('[data-testing=cardNumberLabel]').should('have.text', translations['FR'].cardNumberLabel);
      cy.get('[data-testing=expirationDateLabel]').should('have.text', translations['FR'].expirationDateLabel);
      cy.get('[data-testing=securityCodeLabel]').should('have.text', translations['FR'].securityCodeLabel);
    });

    it('renders card number error in localized language', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.invalidCardNumber}{enter}`);
      cy.get('[data-testing=validation-message]').should('have.text', translations['FR'].invalidCardNumberLabel);
    });

    it('renders expiration date error in localized language', () => {
      cy.get('[data-testing=expirationdate]').type(`${CardLib.invalidExpirationData}{enter}`);
      cy.get('[data-testing=validation-message]').should('have.text', translations['FR'].invalidExpirationDateLabel);
    });

    it('renders security code error in localized language', () => {
      cy.get('[data-testing=cardnumber]').type(`${CardLib.validCardNumber}{enter}`);
      cy.get('[data-testing=expirationdate]').type(`${CardLib.validExpirationData}{enter}`);
      cy.get('[data-testing=securitycode]').type(`${CardLib.invalidSecurityCode}{enter}`);
      cy.get('[data-testing=validation-message]').should('have.text', translations['FR'].invalidSecurityCodeLabel);
    });
  });
});
