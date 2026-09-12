Feature: Inventory Cart
  As a signed-in shopper
  I want to add and remove products from my cart
  So that the cart always reflects what I intend to buy

# ── Happy Path ────────────────────────────────────────────────────

# Test Case Summary: Standard User adds one product and the cart badge shows a count of one
# Precondition: User is signed in and viewing the product list with an empty cart
@Smoke @Automatable @High @PBK-102 @ClaudeGeneratedTest @smokeBDD
Scenario: Standard User adds a product and the cart count becomes one
  Given the user is signed in and viewing the product list
  And the cart is empty
  When the user adds "Sauce Labs Backpack" to the cart
  Then the cart badge should show 1
  And the product's button should now read "Remove"

# Test Case Summary: Standard User adds two products and both appear on the cart page
# Precondition: User is signed in and viewing the product list with an empty cart
@Smoke @Automatable @High @PBK-102 @ClaudeGeneratedTest @smokeBDD
Scenario: Standard User adds two products and opens the cart to see both listed
  Given the user is signed in and viewing the product list
  And the cart is empty
  When the user adds "Sauce Labs Backpack" to the cart
  And the user adds "Sauce Labs Bike Light" to the cart
  And the user opens the cart
  Then the cart page should list 2 items
  And "Sauce Labs Backpack" should be listed in the cart
  And "Sauce Labs Bike Light" should be listed in the cart

# ── Business Rules & Restrictions ────────────────────────────────

# Test Case Summary: Standard User removes one of two products and the badge count drops to one
# Precondition: User is signed in with two products already in the cart
@Regression @Automatable @Medium @PBK-102 @BusinessCase @ClaudeGeneratedTest @smokeBDD
Scenario: Standard User removes a product and the cart count decrements
  Given the user is signed in and viewing the product list
  And the cart contains "Sauce Labs Backpack" and "Sauce Labs Bike Light"
  When the user removes "Sauce Labs Backpack" from the cart
  Then the cart badge should show 1
  And the "Sauce Labs Backpack" button should read "Add to cart" again

# ── Edge Cases ───────────────────────────────────────────────────

# Test Case Summary: Standard User removes the last product and the cart badge disappears
# Precondition: User is signed in with exactly one product in the cart
@Regression @Automatable @Low @PBK-102 @ClaudeGeneratedTest @smokeBDD
Scenario: Standard User empties the cart and the badge is no longer shown
  Given the user is signed in and viewing the product list
  And the cart contains "Sauce Labs Backpack"
  When the user removes "Sauce Labs Backpack" from the cart
  Then the cart badge should not be displayed

# Test Case Summary: Standard User starts a new session and the cart is empty
# Precondition: User has just signed in
@Regression @Automatable @Low @PBK-102 @ClaudeGeneratedTest @smokeBDD
Scenario: Standard User signs in and the cart starts empty
  Given the user has just signed in
  When the user opens the cart
  Then the cart badge should not be displayed
  And the cart page should list 0 items
