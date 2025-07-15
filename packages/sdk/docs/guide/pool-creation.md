---
title: Server-Side Pool Creation
---

# Server-Side Pool Creation

Lumina DEX SDK use server-side pool creation by default. This feature offloads the heavy computation of pool creation to a server and allows users to easily migrate liquidity in-case of a hardfork.

::: warning
It is not recommend to create pools directly on client-side. The SDK exposes a way to do it for reference, but it is not the intended use case.
:::

## Overview

Deploying a pool is extremely simple : Send a `DeployPool` event. However, it is useful to understand how the SDK handles this process under the hood.

The server-side pool creation process is managed by a dedicated state machine, `createPoolMachine`. This machine handles the entire lifecycle of creating a pool, from initiating the request to confirming the transaction on-chain.

::: tip
You can access `createPoolMachine` through the main `dexMachine` context with `useSelector`.
:::

When you want to create a new pool, you send a `DeployPool` event to the `dexMachine`. This event triggers the spawning of a new `createPoolMachine` actor that will handle the pool creation process.

The main `dexMachine` now orchestrates `createPoolMachine` actors. When you trigger a `DeployPool` event on the `dexMachine`, it spawns a new `createPoolMachine` actor for that specific pool creation task.

You can track the progress of each pool creation job by accessing the spawned actors from the `dexMachine`'s context.

## Usage

To start a pool creation, you send a `DeployPool` event to the `dexMachine`.

```typescript
// Example of dispatching a DeployPool event
dexMachine.send({
	type: "DeployPool",
	settings: {
		tokenA: "MINA",
		tokenB: "B62q..." // Some token address
	}
})
```

That's it !

If everything goes well, the user will be prompted to sign the transaction with their wallet once the proof has been generated.

The `dexMachine` keeps track of all `createPoolMachine` actors, which can be found in `dex.context.dex.createPool.pools`.

::: warning
Due to an underlying limitation, you will have to manually type the `createPoolMachine` actor when accessing it. Refer to the examples below for more details.
:::

## `createPoolMachine` States

The `createPoolMachine` has several states that represent the progress of the pool creation:

- `INIT`: The initial state.
- `GET_STATUS`: Fetching the status of an existing job.
- `CREATING`: A new pool creation job is being created on the server.
- `WAITING_FOR_PROOF`: The server is generating the zk-proof for the pool creation. This is the longest step.
- `SIGNING`: The machine is waiting for the user to sign the transaction with their wallet.
- `CONFIRMING`: The signed transaction is being sent to the server for confirmation.
- `COMPLETED`: The pool has been successfully created.
- `ERRORED`: An error occurred during the process. The machine might retry.
- `FAILED`: A non-recoverable error occurred.

By monitoring these states, you can provide detailed feedback to your users about the pool creation process.

## Framework Examples

You can precisely track the status of pool creation jobs in both React and Vue applications using the `@lumina-dex/sdk/react` and `@lumina-dex/sdk/vue` packages, respectively.

### Vue Example

Here's how you can track the status of pool creation jobs in a Vue application using the `@lumina-dex/sdk/vue` package.

```vue
<script lang="ts" setup>
import { computed } from "vue";
import { useActor, useSelector } from "@lumina-dex/sdk/vue";
import { type ActorRefFromLogic, dexMachine, type CreatePoolMachine } from "@lumina-dex/sdk";

const Dex = useActor(dexMachine, {
  input: {
    // ... your dex machine input
  },
});

const creatingPools = computed(() => {
  const createPool = Dex.snapshot.value.context.dex.createPool;
  if (!createPool || !createPool.pools) {
    return [];
  }
  return Object.entries(createPool.pools).map(([poolId, p]) => {
    const poolActor = p as ActorRefFromLogic<CreatePoolMachine>;
    return {
      id: poolId,
      state: useSelector(poolActor, (state) => ({
        status: state.value,
        context: state.context,
      })),
    };
  });
});
</script>

<template>
  <div>
    <h2>Pool Creation Status</h2>
    <div v-if="creatingPools.length === 0">No pool creation in progress.</div>
    <div v-for="pool in creatingPools" :key="pool.id">
      <h3>Job ID: {{ pool.id }}</h3>
      <pre>{{ pool.state }}</pre>
    </div>
  </div>
</template>
```

### React Example

For React applications, you can use the `@lumina-dex/sdk/react` package to achieve a similar result.

```tsx
import {
	type ActorRefFromLogic,
	type CreatePoolMachine,
	dexMachine
} from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import React, { useContext } from "react"

// Assuming you have a LuminaContext that provides the Dex actor
// import { LuminaContext } from "./LuminaContext"

export const PoolCreationStatus = () => {
	const { Dex } = useContext(LuminaContext)
	const createPool = useSelector(Dex, (state) => state.context.dex.createPool)

	if (!createPool || !createPool.pools) {
		return <div>No pool creation in progress.</div>
	}

	const creatingPools = Object.entries(createPool.pools).map(([poolId, p]) => {
		const poolActor = p as ActorRefFromLogic<CreatePoolMachine>
		return {
			id: poolId,
			actor: poolActor
		}
	})

	if (creatingPools.length === 0) {
		return <div>No pool creation in progress.</div>
	}

	return (
		<div>
			<h2>Pool Creation Status</h2>
			{creatingPools.map((pool) => (
				<PoolCreationJob key={pool.id} id={pool.id} actor={pool.actor} />
			))}
		</div>
	)
}

const PoolCreationJob = ({
	id,
	actor
}: {
	id: string
	actor: ActorRefFromLogic<CreatePoolMachine>
}) => {
	const poolState = useSelector(actor, (state) => ({
		status: state.value,
		context: state.context
	}))

	return (
		<div>
			<h3>Job ID: {id}</h3>
			<pre>{JSON.stringify(poolState, null, 2)}</pre>
		</div>
	)
}
```
