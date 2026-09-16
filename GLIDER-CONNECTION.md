# Glider strategy connection

The app is configured to enroll Base vaults into this Glider strategy:

`01KZY1G56YFYWKS8AH0PR1YMQX`

Glider’s V2 enrollment requires the API key's tenant to be authorized as a distributor for the strategy, with the `enroll:write` scope. The current key is valid enough to reach Glider but is not authorized for this strategy, so vault creation is correctly blocked before any funds move.

Ask the strategy owner to add your Glider tenant as a strategy distributor. Once they grant that access, users will be able to sign the enrollment message and Glider will create their Base smart-account vault.
