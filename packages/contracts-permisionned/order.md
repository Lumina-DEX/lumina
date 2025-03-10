# Order book solution

I think there are 3 solutions open to us :

## Offchain

One solution would be for users to submit orders to a contract and an application developed in-house would find the orders that match and submit them to the contract. Of course, everything would have to be publicly verifiable to prove that Lumina is operating honestly, we can use proof (ZkProgram) to handle it.

#### Advantage

We can implement complex solutions and allow different types of order to be created, and we can add functionalities without having to update contracts.
That's how CEX works, but with added transparency.

#### Disadvantage

Requires trust in our offchain application, in the event of a failure or bug it can block the application from working properly.

![Offchain schema](https://github.com/Lumina-DEX/lumina-permissioned/blob/feat/permissioned/packages/contracts/order-offchain.png?raw=true)

## Onchain action state

We can use the action state with reducer or batch reducers, and manage orders totally onchain

#### Advantage

Once the code is audited he can be trusted by the users, and different front can exploit it

#### Disadvantage

Action state has some limitation, batch reducer didn't have same limitations, we need to use o1js and it can be more difficult to implement some algorithm, maybe we need to settle action state sometimes to prevent from too many data to handle, and any update need to upgrade the smartcontract

![Onchain action state schema](https://github.com/Lumina-DEX/lumina-permissioned/blob/feat/permissioned/packages/contracts/order-onchain.png?raw=true)

## Protokit

We can use protokit to create the order book with all this functionnalities

#### Advantage

We can implement different solutions more easily than action state, can be faster to generate a proof, also we can audit the solution ( but I don't know for the moment how we can upgrade a protokit solution)

#### Disadvantage

Assets need to be bridge to protokit, some algorithm can be difficult to implement, we need to host the protokit solution and the app can't be use if the rollup is down, also the solution will be centralized

![Onchain action state schema](https://github.com/Lumina-DEX/lumina-permissioned/blob/feat/permissioned/packages/contracts/order-protokit.png?raw=true)
