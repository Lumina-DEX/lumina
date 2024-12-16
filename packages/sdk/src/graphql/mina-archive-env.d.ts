// dprint-ignore-file
/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'ActionData': { kind: 'OBJECT'; name: 'ActionData'; fields: { 'accountUpdateId': { name: 'accountUpdateId'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'data': { name: 'data'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; } }; 'transactionInfo': { name: 'transactionInfo'; type: { kind: 'OBJECT'; name: 'TransactionInfo'; ofType: null; } }; }; };
    'ActionFilterOptionsInput': { kind: 'INPUT_OBJECT'; name: 'ActionFilterOptionsInput'; isOneOf: false; inputFields: [{ name: 'address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }, { name: 'tokenId'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'status'; type: { kind: 'ENUM'; name: 'BlockStatusFilter'; ofType: null; }; defaultValue: null }, { name: 'to'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }, { name: 'from'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }, { name: 'fromActionState'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'endActionState'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }]; };
    'ActionOutput': { kind: 'OBJECT'; name: 'ActionOutput'; fields: { 'actionData': { name: 'actionData'; type: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'ActionData'; ofType: null; }; } }; 'actionState': { name: 'actionState'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'ActionStates'; ofType: null; }; } }; 'blockInfo': { name: 'blockInfo'; type: { kind: 'OBJECT'; name: 'BlockInfo'; ofType: null; } }; 'transactionInfo': { name: 'transactionInfo'; type: { kind: 'OBJECT'; name: 'TransactionInfo'; ofType: null; } }; }; };
    'ActionStates': { kind: 'OBJECT'; name: 'ActionStates'; fields: { 'actionStateFive': { name: 'actionStateFive'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'actionStateFour': { name: 'actionStateFour'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'actionStateOne': { name: 'actionStateOne'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'actionStateThree': { name: 'actionStateThree'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'actionStateTwo': { name: 'actionStateTwo'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'BlockInfo': { kind: 'OBJECT'; name: 'BlockInfo'; fields: { 'chainStatus': { name: 'chainStatus'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'distanceFromMaxBlockHeight': { name: 'distanceFromMaxBlockHeight'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'globalSlotSinceGenesis': { name: 'globalSlotSinceGenesis'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'globalSlotSinceHardfork': { name: 'globalSlotSinceHardfork'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'height': { name: 'height'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'ledgerHash': { name: 'ledgerHash'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'parentHash': { name: 'parentHash'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'stateHash': { name: 'stateHash'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'timestamp': { name: 'timestamp'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
    'BlockStatusFilter': { name: 'BlockStatusFilter'; enumValues: 'ALL' | 'PENDING' | 'CANONICAL'; };
    'Boolean': unknown;
    'EventData': { kind: 'OBJECT'; name: 'EventData'; fields: { 'data': { name: 'data'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; } }; 'transactionInfo': { name: 'transactionInfo'; type: { kind: 'OBJECT'; name: 'TransactionInfo'; ofType: null; } }; }; };
    'EventFilterOptionsInput': { kind: 'INPUT_OBJECT'; name: 'EventFilterOptionsInput'; isOneOf: false; inputFields: [{ name: 'address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; }; defaultValue: null }, { name: 'tokenId'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'status'; type: { kind: 'ENUM'; name: 'BlockStatusFilter'; ofType: null; }; defaultValue: null }, { name: 'to'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }, { name: 'from'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }]; };
    'EventOutput': { kind: 'OBJECT'; name: 'EventOutput'; fields: { 'blockInfo': { name: 'blockInfo'; type: { kind: 'OBJECT'; name: 'BlockInfo'; ofType: null; } }; 'eventData': { name: 'eventData'; type: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'EventData'; ofType: null; }; } }; }; };
    'Int': unknown;
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'actions': { name: 'actions'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'ActionOutput'; ofType: null; }; }; } }; 'events': { name: 'events'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'EventOutput'; ofType: null; }; }; } }; }; };
    'String': unknown;
    'TransactionInfo': { kind: 'OBJECT'; name: 'TransactionInfo'; fields: { 'authorizationKind': { name: 'authorizationKind'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'hash': { name: 'hash'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'memo': { name: 'memo'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'status': { name: 'status'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: 'mina-archive';
  query: 'Query';
  mutation: never;
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';
