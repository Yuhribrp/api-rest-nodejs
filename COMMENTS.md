# Unit Tests:
 - small unity of the application, isolated.

# Integration Tests:
 - Communication between two or more unities.

# EndToEnd Tests:
 - Simulates an user operating in the app.
 - In this case, in tha backend, the user is the front-end.
 - Can make HTTP requests, WebSockets etc..
  ### Obs:
    - A test never can depend on another test.
    - With is depending, they should be the same test.