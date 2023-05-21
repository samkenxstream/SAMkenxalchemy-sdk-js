[alchemy-sdk](../README.md) / [Exports](../modules.md) / MinedTransactionWebhook

# Interface: MinedTransactionWebhook

A Mined Transaction Webhook is used to notify your app whenever a transaction
sent through your API key gets successfully mined. This is useful if you want
to notify customers that their transaction went through.

## Hierarchy

- [`Webhook`](Webhook.md)

  ↳ **`MinedTransactionWebhook`**

## Table of contents

### Properties

- [appId](MinedTransactionWebhook.md#appid)
- [id](MinedTransactionWebhook.md#id)
- [isActive](MinedTransactionWebhook.md#isactive)
- [network](MinedTransactionWebhook.md#network)
- [signingKey](MinedTransactionWebhook.md#signingkey)
- [timeCreated](MinedTransactionWebhook.md#timecreated)
- [type](MinedTransactionWebhook.md#type)
- [url](MinedTransactionWebhook.md#url)
- [version](MinedTransactionWebhook.md#version)

## Properties

### appId

• `Optional` **appId**: `string`

The app id of the app used for the webhook. This field is only present on
[MinedTransactionWebhook](MinedTransactionWebhook.md) and [DroppedTransactionWebhook](DroppedTransactionWebhook.md)

#### Inherited from

[Webhook](Webhook.md).[appId](Webhook.md#appid)

#### Defined in

[src/types/types.ts:2141](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2141)

___

### id

• **id**: `string`

The webhook's unique id.

#### Inherited from

[Webhook](Webhook.md).[id](Webhook.md#id)

#### Defined in

[src/types/types.ts:2122](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2122)

___

### isActive

• **isActive**: `boolean`

Whether the webhook is currently active

#### Inherited from

[Webhook](Webhook.md).[isActive](Webhook.md#isactive)

#### Defined in

[src/types/types.ts:2130](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2130)

___

### network

• **network**: [`Network`](../enums/Network.md)

The network the webhook is on.

#### Inherited from

[Webhook](Webhook.md).[network](Webhook.md#network)

#### Defined in

[src/types/types.ts:2124](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2124)

___

### signingKey

• **signingKey**: `string`

The signing key used to verify payloads for the webhook.

#### Inherited from

[Webhook](Webhook.md).[signingKey](Webhook.md#signingkey)

#### Defined in

[src/types/types.ts:2134](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2134)

___

### timeCreated

• **timeCreated**: `string`

The creation time of the webhook as an ISO string.

#### Inherited from

[Webhook](Webhook.md).[timeCreated](Webhook.md#timecreated)

#### Defined in

[src/types/types.ts:2132](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2132)

___

### type

• **type**: [`MINED_TRANSACTION`](../enums/WebhookType.md#mined_transaction)

The type of webhook.

#### Overrides

[Webhook](Webhook.md).[type](Webhook.md#type)

#### Defined in

[src/types/types.ts:2166](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2166)

___

### url

• **url**: `string`

The url that the webhook sends its payload to.

#### Inherited from

[Webhook](Webhook.md).[url](Webhook.md#url)

#### Defined in

[src/types/types.ts:2128](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2128)

___

### version

• **version**: [`WebhookVersion`](../enums/WebhookVersion.md)

The webhook version. All newly created webhooks default to V2.

#### Inherited from

[Webhook](Webhook.md).[version](Webhook.md#version)

#### Defined in

[src/types/types.ts:2136](https://github.com/alchemyplatform/alchemy-sdk-js/blob/905f87c/src/types/types.ts#L2136)
